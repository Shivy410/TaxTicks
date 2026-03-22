import { prisma } from "@/lib/db"
import { Employee, PayslipRecord } from "@/prisma/client"
import { cache } from "react"

export type EmployeeData = {
  fullName: string
  ppsn?: string | null
  prsiClass?: string
  annualTaxCredits?: number
  standardRateCutOff?: number
  startDate?: Date | string | null
  isActive?: boolean
  isDirector?: boolean
  email?: string | null
  address?: string | null
}

export type PayslipData = {
  employeeId: string
  payPeriod: string
  grossPay: number
  paye: number
  usc: number
  prsi: number
  totalDeductions: number
  netPay: number
  ytdGross: number
  ytdPaye: number
  ytdUsc: number
  ytdPrsi: number
  salaryTransactionId?: string | null
  liabilityTransactionId?: string | null
  pdfPath?: string | null
}

// ─── Employee CRUD ────────────────────────────────────────────────────────────

export const getEmployees = cache(async (userId: string): Promise<Employee[]> => {
  return await prisma.employee.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
  })
})

export const getEmployeeById = cache(async (id: string, userId: string): Promise<Employee | null> => {
  return await prisma.employee.findFirst({
    where: { id, userId },
  })
})

export const createEmployee = async (userId: string, data: EmployeeData): Promise<Employee> => {
  return await prisma.employee.create({
    data: {
      userId,
      fullName: data.fullName,
      ppsn: data.ppsn ?? null,
      prsiClass: data.prsiClass ?? "S1",
      annualTaxCredits: data.annualTaxCredits ?? 4000,
      standardRateCutOff: data.standardRateCutOff ?? 44000,
      startDate: data.startDate ? new Date(data.startDate) : null,
      isActive: data.isActive ?? true,
      isDirector: data.isDirector ?? false,
      email: data.email ?? null,
      address: data.address ?? null,
    },
  })
}

export const updateEmployee = async (id: string, userId: string, data: Partial<EmployeeData>): Promise<Employee> => {
  return await prisma.employee.update({
    where: { id, userId },
    data: {
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.ppsn !== undefined && { ppsn: data.ppsn }),
      ...(data.prsiClass !== undefined && { prsiClass: data.prsiClass }),
      ...(data.annualTaxCredits !== undefined && { annualTaxCredits: data.annualTaxCredits }),
      ...(data.standardRateCutOff !== undefined && { standardRateCutOff: data.standardRateCutOff }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isDirector !== undefined && { isDirector: data.isDirector }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
    },
  })
}

export const deleteEmployee = async (id: string, userId: string): Promise<void> => {
  await prisma.employee.delete({
    where: { id, userId },
  })
}

// ─── Payslip Records ──────────────────────────────────────────────────────────

export const getPayslipsByEmployee = cache(
  async (employeeId: string, userId: string): Promise<PayslipRecord[]> => {
    return await prisma.payslipRecord.findMany({
      where: { employeeId, userId },
      orderBy: { createdAt: "desc" },
    })
  }
)

export const getLatestPayslipForEmployee = cache(
  async (employeeId: string, userId: string): Promise<PayslipRecord | null> => {
    return await prisma.payslipRecord.findFirst({
      where: { employeeId, userId },
      orderBy: { createdAt: "desc" },
    })
  }
)

export const getPayslipById = cache(
  async (id: string, userId: string): Promise<PayslipRecord | null> => {
    return await prisma.payslipRecord.findFirst({
      where: { id, userId },
    })
  }
)

export const createPayslipRecord = async (userId: string, data: PayslipData): Promise<PayslipRecord> => {
  return await prisma.payslipRecord.create({
    data: {
      userId,
      employeeId: data.employeeId,
      payPeriod: data.payPeriod,
      grossPay: data.grossPay,
      paye: data.paye,
      usc: data.usc,
      prsi: data.prsi,
      totalDeductions: data.totalDeductions,
      netPay: data.netPay,
      ytdGross: data.ytdGross,
      ytdPaye: data.ytdPaye,
      ytdUsc: data.ytdUsc,
      ytdPrsi: data.ytdPrsi,
      salaryTransactionId: data.salaryTransactionId ?? null,
      liabilityTransactionId: data.liabilityTransactionId ?? null,
      pdfPath: data.pdfPath ?? null,
    },
  })
}

export const deletePayslipRecord = async (id: string, userId: string): Promise<void> => {
  await prisma.payslipRecord.delete({
    where: { id, userId },
  })
}
