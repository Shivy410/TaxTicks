"use client"
import { Button } from "@/components/ui/button"
import { Employee } from "@/prisma/client"
import { useActionState, useState } from "react"
import { createEmployeeAction, updateEmployeeAction, deleteEmployeeAction } from "../actions"
import { ActionState } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"

interface EmployeeFormProps {
  employee?: Employee
}

const PRSI_CLASSES = [
  { value: "A1", label: "A1 — Employee (standard)" },
  { value: "S1", label: "S1 — Self-employed / Proprietary Director" },
  { value: "S0", label: "S0 — Class S low-income subclass" },
]

export function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter()
  const isEdit = !!employee
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [createState, createFormAction, isCreatePending] = useActionState<ActionState<Employee> | null, FormData>(
    createEmployeeAction,
    null
  )

  const boundUpdate = updateEmployeeAction.bind(null, employee?.id ?? "")
  const [updateState, updateFormAction, isUpdatePending] = useActionState<ActionState<Employee> | null, FormData>(
    boundUpdate,
    null
  )

  const state = isEdit ? updateState : createState
  const formAction = isEdit ? updateFormAction : createFormAction
  const isPending = isEdit ? isUpdatePending : isCreatePending

  if (state?.success) {
    router.push("/apps/payroll/employees")
  }

  async function handleDelete() {
    if (!employee) return
    await deleteEmployeeAction(employee.id)
    router.push("/apps/payroll/employees")
  }

  return (
    <form action={formAction} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm p-6 space-y-5">
      {state?.error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {state.error}
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="fullName">Full Name <span className="text-destructive">*</span></label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={employee?.fullName}
          placeholder="e.g. John Smith"
          className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={employee?.email ?? ""}
          placeholder="e.g. john@company.ie"
          className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* PPSN */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ppsn">PPSN</label>
        <input
          id="ppsn"
          name="ppsn"
          type="text"
          defaultValue={employee?.ppsn ?? ""}
          placeholder="e.g. 1234567T"
          className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* PRSI Class */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="prsiClass">PRSI Class</label>
        <select
          id="prsiClass"
          name="prsiClass"
          defaultValue={employee?.prsiClass ?? "S1"}
          className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PRSI_CLASSES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Use A1 for regular employees. Use S1 for proprietary directors. S0 and S1 are both Class S and use the same 2026 rate here.
        </p>
      </div>

      {/* Tax Credits & Cut-Off */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="annualTaxCredits">Annual Tax Credits (€)</label>
          <input
            id="annualTaxCredits"
            name="annualTaxCredits"
            type="number"
            step="1"
            defaultValue={employee?.annualTaxCredits ?? 4000}
            className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-muted-foreground">Standard: €4,000 (employee + earned income credit)</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="standardRateCutOff">Standard Rate Cut-Off (€)</label>
          <input
            id="standardRateCutOff"
            name="standardRateCutOff"
            type="number"
            step="1"
            defaultValue={employee?.standardRateCutOff ?? 44000}
            className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-muted-foreground">Standard: €44,000 for single person (2026)</p>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="address">Address</label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={employee?.address ?? ""}
          placeholder="Employee address (appears on payslip)"
          className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Start Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="startDate">Start Date</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={employee?.startDate ? new Date(employee.startDate).toISOString().split("T")[0] : ""}
          className="w-full px-3 py-2 rounded-lg border border-input bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="isDirector"
            value="true"
            defaultChecked={employee?.isDirector ?? false}
            className="rounded border-input accent-primary"
          />
          Proprietary Director
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={employee?.isActive ?? true}
            className="rounded border-input accent-primary"
          />
          Active
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div>
          {isEdit && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-destructive font-medium">Are you sure?</span>
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                  Yes, Delete
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Employee
              </Button>
            )
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/apps/payroll/employees")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Employee"}
          </Button>
        </div>
      </div>
    </form>
  )
}
