import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { PayrollResult, formatEuro } from "../calculator"

Font.register({
  family: "Inter",
  fonts: [
    { src: "public/fonts/Inter/Inter-Regular.otf", fontWeight: 400 },
    { src: "public/fonts/Inter/Inter-Medium.otf", fontWeight: 500 },
    { src: "public/fonts/Inter/Inter-SemiBold.otf", fontWeight: 600 },
    { src: "public/fonts/Inter/Inter-Bold.otf", fontWeight: 700 },
  ],
})

const C = {
  primary: "#1a7a4a",
  dark: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f9fafb",
  white: "#ffffff",
  deduction: "#991b1b",
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    color: C.dark,
    backgroundColor: C.white,
    padding: 36,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  companyName: { fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 3 },
  companyMeta: { fontSize: 8, color: C.muted, marginBottom: 1 },
  payslipTitle: { fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4 },
  payPeriod: { fontSize: 10, color: C.muted },

  // Employee section
  employeeSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 4,
    padding: 10,
  },
  infoBoxTitle: { fontSize: 8, fontWeight: 600, color: C.muted, textTransform: "uppercase", marginBottom: 6 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  infoLabel: { color: C.muted, fontSize: 8 },
  infoValue: { fontWeight: 500, fontSize: 8 },

  // Pay summary table
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 8, color: C.dark },
  table: { marginBottom: 14 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.primary,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: { color: C.white, fontWeight: 600, fontSize: 8 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: { backgroundColor: C.bg },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1, textAlign: "right" },
  col4: { flex: 1, textAlign: "right" },

  // Totals
  totalsSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  totalBox: {
    flex: 1,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  totalBoxGreen: { backgroundColor: "#dcfce7" },
  totalBoxRed: { backgroundColor: "#fee2e2" },
  totalBoxBlue: { backgroundColor: "#dbeafe" },
  totalBoxLabel: { fontSize: 8, color: C.muted, marginBottom: 4, textAlign: "center" },
  totalBoxAmount: { fontSize: 14, fontWeight: 700, textAlign: "center" },
  totalBoxAmountGreen: { color: "#166534" },
  totalBoxAmountRed: { color: C.deduction },
  totalBoxAmountBlue: { color: "#1e40af" },

  // YTD section
  ytdSection: {
    backgroundColor: C.bg,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  ytdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  ytdLabel: { color: C.muted, fontSize: 8 },
  ytdValue: { fontWeight: 600, fontSize: 8 },

  // ROS reminder
  rosBox: {
    borderWidth: 1,
    borderColor: "#fbbf24",
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  rosTitle: { fontWeight: 700, color: "#92400e", fontSize: 9, marginBottom: 3 },
  rosText: { color: "#78350f", fontSize: 8 },

  // Footer
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.muted },
})

export function PayslipPDF({ result }: { result: PayrollResult }) {
  const generatedDate = new Date().toLocaleDateString("en-IE", {
    day: "2-digit", month: "long", year: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{result.companyName}</Text>
            <Text style={styles.companyMeta}>{result.companyAddress}</Text>
            {result.companyCroNumber && (
              <Text style={styles.companyMeta}>CRO: {result.companyCroNumber}</Text>
            )}
            {result.companyVatNumber && (
              <Text style={styles.companyMeta}>VAT: {result.companyVatNumber}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.payslipTitle}>PAYSLIP</Text>
            <Text style={styles.payPeriod}>Pay Period: {result.payPeriod}</Text>
          </View>
        </View>

        {/* Employee & Pay Info */}
        <View style={styles.employeeSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Employee Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{result.directorName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PPSN</Text>
              <Text style={styles.infoValue}>{result.directorPpsn || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>Director</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PRSI Class</Text>
              <Text style={styles.infoValue}>Class S (Proprietary Director)</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Payment Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pay Period</Text>
              <Text style={styles.infoValue}>{result.payPeriod}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pay Frequency</Text>
              <Text style={styles.infoValue}>Monthly</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Generated</Text>
              <Text style={styles.infoValue}>{generatedDate}</Text>
            </View>
          </View>
        </View>

        {/* Pay Summary Totals */}
        <View style={styles.totalsSection}>
          <View style={[styles.totalBox, styles.totalBoxGreen]}>
            <Text style={styles.totalBoxLabel}>Gross Pay</Text>
            <Text style={[styles.totalBoxAmount, styles.totalBoxAmountGreen]}>
              {formatEuro(result.grossPay)}
            </Text>
          </View>
          <View style={[styles.totalBox, styles.totalBoxRed]}>
            <Text style={styles.totalBoxLabel}>Total Deductions</Text>
            <Text style={[styles.totalBoxAmount, styles.totalBoxAmountRed]}>
              {formatEuro(result.totalDeductions)}
            </Text>
          </View>
          <View style={[styles.totalBox, styles.totalBoxBlue]}>
            <Text style={styles.totalBoxLabel}>Net Pay</Text>
            <Text style={[styles.totalBoxAmount, styles.totalBoxAmountBlue]}>
              {formatEuro(result.netPay)}
            </Text>
          </View>
        </View>

        {/* Deductions Breakdown */}
        <Text style={styles.sectionTitle}>Deductions Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Taxable Amount</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Deduction</Text>
          </View>

          {/* PAYE rows */}
          {result.payeBreakdown.map((row, i) => (
            <View key={`paye-${i}`} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.col1}>PAYE — {row.band}</Text>
              <Text style={styles.col2}>{formatEuro(row.amount)}</Text>
              <Text style={styles.col3}>{row.rate}%</Text>
              <Text style={styles.col4}>{formatEuro(row.tax)}</Text>
            </View>
          ))}

          {/* USC rows */}
          {result.uscBreakdown.map((row, i) => (
            <View key={`usc-${i}`} style={[styles.tableRow, (result.payeBreakdown.length + i) % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.col1}>USC — {row.band}</Text>
              <Text style={styles.col2}>{formatEuro(row.amount)}</Text>
              <Text style={styles.col3}>{row.rate.toFixed(1)}%</Text>
              <Text style={styles.col4}>{formatEuro(row.tax)}</Text>
            </View>
          ))}

          {/* PRSI row */}
          <View style={[styles.tableRow, (result.payeBreakdown.length + result.uscBreakdown.length) % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={styles.col1}>PRSI — Class S (Proprietary Director)</Text>
            <Text style={styles.col2}>{formatEuro(result.grossPay)}</Text>
            <Text style={styles.col3}>{result.prsiRate}%</Text>
            <Text style={styles.col4}>{formatEuro(result.prsi)}</Text>
          </View>

          {/* Total deductions row */}
          <View style={[styles.tableRow, { backgroundColor: "#fee2e2" }]}>
            <Text style={[styles.col1, { fontWeight: 700 }]}>Total Deductions</Text>
            <Text style={styles.col2}></Text>
            <Text style={styles.col3}></Text>
            <Text style={[styles.col4, { fontWeight: 700, color: C.deduction }]}>{formatEuro(result.totalDeductions)}</Text>
          </View>
        </View>

        {/* Year-to-Date Summary */}
        <Text style={styles.sectionTitle}>Year-to-Date Summary</Text>
        <View style={styles.ytdSection}>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdLabel}>YTD Gross Pay</Text>
            <Text style={styles.ytdValue}>{formatEuro(result.ytdGross)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdLabel}>YTD PAYE</Text>
            <Text style={styles.ytdValue}>{formatEuro(result.ytdPaye)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdLabel}>YTD USC</Text>
            <Text style={styles.ytdValue}>{formatEuro(result.ytdUsc)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdLabel}>YTD PRSI (Class S)</Text>
            <Text style={styles.ytdValue}>{formatEuro(result.ytdPrsi)}</Text>
          </View>
          <View style={[styles.ytdRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.ytdLabel, { fontWeight: 700, color: C.dark }]}>YTD Net Pay</Text>
            <Text style={[styles.ytdValue, { color: "#1e40af" }]}>{formatEuro(result.ytdNet)}</Text>
          </View>
        </View>

        {/* ROS Reminder */}
        <View style={styles.rosBox}>
          <Text style={styles.rosTitle}>⚠ Revenue Submission Reminder (PAYE Modernisation)</Text>
          <Text style={styles.rosText}>
            Under Irish PAYE Modernisation, you must submit this payroll run to Revenue via ROS on or before the pay date.
            Log in to ros.ie, navigate to Employer Services → Payroll Submissions, and enter the figures above.
            The PAYE/USC/PRSI liability is due to Revenue by the 23rd of the following month.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by TaxTicks — Your Taxes, Simplified.
          </Text>
          <Text style={styles.footerText}>
            Tax Year 2026 | 2026 Budget Rates Applied
          </Text>
        </View>

      </Page>
    </Document>
  )
}
