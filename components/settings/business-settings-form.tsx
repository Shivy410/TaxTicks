"use client"

import { saveProfileAction } from "@/app/(app)/settings/actions"
import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormAvatar, FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { SettingsMap } from "@/models/settings"
import { User } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function BusinessSettingsForm({ user, settings }: { user: User; settings: SettingsMap }) {
  const [saveState, saveAction, pending] = useActionState(saveProfileAction, null)
  const [saveSettingsState, saveSettingsAction2, settingsPending] = useActionState(saveSettingsAction, null)

  return (
    <div className="space-y-8">
      {/* Business Profile */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Business Profile</h2>
        <form action={saveAction} className="space-y-4">
          <FormInput
            title="Business Name"
            name="businessName"
            placeholder="Acme Ltd."
            defaultValue={user.businessName ?? ""}
          />

          <FormTextarea
            title="Business Address"
            name="businessAddress"
            placeholder="123 Main Street, Dublin 1, Ireland"
            defaultValue={user.businessAddress ?? ""}
          />

          <FormTextarea
            title="Bank Details"
            name="businessBankDetails"
            placeholder="Revolut Business&#10;IBAN: IE00 REVO 0000 0000 0000 00&#10;BIC: REVOIE23"
            defaultValue={user.businessBankDetails ?? ""}
          />

          <FormAvatar
            title="Business Logo"
            name="businessLogo"
            className="w-52 h-52"
            defaultValue={user.businessLogo ?? ""}
          />

          <div className="flex flex-row items-center gap-4">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Profile"}
            </Button>
            {saveState?.success && (
              <p className="text-green-500 flex flex-row items-center gap-2">
                <CircleCheckBig />
                Saved!
              </p>
            )}
          </div>

          {saveState?.error && <FormError>{saveState.error}</FormError>}
        </form>
      </div>

      {/* Irish Company Details */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Irish Company Details</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These details are used for payroll calculations, VAT invoices, and Revenue compliance.
        </p>
        <form action={saveSettingsAction2} className="space-y-4">
          <FormInput
            title="VAT Registration Number"
            name="company_vat_number"
            placeholder="IE1234567T"
            defaultValue={settings["company_vat_number"] ?? ""}
          />

          <FormInput
            title="CRO Number"
            name="company_cro_number"
            placeholder="123456"
            defaultValue={settings["company_cro_number"] ?? ""}
          />

          <FormInput
            title="Director PPSN"
            name="company_ppsn"
            placeholder="1234567A"
            defaultValue={settings["company_ppsn"] ?? ""}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              title="Annual Tax Credits (€)"
              name="payroll_tax_credits"
              placeholder="4000"
              defaultValue={settings["payroll_tax_credits"] ?? "4000"}
            />

            <FormInput
              title="Standard Rate Cut-Off Point (€)"
              name="payroll_standard_rate_cutoff"
              placeholder="44000"
              defaultValue={settings["payroll_standard_rate_cutoff"] ?? "44000"}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Tax credits default to €4,000 (single person: €2,000 employee credit + €2,000 earned income credit).
            Standard rate cut-off defaults to €44,000 for a single person (2026 rates).
          </p>

          <div className="flex flex-row items-center gap-4">
            <Button type="submit" disabled={settingsPending}>
              {settingsPending ? "Saving..." : "Save Irish Details"}
            </Button>
            {saveSettingsState?.success && (
              <p className="text-green-500 flex flex-row items-center gap-2">
                <CircleCheckBig />
                Saved!
              </p>
            )}
          </div>

          {saveSettingsState?.error && <FormError>{saveSettingsState.error}</FormError>}
        </form>
      </div>
    </div>
  )
}
