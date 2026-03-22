import { getCurrentUser } from "@/lib/auth"
import { getEmployees } from "@/models/employees"
import Link from "next/link"
import { UserPlus, Pencil, Briefcase, BadgeCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function EmployeesPage() {
  const user = await getCurrentUser()
  const employees = await getEmployees(user.id)

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Registry</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage employees and directors for payroll. Tax settings are stored per employee.
          </p>
        </div>
        <Link href="/apps/payroll/employees/new">
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </header>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/60 backdrop-blur-md rounded-2xl border border-white/70">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Briefcase className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Add yourself as a director first to start generating payslips. You can add more employees later.
          </p>
          <Link href="/apps/payroll/employees/new">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add First Employee
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm hover:shadow-md transition-all duration-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {emp.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold tracking-tight">{emp.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {emp.isDirector ? "Director" : "Employee"} · PRSI Class {emp.prsiClass}
                    </p>
                  </div>
                </div>
                {emp.isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <UserX className="h-3 w-3" /> Inactive
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">PPSN</p>
                  <p className="font-medium">{emp.ppsn || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="font-medium truncate">{emp.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tax Credits</p>
                  <p className="font-medium">€{emp.annualTaxCredits.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Rate Cut-Off</p>
                  <p className="font-medium">€{emp.standardRateCutOff.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/apps/payroll?employeeId=${emp.id}`} className="flex-1">
                  <Button variant="default" size="sm" className="w-full">
                    <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                    Run Payroll
                  </Button>
                </Link>
                <Link href={`/apps/payroll/employees/${emp.id}`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/apps/payroll">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            ← Back to Payroll
          </Button>
        </Link>
      </div>
    </div>
  )
}
