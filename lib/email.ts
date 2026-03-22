import { NewsletterWelcomeEmail } from "@/components/emails/newsletter-welcome-email"
import { OTPEmail } from "@/components/emails/otp-email"
import React from "react"
import { Resend } from "resend"
import config from "./config"

let resendClient: Resend | null = null

export function isEmailConfigured() {
  const apiKey = config.email.apiKey?.trim()
  return Boolean(apiKey && apiKey !== "please-set-your-resend-api-key-here")
}

export function getResendClient() {
  const apiKey = config.email.apiKey?.trim()

  if (!isEmailConfigured() || !apiKey) {
    throw new Error("Email is not configured. Set RESEND_API_KEY to enable email features.")
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }

  return resendClient
}

export async function sendOTPCodeEmail({ email, otp }: { email: string; otp: string }) {
  const html = React.createElement(OTPEmail, { otp })

  return await getResendClient().emails.send({
    from: config.email.from,
    to: email,
    subject: "Your TaxTicks verification code",
    react: html,
  })
}

export async function sendNewsletterWelcomeEmail(email: string) {
  const html = React.createElement(NewsletterWelcomeEmail)

  return await getResendClient().emails.send({
    from: config.email.from,
    to: email,
    subject: "Welcome to TaxTicks Newsletter!",
    react: html,
  })
}
