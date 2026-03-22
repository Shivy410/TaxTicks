import { getCurrentUser } from "@/lib/auth"
import { getEmployeeById, getPayslipsByEmployee } from "@/models/employees"
import { notFound } from "next/navigation"
import { EmployeeForm } from "../components/employee-form"
import { PayslipHistory } from "../../components/payslip-history"

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
          <PayslipHistory employeeId={employee.id} payslips={payslips} />
        </div>
      </div>
    </div>
  )
}
