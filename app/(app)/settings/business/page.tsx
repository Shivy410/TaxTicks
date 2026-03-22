import BusinessSettingsForm from "@/components/settings/business-settings-form"
import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"

export default async function BusinessSettingsPage() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)

  return (
    <>
      <div className="w-full max-w-2xl">
        <BusinessSettingsForm user={user} settings={settings} />
      </div>
    </>
  )
}
