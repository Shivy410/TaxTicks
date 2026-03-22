"use server"

import { getCurrentUser } from "@/lib/auth"
import { createTransaction } from "@/models/transactions"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { PayrollInput, calculatePayroll } from "./calculator"
import { PayslipPDF } from "./components/payslip-pdf"

export interface GeneratePayslipInput extends PayrollInput {
  saveTransaction: boolean
}

export interface GeneratePayslipResult {
  success: boolean
  error?: string
  result?: Awaited<ReturnType<typeof calculatePayroll>>
  pdfBase64?: string
  saved?: boolean
}

export async function generatePayslipAction(
  input: GeneratePayslipInput
): Promise<GeneratePayslipResult> {
  try {
    const user = await getCurrentUser()

    // 1. Calculate payroll
    const result = calculatePayroll(input)

    // 2. Generate PDF
    const pdfElement = createElement(PayslipPDF, { result })
    const buffer = await renderToBuffer(pdfElement as any)
    const pdfBase64 = Buffer.from(buffer).toString("base64")

    // 3. Optionally save transactions
    let saved = false
    if (input.saveTransaction) {
      const issuedDate = new Date()
      // Try to parse the pay period month/year for a more accurate date
      try {
        const parsed = new Date(`1 ${input.payPeriod}`)
        if (!isNaN(parsed.getTime())) {
          // Set to last day of the month
          issuedDate.setFullYear(parsed.getFullYear(), parsed.getMonth() + 1, 0)
        }
      } catch {}

      // Transaction 1: Gross Salary expense
      await createTransaction(user.id, {
        name: `Salary — ${input.payPeriod}`,
        description: `Director salary for ${input.payPeriod}. Gross: €${result.grossPay.toFixed(2)}, Net: €${result.netPay.toFixed(2)}`,
        merchant: result.companyName,
        total: Math.round(result.grossPay * 100), // stored in cents
        currencyCode: "EUR",
        type: "expense",
        categoryCode: "payroll_salary",
        projectCode: "internal",
        issuedAt: issuedDate,
        note: `PAYE: €${result.paye.toFixed(2)} | USC: €${result.usc.toFixed(2)} | PRSI: €${result.prsi.toFixed(2)}`,
      })

      // Transaction 2: PAYE/USC/PRSI liability payable to Revenue
      const totalTax = result.paye + result.usc + result.prsi
      await createTransaction(user.id, {
        name: `Revenue PAYE/USC/PRSI — ${input.payPeriod}`,
        description: `Payroll tax liability for ${input.payPeriod}. PAYE: €${result.paye.toFixed(2)}, USC: €${result.usc.toFixed(2)}, PRSI: €${result.prsi.toFixed(2)}`,
        merchant: "Revenue Commissioners",
        total: Math.round(totalTax * 100), // stored in cents
        currencyCode: "EUR",
        type: "expense",
        categoryCode: "payroll_prsi",
        projectCode: "internal",
        issuedAt: issuedDate,
        note: `Due to Revenue by 23rd of following month. Submit via ROS.`,
      })

      saved = true
    }

    return {
      success: true,
      result,
      pdfBase64,
      saved,
    }
  } catch (error) {
    console.error("Payslip generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
