import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"
import { manifest } from "./manifest"
import { RevolutDashboard } from "./components/revolut-dashboard"

export default async function RevolutApp() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)

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
            Connect your Revolut Business account to automatically import bank transactions.
            Imported transactions appear in the Unsorted queue for review and receipt matching.
          </p>
        </div>
      </header>

      <RevolutDashboard settings={settings} />
    </div>
  )
}
