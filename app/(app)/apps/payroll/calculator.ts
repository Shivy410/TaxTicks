/**
 * Irish Payroll Calculator — 2026 Budget Rates
 *
 * Supports monthly payroll for a proprietary director (Class S PRSI).
 * Calculations are cumulative (year-to-date) to handle the standard rate
 * cut-off point and USC bands correctly across the tax year.
 *
 * References:
 *  - KPMG Budget 2026: https://kpmg.com/ie/en/insights/tax/budget-2026/tables.html
 *  - Revenue: https://www.revenue.ie/en/jobs-and-pensions/calculating-your-income-tax/index.aspx
 */

export interface PayrollInput {
  grossMonthlySalary: number       // Gross salary for this pay period (€)
  annualTaxCredits: number         // Total annual income tax credits (€), default 4000
  annualStandardRateCutOff: number // Annual standard rate cut-off point (€), default 44000
  ytdGross: number                 // Year-to-date gross before this period (€)
  ytdPaye: number                  // Year-to-date PAYE deducted before this period (€)
  ytdUsc: number                   // Year-to-date USC deducted before this period (€)
  ytdPrsi: number                  // Year-to-date PRSI deducted before this period (€)
  payPeriod: string                // e.g. "January 2026"
  directorName: string
  directorPpsn: string
  companyName: string
  companyAddress: string
  companyVatNumber?: string
  companyCroNumber?: string
}

export interface PayrollResult {
  // Inputs
  payPeriod: string
  directorName: string
  directorPpsn: string
  companyName: string
  companyAddress: string
  companyVatNumber?: string
  companyCroNumber?: string

  // This period
  grossPay: number
  paye: number
  usc: number
  prsi: number
  totalDeductions: number
  netPay: number

  // Breakdown details
  payeBreakdown: { band: string; amount: number; rate: number; tax: number }[]
  uscBreakdown: { band: string; amount: number; rate: number; tax: number }[]
  prsiRate: number

  // Year-to-date (including this period)
  ytdGross: number
  ytdPaye: number
  ytdUsc: number
  ytdPrsi: number
  ytdNet: number
}

// ─── 2026 Tax Rates ───────────────────────────────────────────────────────────

const INCOME_TAX_STANDARD_RATE = 0.20
const INCOME_TAX_HIGHER_RATE = 0.40

// USC bands 2026 (annual thresholds)
const USC_BANDS_2026 = [
  { limit: 12012,  rate: 0.005 },
  { limit: 28700,  rate: 0.02  },
  { limit: 70044,  rate: 0.03  },
  { limit: Infinity, rate: 0.08 },
]

// Class S PRSI rate (proprietary directors, self-employed)
// No employer PRSI for proprietary directors (>15% shareholding)
const PRSI_CLASS_S_RATE = 0.042  // 4.2% from Oct 2025

// ─── Calculator ───────────────────────────────────────────────────────────────

function calcPaye(
  ytdGrossBefore: number,
  grossThisPeriod: number,
  annualCutOff: number,
  annualCredits: number
): { paye: number; breakdown: { band: string; amount: number; rate: number; tax: number }[] } {
  const ytdGrossAfter = ytdGrossBefore + grossThisPeriod

  // Cumulative PAYE on total YTD gross
  const standardBandUsed = Math.min(ytdGrossAfter, annualCutOff)
  const higherBandUsed = Math.max(0, ytdGrossAfter - annualCutOff)

  const cumulativeTaxBeforeCredits =
    standardBandUsed * INCOME_TAX_STANDARD_RATE +
    higherBandUsed * INCOME_TAX_HIGHER_RATE

  // Apply annual credits proportionally (cumulative approach)
  // We calculate the cumulative PAYE up to this month and subtract what was
  // already deducted in prior periods.
  const monthNumber = Math.round(ytdGrossAfter / grossThisPeriod)
  const creditsToDate = annualCredits  // Revenue applies credits cumulatively

  const cumulativePaye = Math.max(0, cumulativeTaxBeforeCredits - creditsToDate)

  // Prior cumulative PAYE (before this period)
  const priorStandardBand = Math.min(ytdGrossBefore, annualCutOff)
  const priorHigherBand = Math.max(0, ytdGrossBefore - annualCutOff)
  const priorTaxBeforeCredits =
    priorStandardBand * INCOME_TAX_STANDARD_RATE +
    priorHigherBand * INCOME_TAX_HIGHER_RATE
  const priorCumulativePaye = Math.max(0, priorTaxBeforeCredits - creditsToDate)

  const paye = Math.max(0, cumulativePaye - priorCumulativePaye)

  // Breakdown for this period
  const breakdown: { band: string; amount: number; rate: number; tax: number }[] = []
  const standardInPeriod = Math.min(grossThisPeriod, Math.max(0, annualCutOff - ytdGrossBefore))
  const higherInPeriod = Math.max(0, grossThisPeriod - standardInPeriod)

  if (standardInPeriod > 0) {
    breakdown.push({ band: "Standard Rate (20%)", amount: standardInPeriod, rate: 20, tax: standardInPeriod * INCOME_TAX_STANDARD_RATE })
  }
  if (higherInPeriod > 0) {
    breakdown.push({ band: "Higher Rate (40%)", amount: higherInPeriod, rate: 40, tax: higherInPeriod * INCOME_TAX_HIGHER_RATE })
  }

  return { paye, breakdown }
}

function calcUsc(
  ytdGrossBefore: number,
  grossThisPeriod: number
): { usc: number; breakdown: { band: string; amount: number; rate: number; tax: number }[] } {
  // USC is exempt if total annual income < €13,000
  // We calculate cumulative USC and subtract prior periods
  const ytdGrossAfter = ytdGrossBefore + grossThisPeriod

  function uscOnAmount(amount: number): number {
    let tax = 0
    let remaining = amount
    let prev = 0
    for (const band of USC_BANDS_2026) {
      const bandSize = band.limit === Infinity ? remaining : Math.min(remaining, band.limit - prev)
      if (bandSize <= 0) break
      tax += bandSize * band.rate
      remaining -= bandSize
      prev = band.limit
      if (remaining <= 0) break
    }
    return tax
  }

  const cumulativeUsc = uscOnAmount(ytdGrossAfter)
  const priorUsc = uscOnAmount(ytdGrossBefore)
  const usc = Math.max(0, cumulativeUsc - priorUsc)

  // Breakdown for this period
  const breakdown: { band: string; amount: number; rate: number; tax: number }[] = []
  let remaining = grossThisPeriod
  let prev = 0
  let ytdOffset = ytdGrossBefore

  for (const band of USC_BANDS_2026) {
    const bandLimit = band.limit === Infinity ? Infinity : band.limit
    const alreadyUsed = Math.min(ytdOffset, bandLimit === Infinity ? ytdOffset : bandLimit)
    const availableInBand = bandLimit === Infinity ? remaining : Math.max(0, bandLimit - alreadyUsed)
    const inBand = Math.min(remaining, availableInBand)

    if (inBand > 0) {
      const label = band.limit === Infinity
        ? `USC Band 4 (8%) — above €70,044`
        : `USC Band (${(band.rate * 100).toFixed(1)}%) — up to €${band.limit.toLocaleString()}`
      breakdown.push({ band: label, amount: inBand, rate: band.rate * 100, tax: inBand * band.rate })
      remaining -= inBand
      ytdOffset = Math.max(0, ytdOffset - alreadyUsed)
    }

    if (remaining <= 0) break
    prev = bandLimit === Infinity ? prev : bandLimit
  }

  return { usc, breakdown }
}

function calcPrsi(gross: number): number {
  return gross * PRSI_CLASS_S_RATE
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    grossMonthlySalary: gross,
    annualTaxCredits,
    annualStandardRateCutOff,
    ytdGross: ytdGrossBefore,
    ytdPaye: ytdPayeBefore,
    ytdUsc: ytdUscBefore,
    ytdPrsi: ytdPrsiBefore,
  } = input

  const { paye, breakdown: payeBreakdown } = calcPaye(
    ytdGrossBefore,
    gross,
    annualStandardRateCutOff,
    annualTaxCredits
  )

  const { usc, breakdown: uscBreakdown } = calcUsc(ytdGrossBefore, gross)

  const prsi = calcPrsi(gross)

  const totalDeductions = paye + usc + prsi
  const netPay = gross - totalDeductions

  return {
    payPeriod: input.payPeriod,
    directorName: input.directorName,
    directorPpsn: input.directorPpsn,
    companyName: input.companyName,
    companyAddress: input.companyAddress,
    companyVatNumber: input.companyVatNumber,
    companyCroNumber: input.companyCroNumber,

    grossPay: Math.round(gross * 100) / 100,
    paye: Math.round(paye * 100) / 100,
    usc: Math.round(usc * 100) / 100,
    prsi: Math.round(prsi * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,

    payeBreakdown,
    uscBreakdown,
    prsiRate: PRSI_CLASS_S_RATE * 100,

    ytdGross: Math.round((ytdGrossBefore + gross) * 100) / 100,
    ytdPaye: Math.round((ytdPayeBefore + paye) * 100) / 100,
    ytdUsc: Math.round((ytdUscBefore + usc) * 100) / 100,
    ytdPrsi: Math.round((ytdPrsiBefore + prsi) * 100) / 100,
    ytdNet: Math.round((ytdGrossBefore + gross - ytdPayeBefore - paye - ytdUscBefore - usc - ytdPrsiBefore - prsi) * 100) / 100,
  }
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount)
}
