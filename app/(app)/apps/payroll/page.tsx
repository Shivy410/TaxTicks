import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"
import { getEmployees, getLatestPayslipForEmployee, getPayslipsByEmployee } from "@/models/employees"
import { PayrollForm } from "./components/payroll-form"
import { PayslipHistory } from "./components/payslip-history"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Briefcase, AlertTriangle } from "lucide-react"

interface PayrollPageProps {
  searchParams: Promise<{ employeeId?: string }>
}

export default async function PayrollApp({ searchParams }: PayrollPageProps) {
  const resolvedParams = await searchParams
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)
  const employees = await getEmployees(user.id)

  const selectedEmployeeId = resolvedParams.employeeId || employees[0]?.id || null
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || null

  // Load YTD figures from the latest payslip for the selected employee
  const latestPayslip = selectedEmployee
    ? await getLatestPayslipForEmployee(selectedEmployee.id, user.id)
    : null
  const payslips = selectedEmployee
    ? await getPayslipsByEmployee(selectedEmployee.id, user.id)
    : []

  const missingFields: string[] = []
  if (!user.businessName) missingFields.push("Business Name")
  if (!settings["company_ppsn"] && !selectedEmployee?.ppsn) missingFields.push("Director PPSN")

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Irish Payroll</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Calculate PAYE, USC &amp; PRSI for director and employee payroll. Generates a compliant payslip PDF.
          </p>
        </div>
        <Link href="/apps/payroll/employees">
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Registry
            {employees.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {employees.length}
              </span>
            )}
          </Button>
        </Link>
      </header>

      {/* No employees yet */}
      {employees.length === 0 && (
        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">No employees in the registry yet</p>
            <p>
              Add yourself as a director first to enable employee-specific payslips with individual tax settings.{" "}
              <Link href="/apps/payroll/employees/new" className="underline hover:no-underline font-medium">
                Add Employee →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Missing profile fields */}
      {missingFields.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Complete your profile for accurate payslips</p>
            <p>
              Missing: <strong>{missingFields.join(", ")}</strong>.{" "}
              <Link href="/settings/business" className="underline hover:no-underline">
                Update Settings → Business
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Employee Selector */}
      {employees.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Select Employee</p>
          <div className="flex flex-wrap gap-2">
            {employees.map((emp) => (
              <Link key={emp.id} href={`/apps/payroll?employeeId=${emp.id}`}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    emp.id === selectedEmployeeId
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white/60 border-white/70 text-foreground hover:bg-white/80"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  {emp.fullName}
                  {emp.isDirector && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${emp.id === selectedEmployeeId ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                      Director
                    </span>
                  )}
                </button>
              </Link>
            ))}
            <Link href="/apps/payroll/employees/new">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-white/60 transition-all">
                <UserPlus className="h-3.5 w-3.5" />
                Add Employee
              </button>
            </Link>
          </div>
        </div>
      )}

      <PayrollForm
        user={user}
        settings={settings}
        employee={selectedEmployee}
        ytdFromLastPayslip={
          latestPayslip
            ? {
                ytdGross: latestPayslip.ytdGross + latestPayslip.grossPay,
                ytdPaye: latestPayslip.ytdPaye + latestPayslip.paye,
                ytdUsc: latestPayslip.ytdUsc + latestPayslip.usc,
                ytdPrsi: latestPayslip.ytdPrsi + latestPayslip.prsi,
              }
            : null
        }
      />

      {selectedEmployee && (
        <div className="mt-8">
          <PayslipHistory
            employeeId={selectedEmployee.id}
            payslips={payslips}
            showRunPayrollButton={false}
          />
        </div>
      )}
    </div>
  )
}
