/**
 * Irish Payroll Calculator
 *
 * This calculator is intentionally explicit about the tax tables it supports.
 * The feature currently uses 2026 monthly cumulative PAYE/USC rules and
 * date-sensitive 2026 PRSI rates.
 */

export const SUPPORTED_TAX_YEARS = [2026] as const

type SupportedTaxYear = typeof SUPPORTED_TAX_YEARS[number]

type AnnualBand = {
  limit: number
  rate: number
  label: string
}

type CumulativeBand = {
  lowerLimit: number
  upperLimit: number
  rate: number
  label: string
}

export type PayrollBreakdownRow = {
  description: string
  taxableAmount: number | null
  rateLabel: string | null
  amount: number
}

type PrsiRateSchedule = {
  effectiveFromMonth: number
  classA: number
  classS: number
}

type TaxProfile = {
  uscBands: AnnualBand[]
  uscExemptionThreshold: number
  prsiRates: PrsiRateSchedule[]
}

export interface PayrollInput {
  grossMonthlySalary: number
  annualTaxCredits: number
  annualStandardRateCutOff: number
  ytdGross: number
  ytdPaye: number
  ytdUsc: number
  ytdPrsi: number
  payPeriod: string
  payMonth: number
  payYear: number
  employeeName: string
  employeePpsn: string
  prsiClass: string
  isDirector: boolean
  companyName: string
  companyAddress: string
  companyVatNumber?: string
  companyCroNumber?: string
}

export interface PayrollResult {
  payPeriod: string
  payMonth: number
  taxYear: SupportedTaxYear
  employeeName: string
  employeePpsn: string
  employeeRole: string
  prsiClass: string
  companyName: string
  companyAddress: string
  companyVatNumber?: string
  companyCroNumber?: string

  grossPay: number
  paye: number
  usc: number
  prsi: number
  totalDeductions: number
  netPay: number

  payeBreakdown: PayrollBreakdownRow[]
  uscBreakdown: PayrollBreakdownRow[]
  prsiDescription: string
  prsiRateLabel: string

  ytdGross: number
  ytdPaye: number
  ytdUsc: number
  ytdPrsi: number
  ytdNet: number
}

const PAY_FREQUENCY_PER_YEAR = 12

const INCOME_TAX_STANDARD_RATE = 0.2
const INCOME_TAX_HIGHER_RATE = 0.4

const PRSI_CLASS_A_WEEKLY_ZERO_THRESHOLD = 352
const PRSI_CLASS_A_WEEKLY_CREDIT_UPPER_THRESHOLD = 424
const PRSI_CLASS_A_WEEKLY_MAX_CREDIT = 12

const TAX_PROFILES: Record<SupportedTaxYear, TaxProfile> = {
  2026: {
    uscExemptionThreshold: 13000,
    uscBands: [
      { limit: 12012, rate: 0.005, label: "USC Band 1" },
      { limit: 28700, rate: 0.02, label: "USC Band 2" },
      { limit: 70044, rate: 0.03, label: "USC Band 3" },
      { limit: Infinity, rate: 0.08, label: "USC Band 4" },
    ],
    prsiRates: [
      { effectiveFromMonth: 1, classA: 0.042, classS: 0.042 },
      { effectiveFromMonth: 10, classA: 0.0435, classS: 0.0435 },
    ],
  },
}

function assertSupportedTaxYear(year: number): asserts year is SupportedTaxYear {
  if (!SUPPORTED_TAX_YEARS.includes(year as SupportedTaxYear)) {
    throw new Error(`Unsupported tax year ${year}. Payroll currently supports ${SUPPORTED_TAX_YEARS.join(", ")} only.`)
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function nearlyZero(value: number): boolean {
  return Math.abs(value) < 0.005
}

function annualToCumulativeMonthly(amount: number, monthNumber: number): number {
  if (monthNumber <= 0) return 0
  return (amount * monthNumber) / PAY_FREQUENCY_PER_YEAR
}

function formatPercent(rate: number): string {
  const percentage = rate * 100
  return `${percentage.toFixed(2).replace(/\.?0+$/, "")}%`
}

function getPrsiRate(profile: TaxProfile, payMonth: number, prsiClass: string): number {
  const matchingRates = [...profile.prsiRates]
    .sort((a, b) => a.effectiveFromMonth - b.effectiveFromMonth)
    .filter((schedule) => payMonth >= schedule.effectiveFromMonth)
  const selectedRate = matchingRates[matchingRates.length - 1]

  if (!selectedRate) {
    throw new Error(`No PRSI rate configured for month ${payMonth}.`)
  }

  return prsiClass.startsWith("A") ? selectedRate.classA : selectedRate.classS
}

function createCumulativeBands(annualBands: AnnualBand[], monthNumber: number): CumulativeBand[] {
  let previousAnnualLimit = 0

  return annualBands.map((band) => {
    const lowerLimit = annualToCumulativeMonthly(previousAnnualLimit, monthNumber)
    const upperLimit = band.limit === Infinity ? Infinity : annualToCumulativeMonthly(band.limit, monthNumber)

    previousAnnualLimit = band.limit

    return {
      lowerLimit,
      upperLimit,
      rate: band.rate,
      label: band.label,
    }
  })
}

function amountInBand(amount: number, band: CumulativeBand): number {
  return Math.max(0, Math.min(amount, band.upperLimit) - band.lowerLimit)
}

function incomeTaxBeforeCredits(amount: number, cumulativeCutOff: number): number {
  const standardBand = Math.min(amount, cumulativeCutOff)
  const higherBand = Math.max(0, amount - cumulativeCutOff)

  return (standardBand * INCOME_TAX_STANDARD_RATE) + (higherBand * INCOME_TAX_HIGHER_RATE)
}

function uscBeforeExemption(amount: number, bands: CumulativeBand[]): number {
  return bands.reduce((sum, band) => sum + (amountInBand(amount, band) * band.rate), 0)
}

function finalizeBreakdown(rows: PayrollBreakdownRow[], total: number): PayrollBreakdownRow[] {
  if (rows.length === 0) return []

  const rounded = rows.map((row) => ({
    ...row,
    taxableAmount: row.taxableAmount === null ? null : round2(row.taxableAmount),
    amount: round2(row.amount),
  }))

  const difference = round2(total - rounded.reduce((sum, row) => sum + row.amount, 0))
  if (!nearlyZero(difference)) {
    rounded[rounded.length - 1].amount = round2(rounded[rounded.length - 1].amount + difference)
  }

  return rounded
}

function calcPaye(input: {
  grossThisPeriod: number
  annualCutOff: number
  annualCredits: number
  ytdGrossBefore: number
  ytdPayeBefore: number
  monthNumber: number
}): { paye: number; breakdown: PayrollBreakdownRow[] } {
  const {
    grossThisPeriod,
    annualCutOff,
    annualCredits,
    ytdGrossBefore,
    ytdPayeBefore,
    monthNumber,
  } = input

  const ytdGrossAfter = ytdGrossBefore + grossThisPeriod
  const cumulativeCutOff = annualToCumulativeMonthly(annualCutOff, monthNumber)
  const priorCutOff = annualToCumulativeMonthly(annualCutOff, monthNumber - 1)
  const cumulativeCredits = annualToCumulativeMonthly(annualCredits, monthNumber)
  const priorCredits = annualToCumulativeMonthly(annualCredits, monthNumber - 1)

  const cumulativeGrossTax = incomeTaxBeforeCredits(ytdGrossAfter, cumulativeCutOff)
  const priorGrossTax = incomeTaxBeforeCredits(ytdGrossBefore, priorCutOff)

  const cumulativePayeDue = Math.max(0, cumulativeGrossTax - cumulativeCredits)
  const priorCumulativePayeDue = Math.max(0, priorGrossTax - priorCredits)
  const paye = cumulativePayeDue - ytdPayeBefore

  const standardTaxable = Math.max(
    0,
    Math.min(ytdGrossAfter, cumulativeCutOff) - Math.min(ytdGrossBefore, priorCutOff)
  )
  const higherTaxable = Math.max(0, grossThisPeriod - standardTaxable)
  const periodCredits = cumulativeCredits - priorCredits
  const cumulativeAdjustment = priorCumulativePayeDue - ytdPayeBefore

  const breakdown: PayrollBreakdownRow[] = []

  if (!nearlyZero(standardTaxable)) {
    breakdown.push({
      description: "Standard rate band",
      taxableAmount: standardTaxable,
      rateLabel: formatPercent(INCOME_TAX_STANDARD_RATE),
      amount: standardTaxable * INCOME_TAX_STANDARD_RATE,
    })
  }

  if (!nearlyZero(higherTaxable)) {
    breakdown.push({
      description: "Higher rate band",
      taxableAmount: higherTaxable,
      rateLabel: formatPercent(INCOME_TAX_HIGHER_RATE),
      amount: higherTaxable * INCOME_TAX_HIGHER_RATE,
    })
  }

  if (!nearlyZero(periodCredits)) {
    breakdown.push({
      description: "Tax credits applied",
      taxableAmount: null,
      rateLabel: null,
      amount: -periodCredits,
    })
  }

  if (!nearlyZero(cumulativeAdjustment)) {
    breakdown.push({
      description: cumulativeAdjustment > 0
        ? "Cumulative under-deduction adjustment"
        : "Cumulative over-deduction refund",
      taxableAmount: null,
      rateLabel: null,
      amount: cumulativeAdjustment,
    })
  }

  return {
    paye,
    breakdown: finalizeBreakdown(breakdown, paye),
  }
}

function calcUsc(input: {
  grossThisPeriod: number
  ytdGrossBefore: number
  ytdUscBefore: number
  monthNumber: number
  profile: TaxProfile
}): { usc: number; breakdown: PayrollBreakdownRow[] } {
  const {
    grossThisPeriod,
    ytdGrossBefore,
    ytdUscBefore,
    monthNumber,
    profile,
  } = input

  const ytdGrossAfter = ytdGrossBefore + grossThisPeriod
  const currentBands = createCumulativeBands(profile.uscBands, monthNumber)
  const priorBands = createCumulativeBands(profile.uscBands, monthNumber - 1)

  const grossUscAfter = uscBeforeExemption(ytdGrossAfter, currentBands)
  const grossUscBefore = uscBeforeExemption(ytdGrossBefore, priorBands)

  const cumulativeThreshold = annualToCumulativeMonthly(profile.uscExemptionThreshold, monthNumber)
  const priorThreshold = annualToCumulativeMonthly(profile.uscExemptionThreshold, monthNumber - 1)

  const afterExempt = ytdGrossAfter <= cumulativeThreshold
  const beforeExempt = ytdGrossBefore <= priorThreshold

  const cumulativeUscDue = afterExempt ? 0 : grossUscAfter
  const priorCumulativeUscDue = beforeExempt ? 0 : grossUscBefore
  const usc = cumulativeUscDue - ytdUscBefore

  const breakdown: PayrollBreakdownRow[] = []

  if (!afterExempt) {
    for (let index = 0; index < currentBands.length; index += 1) {
      const currentBand = currentBands[index]
      const priorBand = priorBands[index]
      const taxableAmount = amountInBand(ytdGrossAfter, currentBand) - amountInBand(ytdGrossBefore, priorBand)

      if (!nearlyZero(taxableAmount)) {
        breakdown.push({
          description: currentBand.label,
          taxableAmount,
          rateLabel: formatPercent(currentBand.rate),
          amount: taxableAmount * currentBand.rate,
        })
      }
    }
  }

  if (beforeExempt && !afterExempt && !nearlyZero(grossUscBefore)) {
    breakdown.push({
      description: "Exemption threshold catch-up",
      taxableAmount: null,
      rateLabel: null,
      amount: grossUscBefore,
    })
  }

  const cumulativeAdjustment = priorCumulativeUscDue - ytdUscBefore
  if (!nearlyZero(cumulativeAdjustment)) {
    breakdown.push({
      description: cumulativeAdjustment > 0
        ? "Cumulative under-deduction adjustment"
        : "Cumulative over-deduction refund",
      taxableAmount: null,
      rateLabel: null,
      amount: cumulativeAdjustment,
    })
  }

  return {
    usc,
    breakdown: finalizeBreakdown(breakdown, usc),
  }
}

function calcPrsi(input: {
  grossThisPeriod: number
  payMonth: number
  payYear: SupportedTaxYear
  prsiClass: string
  isDirector: boolean
}): { prsi: number; description: string; rateLabel: string; prsiClass: string } {
  const {
    grossThisPeriod,
    payMonth,
    payYear,
    prsiClass,
    isDirector,
  } = input

  const profile = TAX_PROFILES[payYear]
  const normalizedClass = prsiClass.trim().toUpperCase() || "S1"

  if (normalizedClass.startsWith("A")) {
    const employeeRate = getPrsiRate(profile, payMonth, normalizedClass)
    const monthlyZeroThreshold = (PRSI_CLASS_A_WEEKLY_ZERO_THRESHOLD * 52) / 12
    const monthlyCreditUpperThreshold = (PRSI_CLASS_A_WEEKLY_CREDIT_UPPER_THRESHOLD * 52) / 12
    const monthlyMaxCredit = (PRSI_CLASS_A_WEEKLY_MAX_CREDIT * 52) / 12

    if (grossThisPeriod <= monthlyZeroThreshold) {
      return {
        prsi: 0,
        description: "PRSI — Class A",
        rateLabel: "0%",
        prsiClass: normalizedClass,
      }
    }

    const basePrsi = grossThisPeriod * employeeRate
    const prsiCredit = grossThisPeriod <= monthlyCreditUpperThreshold
      ? Math.max(0, monthlyMaxCredit - ((grossThisPeriod - monthlyZeroThreshold) / 6))
      : 0

    return {
      prsi: Math.max(0, basePrsi - prsiCredit),
      description: "PRSI — Class A",
      rateLabel: prsiCredit > 0
        ? `${formatPercent(employeeRate)} less PRSI credit`
        : formatPercent(employeeRate),
      prsiClass: normalizedClass,
    }
  }

  if (normalizedClass.startsWith("S")) {
    const classSRate = getPrsiRate(profile, payMonth, normalizedClass)

    return {
      prsi: grossThisPeriod * classSRate,
      description: isDirector
        ? `PRSI — Class ${normalizedClass} (Proprietary Director)`
        : `PRSI — Class ${normalizedClass}`,
      rateLabel: formatPercent(classSRate),
      prsiClass: normalizedClass,
    }
  }

  throw new Error(`Unsupported PRSI class "${normalizedClass}".`)
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    grossMonthlySalary,
    annualTaxCredits,
    annualStandardRateCutOff,
    ytdGross: ytdGrossBefore,
    ytdPaye: ytdPayeBefore,
    ytdUsc: ytdUscBefore,
    ytdPrsi: ytdPrsiBefore,
    payMonth,
    payYear,
  } = input

  const numericFields = {
    grossMonthlySalary,
    annualTaxCredits,
    annualStandardRateCutOff,
    ytdGrossBefore,
    ytdPayeBefore,
    ytdUscBefore,
    ytdPrsiBefore,
  }

  for (const [fieldName, value] of Object.entries(numericFields)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid payroll input "${fieldName}".`)
    }
  }

  if (payMonth < 1 || payMonth > 12) {
    throw new Error(`Invalid pay month ${payMonth}.`)
  }

  assertSupportedTaxYear(payYear)

  const profile = TAX_PROFILES[payYear]

  const { paye, breakdown: payeBreakdown } = calcPaye({
    grossThisPeriod: grossMonthlySalary,
    annualCutOff: annualStandardRateCutOff,
    annualCredits: annualTaxCredits,
    ytdGrossBefore,
    ytdPayeBefore,
    monthNumber: payMonth,
  })

  const { usc, breakdown: uscBreakdown } = calcUsc({
    grossThisPeriod: grossMonthlySalary,
    ytdGrossBefore,
    ytdUscBefore,
    monthNumber: payMonth,
    profile,
  })

  const prsiResult = calcPrsi({
    grossThisPeriod: grossMonthlySalary,
    payMonth,
    payYear,
    prsiClass: input.prsiClass,
    isDirector: input.isDirector,
  })

  const grossPay = round2(grossMonthlySalary)
  const roundedPaye = round2(paye)
  const roundedUsc = round2(usc)
  const roundedPrsi = round2(prsiResult.prsi)
  const totalDeductions = round2(roundedPaye + roundedUsc + roundedPrsi)
  const netPay = round2(grossPay - totalDeductions)
  const ytdGross = round2(ytdGrossBefore + grossMonthlySalary)
  const ytdPaye = round2(ytdPayeBefore + roundedPaye)
  const ytdUsc = round2(ytdUscBefore + roundedUsc)
  const ytdPrsi = round2(ytdPrsiBefore + roundedPrsi)

  return {
    payPeriod: input.payPeriod,
    payMonth,
    taxYear: payYear,
    employeeName: input.employeeName,
    employeePpsn: input.employeePpsn,
    employeeRole: input.isDirector ? "Director" : "Employee",
    prsiClass: prsiResult.prsiClass,
    companyName: input.companyName,
    companyAddress: input.companyAddress,
    companyVatNumber: input.companyVatNumber,
    companyCroNumber: input.companyCroNumber,

    grossPay,
    paye: roundedPaye,
    usc: roundedUsc,
    prsi: roundedPrsi,
    totalDeductions,
    netPay,

    payeBreakdown,
    uscBreakdown,
    prsiDescription: prsiResult.description,
    prsiRateLabel: prsiResult.rateLabel,

    ytdGross,
    ytdPaye,
    ytdUsc,
    ytdPrsi,
    ytdNet: round2(ytdGross - ytdPaye - ytdUsc - ytdPrsi),
  }
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount)
}
