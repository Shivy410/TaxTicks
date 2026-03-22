"use server"

import { getCurrentUser } from "@/lib/auth"
import { ActionState } from "@/lib/actions"
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  EmployeeData,
} from "@/models/employees"
import { Employee } from "@/prisma/client"
import { revalidatePath } from "next/cache"

export async function createEmployeeAction(
  _prevState: ActionState<Employee> | null,
  formData: FormData
): Promise<ActionState<Employee>> {
  try {
    const user = await getCurrentUser()

    const data: EmployeeData = {
      fullName: formData.get("fullName") as string,
      ppsn: (formData.get("ppsn") as string) || null,
      prsiClass: (formData.get("prsiClass") as string) || "S1",
      annualTaxCredits: parseFloat((formData.get("annualTaxCredits") as string) || "4000"),
      standardRateCutOff: parseFloat((formData.get("standardRateCutOff") as string) || "44000"),
      startDate: (formData.get("startDate") as string) || null,
      isActive: formData.get("isActive") === "true",
      isDirector: formData.get("isDirector") === "true",
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
    }

    if (!data.fullName?.trim()) {
      return { success: false, error: "Full name is required" }
    }

    const employee = await createEmployee(user.id, data)
    revalidatePath("/apps/payroll")
    revalidatePath("/apps/payroll/employees")
    return { success: true, data: employee }
  } catch (error) {
    console.error("Failed to create employee:", error)
    return { success: false, error: `Failed to create employee: ${error}` }
  }
}

export async function updateEmployeeAction(
  id: string,
  _prevState: ActionState<Employee> | null,
  formData: FormData
): Promise<ActionState<Employee>> {
  try {
    const user = await getCurrentUser()

    const data: Partial<EmployeeData> = {
      fullName: formData.get("fullName") as string,
      ppsn: (formData.get("ppsn") as string) || null,
      prsiClass: (formData.get("prsiClass") as string) || "S1",
      annualTaxCredits: parseFloat((formData.get("annualTaxCredits") as string) || "4000"),
      standardRateCutOff: parseFloat((formData.get("standardRateCutOff") as string) || "44000"),
      startDate: (formData.get("startDate") as string) || null,
      isActive: formData.get("isActive") === "true",
      isDirector: formData.get("isDirector") === "true",
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
    }

    if (!data.fullName?.trim()) {
      return { success: false, error: "Full name is required" }
    }

    const employee = await updateEmployee(id, user.id, data)
    revalidatePath("/apps/payroll")
    revalidatePath("/apps/payroll/employees")
    return { success: true, data: employee }
  } catch (error) {
    console.error("Failed to update employee:", error)
    return { success: false, error: `Failed to update employee: ${error}` }
  }
}

export async function deleteEmployeeAction(id: string): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    await deleteEmployee(id, user.id)
    revalidatePath("/apps/payroll")
    revalidatePath("/apps/payroll/employees")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete employee:", error)
    return { success: false, error: `Failed to delete employee: ${error}` }
  }
}
