import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import Image from "next/image"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  if (config.selfHosted.isEnabled) {
    redirect(config.selfHosted.redirectUrl)
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-4">
      <Image src="/logo/logo-wide.png" alt="TaxTicks" width={280} height={93} className="w-64 h-auto" />
      <CardTitle className="text-3xl font-bold ">
        <ColoredText>TaxTicks: Cloud Edition</ColoredText>
      </CardTitle>
      <CardContent className="w-full">
        <LoginForm />
      </CardContent>
    </Card>
  )
}
