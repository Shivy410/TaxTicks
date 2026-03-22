/**
 * Revolut Business API Client
 *
 * Authentication: OAuth 2.0 with JWT client assertion (RS256)
 * Docs: https://developer.revolut.com/docs/business/business-api
 *
 * Flow:
 *  1. User generates RSA key pair and uploads public cert to Revolut
 *  2. Revolut provides a ClientID
 *  3. App signs a JWT with the private key → exchanges for access_token + refresh_token
 *  4. access_token expires in 40 min → use refresh_token to get a new one
 *  5. All API calls use Bearer <access_token>
 */

import { SignJWT, importPKCS8 } from "jose"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RevolutCredentials {
  clientId: string
  privateKeyPem: string     // RSA private key in PKCS#8 PEM format
  redirectUri: string       // Must match what was registered in Revolut
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: number   // Unix timestamp (ms)
  isSandbox?: boolean
}

export interface RevolutTransaction {
  id: string
  type: string              // card_payment, transfer, fee, topup, etc.
  state: string             // completed, pending, failed, reverted
  request_id?: string
  created_at: string        // ISO 8601
  updated_at: string
  completed_at?: string
  merchant?: {
    name: string
    city?: string
    category_code?: string
    country?: string
  }
  reference?: string
  legs: {
    leg_id: string
    account_id: string
    amount: number          // negative = debit, positive = credit
    fee?: number
    currency: string
    bill_amount?: number
    bill_currency?: string
    description?: string
    balance?: number
  }[]
}

export interface RevolutAccount {
  id: string
  name: string
  balance: number
  currency: string
  state: string
  public: boolean
  updated_at: string
}

export interface RevolutSyncResult {
  imported: number
  skipped: number
  errors: string[]
  lastSyncedAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCTION_BASE = "https://b2b.revolut.com/api/1.0"
const SANDBOX_BASE = "https://sandbox-b2b.revolut.com/api/1.0"
const AUTH_BASE_PRODUCTION = "https://b2b.revolut.com/api/1.0"
const AUTH_BASE_SANDBOX = "https://sandbox-b2b.revolut.com/api/1.0"

// ─── JWT Client Assertion ─────────────────────────────────────────────────────

/**
 * Generate a signed JWT client assertion for Revolut OAuth token exchange.
 * The JWT must be signed with the private key whose public cert was uploaded to Revolut.
 */
export async function generateClientAssertion(
  clientId: string,
  privateKeyPem: string,
  redirectUri: string,
  isSandbox = false
): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, "RS256")
  const issuerDomain = new URL(redirectUri).hostname

  const authBase = isSandbox ? AUTH_BASE_SANDBOX : AUTH_BASE_PRODUCTION

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setIssuer(issuerDomain)
    .setSubject(clientId)
    .setAudience(`${authBase}/auth`)
    .setExpirationTime("1h")
    .sign(privateKey)

  return jwt
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

/**
 * Exchange an authorization code for access + refresh tokens.
 * Called once during initial setup after the user consents in Revolut.
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  privateKeyPem: string,
  redirectUri: string,
  isSandbox = false
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const clientAssertion = await generateClientAssertion(clientId, privateKeyPem, redirectUri, isSandbox)
  const authBase = isSandbox ? AUTH_BASE_SANDBOX : AUTH_BASE_PRODUCTION

  const response = await fetch(`${authBase}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut token exchange failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 2400, // 40 minutes default
  }
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  privateKeyPem: string,
  redirectUri: string,
  isSandbox = false
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const clientAssertion = await generateClientAssertion(clientId, privateKeyPem, redirectUri, isSandbox)
  const authBase = isSandbox ? AUTH_BASE_SANDBOX : AUTH_BASE_PRODUCTION

  const response = await fetch(`${authBase}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut token refresh failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in || 2400) * 1000,
  }
}

// ─── API Client ───────────────────────────────────────────────────────────────

export class RevolutClient {
  private baseUrl: string
  private accessToken: string

  constructor(accessToken: string, isSandbox = false) {
    this.baseUrl = isSandbox ? SANDBOX_BASE : PRODUCTION_BASE
    this.accessToken = accessToken
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Revolut API error ${response.status}: ${error}`)
    }

    return response.json()
  }

  /** Get all accounts */
  async getAccounts(): Promise<RevolutAccount[]> {
    return this.request<RevolutAccount[]>("/accounts")
  }

  /**
   * Get transactions with optional filters.
   * Max 1000 per request. Paginate using `to` = last item's created_at.
   */
  async getTransactions(params: {
    from?: string
    to?: string
    count?: number
    account?: string
    type?: string
  } = {}): Promise<RevolutTransaction[]> {
    const queryParams: Record<string, string> = {}
    if (params.from) queryParams.from = params.from
    if (params.to) queryParams.to = params.to
    if (params.count) queryParams.count = String(params.count)
    if (params.account) queryParams.account = params.account
    if (params.type) queryParams.type = params.type

    return this.request<RevolutTransaction[]>("/transactions", queryParams)
  }

  /**
   * Fetch all transactions since a given date, handling pagination automatically.
   */
  async getAllTransactionsSince(fromDate: string, accountId?: string): Promise<RevolutTransaction[]> {
    const all: RevolutTransaction[] = []
    let to: string | undefined = undefined

    while (true) {
      const batch = await this.getTransactions({
        from: fromDate,
        to,
        count: 1000,
        account: accountId,
      })

      if (batch.length === 0) break
      all.push(...batch)

      // If we got fewer than 1000, we've reached the end
      if (batch.length < 1000) break

      // Paginate: use the created_at of the last item as the next `to`
      to = batch[batch.length - 1].created_at
    }

    return all
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map a Revolut transaction to TaxTicks transaction fields.
 */
export function mapRevolutTransaction(tx: RevolutTransaction): {
  name: string
  description: string
  merchant: string
  total: number
  currencyCode: string
  type: "income" | "expense"
  issuedAt: Date
  note: string
  revolutId: string
} {
  const leg = tx.legs[0]
  const amount = leg?.amount ?? 0
  const currency = leg?.currency ?? "EUR"

  // Determine transaction name
  const merchant = tx.merchant?.name || leg?.description || tx.type || "Unknown"

  // Determine type: positive amount = income (credit), negative = expense (debit)
  const type: "income" | "expense" = amount >= 0 ? "income" : "expense"

  // Total stored in cents (absolute value)
  const totalCents = Math.round(Math.abs(amount) * 100)

  const description = [
    tx.type,
    tx.reference,
    tx.merchant?.city,
    tx.merchant?.country,
  ].filter(Boolean).join(" | ")

  return {
    name: merchant,
    description,
    merchant,
    total: totalCents,
    currencyCode: currency,
    type,
    issuedAt: new Date(tx.completed_at || tx.created_at),
    note: `Revolut ${tx.type} | State: ${tx.state}`,
    revolutId: tx.id,
  }
}

/**
 * Build the Revolut OAuth consent URL.
 * User must visit this URL and approve access.
 */
export function buildConsentUrl(clientId: string, redirectUri: string, isSandbox = false): string {
  const base = isSandbox
    ? "https://sandbox-business.revolut.com/app-confirm"
    : "https://business.revolut.com/app-confirm"

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "READ",
  })

  return `${base}?${params.toString()}`
}
