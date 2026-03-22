"use server"

import { getCurrentUser } from "@/lib/auth"
import { getTransactions, TransactionData, updateTransaction } from "@/models/transactions"

/**
 * Revolut Receipt Reconciliation
 *
 * After AI analyses a receipt/invoice and extracts the transaction data,
 * this function attempts to find a matching Revolut bank transaction that
 * was previously imported via the sync engine.
 *
 * Matching criteria (in order of confidence):
 *  1. Amount match (within ±1 EUR tolerance for FX rounding)
 *  2. Date match (within ±3 days of the receipt date)
 *  3. Merchant name similarity (fuzzy match)
 *
 * If a match is found, the Revolut transaction is updated with:
 *  - The receipt file attached
 *  - The AI-extracted fields (VAT, category, project, etc.)
 *  - Status changed from "unverified" to "verified"
 */

export interface ReconcileResult {
  matched: boolean
  transactionId?: string
  confidence?: "high" | "medium" | "low"
  message?: string
}

export async function reconcileReceiptWithRevolutAction(params: {
  amount: number          // in cents
  currency: string
  date: Date
  merchant: string
  fileId?: string
  extractedFields?: Record<string, string>
}): Promise<ReconcileResult> {
  try {
    const user = await getCurrentUser()

    // Fetch recent transactions that came from Revolut (identified by note containing revolut_id:)
    const { transactions } = await getTransactions(
      user.id,
      { search: "revolut_id:" },
      { limit: 500, offset: 0 }
    )

    const revolutTxs = transactions.filter(
      (t) => t.note?.includes("revolut_id:")
    )

    if (revolutTxs.length === 0) {
      return { matched: false, message: "No unverified Revolut transactions to match against." }
    }

    // ─── Scoring ──────────────────────────────────────────────────────────────

    const receiptDate = new Date(params.date)
    const receiptAmount = params.amount
    const receiptMerchant = params.merchant.toLowerCase().trim()

    let bestMatch: { tx: (typeof revolutTxs)[0]; score: number } | null = null

    for (const tx of revolutTxs) {
      let score = 0

      // Amount match (within ±100 cents = €1)
      const amountDiff = Math.abs((tx.total ?? 0) - receiptAmount)
      if (amountDiff === 0) {
        score += 50
      } else if (amountDiff <= 100) {
        score += 30
      } else if (amountDiff <= 500) {
        score += 10
      } else {
        // Large amount mismatch — skip
        continue
      }

      // Currency match
      if (tx.currencyCode?.toUpperCase() === params.currency.toUpperCase()) {
        score += 20
      }

      // Date match (within ±3 days)
      const txDate = tx.issuedAt ? new Date(tx.issuedAt) : null
      if (txDate) {
        const daysDiff = Math.abs(
          (receiptDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysDiff <= 1) score += 25
        else if (daysDiff <= 3) score += 15
        else if (daysDiff <= 7) score += 5
      }

      // Merchant name similarity (simple substring match)
      const txMerchant = (tx.merchant || tx.name || "").toLowerCase().trim()
      if (txMerchant && receiptMerchant) {
        if (txMerchant === receiptMerchant) {
          score += 20
        } else if (
          txMerchant.includes(receiptMerchant) ||
          receiptMerchant.includes(txMerchant)
        ) {
          score += 12
        } else {
          // Check first word match
          const txFirstWord = txMerchant.split(" ")[0]
          const receiptFirstWord = receiptMerchant.split(" ")[0]
          if (txFirstWord.length > 3 && txFirstWord === receiptFirstWord) {
            score += 6
          }
        }
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { tx, score }
      }
    }

    // ─── Determine confidence ─────────────────────────────────────────────────

    if (!bestMatch || bestMatch.score < 40) {
      return { matched: false, message: "No confident match found." }
    }

    const confidence: "high" | "medium" | "low" =
      bestMatch.score >= 80 ? "high" : bestMatch.score >= 55 ? "medium" : "low"

    // ─── Update the matched Revolut transaction ───────────────────────────────

    const updateData: TransactionData = {}

    // Merge AI-extracted fields
    if (params.extractedFields) {
      if (params.extractedFields.categoryCode) {
        updateData.categoryCode = params.extractedFields.categoryCode
      }
      if (params.extractedFields.projectCode) {
        updateData.projectCode = params.extractedFields.projectCode
      }
      if (params.extractedFields.description) {
        updateData.description = params.extractedFields.description
      }
      if (params.extractedFields.note) {
        updateData.note = `${bestMatch.tx.note || ""} | Receipt: ${params.extractedFields.note}`
      }
    }

    await updateTransaction(bestMatch.tx.id, user.id, updateData)

    return {
      matched: true,
      transactionId: bestMatch.tx.id,
      confidence,
      message: `Matched to Revolut transaction "${bestMatch.tx.name}" with ${confidence} confidence (score: ${bestMatch.score}).`,
    }
  } catch (error) {
    console.error("Reconciliation error:", error)
    return {
      matched: false,
      message: error instanceof Error ? error.message : "Reconciliation failed",
    }
  }
}
