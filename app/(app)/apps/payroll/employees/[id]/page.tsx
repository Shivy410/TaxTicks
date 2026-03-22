import { getCurrentUser } from "@/lib/auth"
import { getEmployeeById, getPayslipsByEmployee } from "@/models/employees"
import { notFound } from "next/navigation"
import { EmployeeForm } from "../components/employee-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Briefcase } from "lucide-react"

interface EditEmployeePageProps {
  params: Promise<{ id: string }>
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  const employee = await getEmployeeById(id, user.id)
  if (!employee) notFound()

  const payslips = await getPayslipsByEmployee(id, user.id)

  return (
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Edit Employee</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Update details for {employee.fullName}.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmployeeForm employee={employee} />
        </div>

        {/* Payslip History */}
        <div>
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold tracking-tight">Payslip History</h3>
              <Link href={`/apps/payroll?employeeId=${employee.id}`}>
                <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Run Payroll
                </Button>
              </Link>
            </div>

            {payslips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payslips generated yet.</p>
            ) : (
              <div className="space-y-3">
                {payslips.map((ps) => (
                  <div
                    key={ps.id}
                    className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/60 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="font-medium">{ps.payPeriod}</p>
                        <p className="text-xs text-muted-foreground">
                          Net: €{ps.netPay.toLocaleString("en-IE", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">€{ps.grossPay.toLocaleString("en-IE", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">gross</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
