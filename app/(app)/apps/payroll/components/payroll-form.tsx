"use client"

import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { SettingsMap } from "@/models/settings"
import { User } from "@/prisma/client"
import { AlertCircle, CheckCircle2, Download, FileText, Loader2 } from "lucide-react"
import { useState } from "react"
import { PayrollResult, formatEuro } from "../calculator"
import { generatePayslipAction } from "../actions"

interface PayrollFormProps {
  user: User
  settings: SettingsMap
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function PayrollForm({ user, settings }: PayrollFormProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = MONTHS[new Date().getMonth()]

  const [grossSalary, setGrossSalary] = useState("")
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(String(currentYear))
  const [ytdGross, setYtdGross] = useState("0")
  const [ytdPaye, setYtdPaye] = useState("0")
  const [ytdUsc, setYtdUsc] = useState("0")
  const [ytdPrsi, setYtdPrsi] = useState("0")
  const [saveTransaction, setSaveTransaction] = useState(true)

  const [result, setResult] = useState<PayrollResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const taxCredits = parseFloat(settings["payroll_tax_credits"] || "4000")
  const cutOff = parseFloat(settings["payroll_standard_rate_cutoff"] || "44000")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)
    setPdfUrl(null)

    const res = await generatePayslipAction({
      grossMonthlySalary: parseFloat(grossSalary),
      annualTaxCredits: taxCredits,
      annualStandardRateCutOff: cutOff,
      ytdGross: parseFloat(ytdGross || "0"),
      ytdPaye: parseFloat(ytdPaye || "0"),
      ytdUsc: parseFloat(ytdUsc || "0"),
      ytdPrsi: parseFloat(ytdPrsi || "0"),
      payPeriod: `${month} ${year}`,
      directorName: user.name,
      directorPpsn: settings["company_ppsn"] || "",
      companyName: user.businessName || "My Company Ltd.",
      companyAddress: user.businessAddress || "",
      companyVatNumber: settings["company_vat_number"] || undefined,
      companyCroNumber: settings["company_cro_number"] || undefined,
      saveTransaction,
    })

    setLoading(false)

    if (!res.success || !res.result) {
      setError(res.error || "Failed to generate payslip")
      return
    }

    setResult(res.result)
    setSaved(res.saved || false)
    if (res.pdfBase64) {
      const blob = new Blob(
        [Uint8Array.from(atob(res.pdfBase64), (c) => c.charCodeAt(0))],
        { type: "application/pdf" }
      )
      setPdfUrl(URL.createObjectURL(blob))
    }
  }

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-base">Pay Period & Salary</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                min="2024"
                max="2030"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gross Monthly Salary (€)</label>
            <input
              type="number"
              value={grossSalary}
              onChange={(e) => setGrossSalary(e.target.value)}
              placeholder="e.g. 4000"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="p-3 bg-muted/40 rounded-md text-xs text-muted-foreground space-y-1">
            <p><strong>Tax Credits:</strong> €{taxCredits.toLocaleString()} / year</p>
            <p><strong>Standard Rate Cut-Off:</strong> €{cutOff.toLocaleString()} / year</p>
            <p className="text-xs">Change these in Settings → Business → Irish Company Details</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-base">Year-to-Date Figures (Before This Period)</h3>
          <p className="text-xs text-muted-foreground">
            Enter the cumulative totals from all previous pay periods this tax year. Leave as 0 for the first payroll run.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">YTD Gross (€)</label>
              <input
                type="number"
                value={ytdGross}
                onChange={(e) => setYtdGross(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">YTD PAYE (€)</label>
              <input
                type="number"
                value={ytdPaye}
                onChange={(e) => setYtdPaye(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">YTD USC (€)</label>
              <input
                type="number"
                value={ytdUsc}
                onChange={(e) => setYtdUsc(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">YTD PRSI (€)</label>
              <input
                type="number"
                value={ytdPrsi}
                onChange={(e) => setYtdPrsi(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={saveTransaction}
              onChange={(e) => setSaveTransaction(e.target.checked)}
              className="rounded"
            />
            Auto-log salary & tax liability as transactions
          </label>
        </div>
      </div>

      {/* Submit */}
      <form onSubmit={handleSubmit}>
        <Button type="submit" disabled={loading || !grossSalary} className="w-full md:w-auto">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating...</>
          ) : (
            <><FileText className="w-4 h-4 mr-2" /> Generate Payslip</>
          )}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-xs text-green-700 font-medium mb-1">Gross Pay</p>
              <p className="text-2xl font-bold text-green-800">{formatEuro(result.grossPay)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-xs text-red-700 font-medium mb-1">Total Deductions</p>
              <p className="text-2xl font-bold text-red-800">{formatEuro(result.totalDeductions)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-xs text-blue-700 font-medium mb-1">Net Pay</p>
              <p className="text-2xl font-bold text-blue-800">{formatEuro(result.netPay)}</p>
            </div>
          </div>

          {/* Deductions table */}
          <div>
            <h3 className="font-semibold mb-3">Deductions Breakdown</h3>
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-right p-3 font-medium">Taxable Amount</th>
                  <th className="text-right p-3 font-medium">Rate</th>
                  <th className="text-right p-3 font-medium">Deduction</th>
                </tr>
              </thead>
              <tbody>
                {result.payeBreakdown.map((row, i) => (
                  <tr key={`paye-${i}`} className="border-t">
                    <td className="p-3">PAYE — {row.band}</td>
                    <td className="p-3 text-right">{formatEuro(row.amount)}</td>
                    <td className="p-3 text-right">{row.rate}%</td>
                    <td className="p-3 text-right text-red-600">{formatEuro(row.tax)}</td>
                  </tr>
                ))}
                {result.uscBreakdown.map((row, i) => (
                  <tr key={`usc-${i}`} className="border-t bg-muted/20">
                    <td className="p-3">USC — {row.band}</td>
                    <td className="p-3 text-right">{formatEuro(row.amount)}</td>
                    <td className="p-3 text-right">{row.rate.toFixed(1)}%</td>
                    <td className="p-3 text-right text-red-600">{formatEuro(row.tax)}</td>
                  </tr>
                ))}
                <tr className="border-t">
                  <td className="p-3">PRSI — Class S (Proprietary Director)</td>
                  <td className="p-3 text-right">{formatEuro(result.grossPay)}</td>
                  <td className="p-3 text-right">{result.prsiRate}%</td>
                  <td className="p-3 text-right text-red-600">{formatEuro(result.prsi)}</td>
                </tr>
                <tr className="border-t bg-red-50 font-semibold">
                  <td className="p-3">Total Deductions</td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right text-red-700">{formatEuro(result.totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* YTD */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm">Year-to-Date (Including This Period)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              {[
                { label: "YTD Gross", value: result.ytdGross },
                { label: "YTD PAYE", value: result.ytdPaye },
                { label: "YTD USC", value: result.ytdUsc },
                { label: "YTD PRSI", value: result.ytdPrsi },
                { label: "YTD Net", value: result.ytdNet },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-semibold">{formatEuro(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ROS Reminder */}
          <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
            <p className="font-semibold text-yellow-800 text-sm mb-1">Revenue Submission Required (PAYE Modernisation)</p>
            <p className="text-yellow-700 text-xs">
              You must submit this payroll run to Revenue via <strong>ROS</strong> on or before the pay date.
              Log in at <strong>ros.ie</strong> → Employer Services → Payroll Submissions.
              The PAYE/USC/PRSI liability of <strong>{formatEuro(result.paye + result.usc + result.prsi)}</strong> is due to Revenue by the <strong>23rd of the following month</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {pdfUrl && (
              <a href={pdfUrl} download={`payslip-${result.payPeriod.replace(" ", "-")}.pdf`}>
                <Button variant="default">
                  <Download className="w-4 h-4 mr-2" />
                  Download Payslip PDF
                </Button>
              </a>
            )}
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Salary & tax transactions saved to TaxTicks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
