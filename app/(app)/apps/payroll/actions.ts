"use server"

import { getCurrentUser } from "@/lib/auth"
import { createTransaction, deleteTransaction } from "@/models/transactions"
import {
  createPayslipRecord,
  deletePayslipRecord,
  getLatestPayslipForEmployee,
  getPayslipById,
} from "@/models/employees"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { PayrollInput, calculatePayroll } from "./calculator"
import { PayslipPDF } from "./components/payslip-pdf"
import { revalidatePath } from "next/cache"

export interface GeneratePayslipInput extends PayrollInput {
  saveTransaction: boolean
  employeeId?: string
}

export interface GeneratePayslipResult {
  success: boolean
  error?: string
  result?: Awaited<ReturnType<typeof calculatePayroll>>
  pdfBase64?: string
  saved?: boolean
}

export interface DeletePayslipRunResult {
  success: boolean
  error?: string
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

    let saved = false
    const issuedDate = new Date(input.payYear, input.payMonth, 0)
    let salaryTransactionId: string | null = null
    let liabilityTransactionId: string | null = null

    // 3. Optionally save transactions
    if (input.saveTransaction) {
      // Transaction 1: Gross Salary expense
      const salaryTransaction = await createTransaction(user.id, {
        name: `Salary — ${input.payPeriod}`,
        description: `${result.employeeRole} salary for ${input.payPeriod}. Gross: €${result.grossPay.toFixed(2)}, Net: €${result.netPay.toFixed(2)}`,
        merchant: result.companyName,
        total: Math.round(result.grossPay * 100), // stored in cents
        currencyCode: "EUR",
        type: "expense",
        categoryCode: "payroll_salary",
        projectCode: "internal",
        issuedAt: issuedDate,
        note: `PAYE: €${result.paye.toFixed(2)} | USC: €${result.usc.toFixed(2)} | PRSI: €${result.prsi.toFixed(2)}`,
      })
      salaryTransactionId = salaryTransaction.id

      // Transaction 2: PAYE/USC/PRSI liability payable to Revenue
      const totalTax = result.paye + result.usc + result.prsi
      const liabilityTransaction = await createTransaction(user.id, {
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
      liabilityTransactionId = liabilityTransaction.id

      saved = true
    }

    // Persist payslip history even when bookkeeping transactions are skipped.
    if (input.employeeId) {
      await createPayslipRecord(user.id, {
        employeeId: input.employeeId,
        payPeriod: input.payPeriod,
        grossPay: result.grossPay,
        paye: result.paye,
        usc: result.usc,
        prsi: result.prsi,
        totalDeductions: result.totalDeductions,
        netPay: result.netPay,
        ytdGross: input.ytdGross,
        ytdPaye: input.ytdPaye,
        ytdUsc: input.ytdUsc,
        ytdPrsi: input.ytdPrsi,
        salaryTransactionId,
        liabilityTransactionId,
      })
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

export async function deletePayslipRunAction(payslipId: string): Promise<DeletePayslipRunResult> {
  try {
    const user = await getCurrentUser()
    const payslip = await getPayslipById(payslipId, user.id)

    if (!payslip) {
      return { success: false, error: "Payslip not found" }
    }

    const latestPayslip = await getLatestPayslipForEmployee(payslip.employeeId, user.id)
    if (!latestPayslip || latestPayslip.id !== payslip.id) {
      return {
        success: false,
        error: "Only the latest payslip can be deleted safely. Delete newer payroll runs first.",
      }
    }

    if (payslip.salaryTransactionId) {
      await deleteTransaction(payslip.salaryTransactionId, user.id)
    }

    if (payslip.liabilityTransactionId) {
      await deleteTransaction(payslip.liabilityTransactionId, user.id)
    }

    await deletePayslipRecord(payslip.id, user.id)

    revalidatePath("/apps/payroll")
    revalidatePath("/apps/payroll/employees")
    revalidatePath(`/apps/payroll/employees/${payslip.employeeId}`)
    revalidatePath("/transactions")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete payslip run:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete payslip run",
    }
  }
}
