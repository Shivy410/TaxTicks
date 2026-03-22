import Link from "next/link"
import { getApps } from "./common"
import * as LucideIcons from "lucide-react"
import { Grid3X3 } from "lucide-react"

function AppIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name]
  if (!Icon) return <Grid3X3 className="h-6 w-6" />
  return <Icon className="h-6 w-6" />
}

export default async function AppsPage() {
  const apps = await getApps()

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">Apps</span>
          <span className="text-3xl tracking-tight opacity-20">{apps.length}</span>
        </h2>
      </header>

      <main className="flex flex-row gap-4 flex-wrap">
        {apps.map((app) => (
          <Link
            key={app.id}
            href={`/apps/${app.id}`}
            className="block max-w-[320px] p-6 bg-white/60 backdrop-blur-md rounded-xl hover:bg-white/80 hover:-translate-y-0.5 transition-all border border-white/70 shadow-sm hover:shadow-md group"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <AppIcon name={app.manifest.icon} />
                </div>
                <div className="text-lg font-semibold tracking-tight">{app.manifest.name}</div>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">{app.manifest.description}</div>
            </div>
          </Link>
        ))}
      </main>
    </>
  )
}
