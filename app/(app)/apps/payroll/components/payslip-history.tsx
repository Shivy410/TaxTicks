"use client"

import { Button } from "@/components/ui/button"
import { PayslipRecord } from "@/prisma/client"
import { AlertCircle, FileText, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useState } from "react"
import { deletePayslipRunAction } from "../actions"

interface PayslipHistoryProps {
  employeeId: string
  payslips: PayslipRecord[]
  showRunPayrollButton?: boolean
}

export function PayslipHistory({
  employeeId,
  payslips,
  showRunPayrollButton = true,
}: PayslipHistoryProps) {
  const router = useRouter()
  const [pendingPayslipId, setPendingPayslipId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(payslipId: string) {
    const confirmed = window.confirm(
      "Delete this payroll run? This removes the latest payslip record and any linked payroll transactions."
    )

    if (!confirmed) return

    setError(null)
    setPendingPayslipId(payslipId)

    const result = await deletePayslipRunAction(payslipId)
    if (!result.success) {
      setPendingPayslipId(null)
      setError(result.error ?? "Failed to delete payslip run")
      return
    }

    startTransition(() => {
      router.refresh()
      setPendingPayslipId(null)
    })
  }

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold tracking-tight">Payslip History</h3>
        {showRunPayrollButton && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/apps/payroll?employeeId=${employeeId}`}>
              Run Payroll
            </Link>
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Delete is limited to the latest payroll run so YTD figures roll back safely.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {payslips.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payslips generated yet.</p>
      ) : (
        <div className="space-y-3">
          {payslips.map((payslip, index) => {
            const isLatest = index === 0
            const isPending = pendingPayslipId === payslip.id

            return (
              <div
                key={payslip.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/60 bg-white/50 p-3 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payslip.payPeriod}</p>
                      {isLatest && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Net: €{payslip.netPay.toLocaleString("en-IE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">€{payslip.grossPay.toLocaleString("en-IE", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">gross</p>
                  </div>

                  {isLatest ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={isPending}
                      onClick={() => void handleDelete(payslip.id)}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Locked</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
