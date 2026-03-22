import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"
import { PayrollForm } from "./components/payroll-form"
import { manifest } from "./manifest"

export default async function PayrollApp() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)

  const missingFields: string[] = []
  if (!user.businessName) missingFields.push("Business Name")
  if (!settings["company_ppsn"]) missingFields.push("Director PPSN")

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <div>
          <h2 className="flex flex-row gap-3 md:gap-5">
            <span className="text-3xl font-bold tracking-tight">
              {manifest.icon} {manifest.name}
            </span>
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Calculate Irish PAYE, USC &amp; PRSI for director payroll. Generates a compliant payslip PDF and logs transactions automatically.
          </p>
        </div>
      </header>

      {missingFields.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <p className="font-semibold mb-1">⚠ Complete your profile for accurate payslips</p>
          <p>
            The following fields are missing from your settings:{" "}
            <strong>{missingFields.join(", ")}</strong>.{" "}
            <a href="/settings/business" className="underline hover:no-underline">
              Update Settings → Business
            </a>
          </p>
        </div>
      )}

      <PayrollForm user={user} settings={settings} />
    </div>
  )
}
