import { EmployeeForm } from "../components/employee-form"

export default function NewEmployeePage() {
  return (
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Add Employee</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a new employee or director to the payroll registry.
        </p>
      </header>
      <EmployeeForm />
    </div>
  )
}
