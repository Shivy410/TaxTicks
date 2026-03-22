"use server"

import { getCurrentUser } from "@/lib/auth"
import {
  RevolutClient,
  buildConsentUrl,
  exchangeCodeForTokens,
  mapRevolutTransaction,
  refreshAccessToken,
} from "@/lib/revolut"
import { createTransaction, getTransactions } from "@/models/transactions"
import { getSettings, updateSettings } from "@/models/settings"
import { revalidatePath } from "next/cache"

// ─── Settings keys used to store Revolut credentials ─────────────────────────
const KEYS = {
  clientId: "revolut_client_id",
  privateKey: "revolut_private_key",
  redirectUri: "revolut_redirect_uri",
  accessToken: "revolut_access_token",
  refreshToken: "revolut_refresh_token",
  tokenExpiresAt: "revolut_token_expires_at",
  lastSyncedAt: "revolut_last_synced_at",
  isSandbox: "revolut_is_sandbox",
  isConnected: "revolut_is_connected",
  accountId: "revolut_account_id",
}

// ─── Save Revolut credentials ─────────────────────────────────────────────────

export async function saveRevolutCredentialsAction(data: {
  clientId: string
  privateKey: string
  redirectUri: string
  isSandbox: boolean
}): Promise<{ success: boolean; error?: string; consentUrl?: string }> {
  try {
    const user = await getCurrentUser()

    await updateSettings(user.id, KEYS.clientId, data.clientId)
    await updateSettings(user.id, KEYS.privateKey, data.privateKey)
    await updateSettings(user.id, KEYS.redirectUri, data.redirectUri)
    await updateSettings(user.id, KEYS.isSandbox, data.isSandbox ? "true" : "false")
    await updateSettings(user.id, KEYS.isConnected, "false")

    // Build the consent URL for the user to visit
    const consentUrl = buildConsentUrl(data.clientId, data.redirectUri, data.isSandbox)

    revalidatePath("/apps/revolut")
    return { success: true, consentUrl }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save credentials" }
  }
}

// ─── Exchange authorization code for tokens ───────────────────────────────────

export async function exchangeRevolutCodeAction(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    const settings = await getSettings(user.id)

    const clientId = settings[KEYS.clientId]
    const privateKey = settings[KEYS.privateKey]
    const redirectUri = settings[KEYS.redirectUri]
    const isSandbox = settings[KEYS.isSandbox] === "true"

    if (!clientId || !privateKey || !redirectUri) {
      return { success: false, error: "Revolut credentials not configured. Please complete Step 1 first." }
    }

    const tokens = await exchangeCodeForTokens(code, clientId, privateKey, redirectUri, isSandbox)

    await updateSettings(user.id, KEYS.accessToken, tokens.accessToken)
    await updateSettings(user.id, KEYS.refreshToken, tokens.refreshToken)
    await updateSettings(user.id, KEYS.tokenExpiresAt, String(Date.now() + tokens.expiresIn * 1000))
    await updateSettings(user.id, KEYS.isConnected, "true")

    revalidatePath("/apps/revolut")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to exchange code" }
  }
}

// ─── Get a valid access token (auto-refresh if expired) ───────────────────────

async function getValidAccessToken(userId: string): Promise<string> {
  const settings = await getSettings(userId)

  const accessToken = settings[KEYS.accessToken]
  const refreshToken = settings[KEYS.refreshToken]
  const expiresAt = parseInt(settings[KEYS.tokenExpiresAt] || "0")
  const clientId = settings[KEYS.clientId]
  const privateKey = settings[KEYS.privateKey]
  const redirectUri = settings[KEYS.redirectUri]
  const isSandbox = settings[KEYS.isSandbox] === "true"

  if (!accessToken || !refreshToken) {
    throw new Error("Revolut not connected. Please complete the OAuth setup.")
  }

  // Refresh if token expires within 5 minutes
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(refreshToken, clientId, privateKey, redirectUri, isSandbox)
    await updateSettings(userId, KEYS.accessToken, newTokens.accessToken)
    await updateSettings(userId, KEYS.refreshToken, newTokens.refreshToken)
    await updateSettings(userId, KEYS.tokenExpiresAt, String(newTokens.expiresAt))
    return newTokens.accessToken
  }

  return accessToken
}

// ─── Fetch Revolut accounts ───────────────────────────────────────────────────

export async function getRevolutAccountsAction(): Promise<{
  success: boolean
  error?: string
  accounts?: { id: string; name: string; balance: number; currency: string }[]
}> {
  try {
    const user = await getCurrentUser()
    const settings = await getSettings(user.id)
    const isSandbox = settings[KEYS.isSandbox] === "true"

    const accessToken = await getValidAccessToken(user.id)
    const client = new RevolutClient(accessToken, isSandbox)
    const accounts = await client.getAccounts()

    return {
      success: true,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        balance: a.balance,
        currency: a.currency,
      })),
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch accounts" }
  }
}

// ─── Sync Revolut transactions ────────────────────────────────────────────────

export async function syncRevolutTransactionsAction(options: {
  fromDate?: string
  accountId?: string
} = {}): Promise<{
  success: boolean
  error?: string
  imported: number
  skipped: number
  lastSyncedAt?: string
}> {
  try {
    const user = await getCurrentUser()
    const settings = await getSettings(user.id)
    const isSandbox = settings[KEYS.isSandbox] === "true"

    const accessToken = await getValidAccessToken(user.id)
    const client = new RevolutClient(accessToken, isSandbox)

    // Default: sync from last sync date or 90 days ago
    const lastSyncedAt = settings[KEYS.lastSyncedAt]
    const fromDate =
      options.fromDate ||
      lastSyncedAt ||
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const accountId = options.accountId || settings[KEYS.accountId] || undefined

    // Fetch transactions from Revolut
    const revolutTxs = await client.getAllTransactionsSince(fromDate, accountId)

    // Get existing transaction notes to detect duplicates by Revolut ID
    const { transactions: existingTxs } = await getTransactions(user.id, {}, { limit: 10000, offset: 0 })
    const existingRevolutIds = new Set(
      existingTxs
        .filter((t) => t.note?.includes("Revolut"))
        .map((t) => {
          const match = t.note?.match(/revolut_id:([a-f0-9-]+)/i)
          return match ? match[1] : null
        })
        .filter(Boolean)
    )

    let imported = 0
    let skipped = 0

    for (const tx of revolutTxs) {
      // Skip if already imported
      if (existingRevolutIds.has(tx.id)) {
        skipped++
        continue
      }

      // Skip failed/reverted transactions
      if (tx.state === "failed" || tx.state === "reverted") {
        skipped++
        continue
      }

      const mapped = mapRevolutTransaction(tx)

      // Create transaction in TaxTicks as "unverified" (pending review)
      await createTransaction(user.id, {
        name: mapped.name,
        description: mapped.description,
        merchant: mapped.merchant,
        total: mapped.total,
        currencyCode: mapped.currencyCode,
        type: mapped.type,
        status: "unverified",
        issuedAt: mapped.issuedAt,
        note: `${mapped.note} | revolut_id:${mapped.revolutId}`,
        categoryCode: null,
        projectCode: null,
      })

      imported++
    }

    const now = new Date().toISOString()
    await updateSettings(user.id, KEYS.lastSyncedAt, now)

    revalidatePath("/transactions")
    revalidatePath("/unsorted")
    revalidatePath("/apps/revolut")

    return { success: true, imported, skipped, lastSyncedAt: now }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
      imported: 0,
      skipped: 0,
    }
  }
}

// ─── Disconnect Revolut ───────────────────────────────────────────────────────

export async function disconnectRevolutAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    await updateSettings(user.id, KEYS.isConnected, "false")
    await updateSettings(user.id, KEYS.accessToken, "")
    await updateSettings(user.id, KEYS.refreshToken, "")
    await updateSettings(user.id, KEYS.tokenExpiresAt, "")
    revalidatePath("/apps/revolut")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to disconnect" }
  }
}
