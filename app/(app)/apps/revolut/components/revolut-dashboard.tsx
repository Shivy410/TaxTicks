"use client"

import { Button } from "@/components/ui/button"
import { SettingsMap } from "@/models/settings"
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Unplug,
  Wifi,
} from "lucide-react"
import { useState } from "react"
import {
  disconnectRevolutAction,
  exchangeRevolutCodeAction,
  getRevolutAccountsAction,
  saveRevolutCredentialsAction,
  syncRevolutTransactionsAction,
} from "../actions"

interface RevolutDashboardProps {
  settings: SettingsMap
}

export function RevolutDashboard({ settings }: RevolutDashboardProps) {
  const isConnected = settings["revolut_is_connected"] === "true"
  const lastSyncedAt = settings["revolut_last_synced_at"]
  const isSandbox = settings["revolut_is_sandbox"] === "true"
  const savedClientId = settings["revolut_client_id"] || ""
  const savedRedirectUri = settings["revolut_redirect_uri"] || ""

  // Step 1 state
  const [clientId, setClientId] = useState(savedClientId)
  const [privateKey, setPrivateKey] = useState("")
  const [redirectUri, setRedirectUri] = useState(savedRedirectUri || "https://example.com")
  const [sandbox, setSandbox] = useState(isSandbox)
  const [step1Loading, setStep1Loading] = useState(false)
  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [consentUrl, setConsentUrl] = useState<string | null>(null)

  // Step 2 state
  const [authCode, setAuthCode] = useState("")
  const [step2Loading, setStep2Loading] = useState(false)
  const [step2Error, setStep2Error] = useState<string | null>(null)

  // Sync state
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<{ id: string; name: string; balance: number; currency: string }[] | null>(null)
  const [selectedAccount, setSelectedAccount] = useState("")
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split("T")[0]
  })

  // Disconnect state
  const [disconnectLoading, setDisconnectLoading] = useState(false)

  async function handleSaveCredentials() {
    if (!clientId || !privateKey || !redirectUri) {
      setStep1Error("Please fill in all fields.")
      return
    }
    setStep1Loading(true)
    setStep1Error(null)
    const res = await saveRevolutCredentialsAction({ clientId, privateKey, redirectUri, isSandbox: sandbox })
    setStep1Loading(false)
    if (!res.success) {
      setStep1Error(res.error || "Failed to save credentials")
    } else {
      setConsentUrl(res.consentUrl || null)
    }
  }

  async function handleExchangeCode() {
    if (!authCode.trim()) {
      setStep2Error("Please paste the authorization code.")
      return
    }
    setStep2Loading(true)
    setStep2Error(null)
    const res = await exchangeRevolutCodeAction(authCode.trim())
    setStep2Loading(false)
    if (!res.success) {
      setStep2Error(res.error || "Failed to exchange code")
    }
    // Page will re-render with isConnected = true via server revalidation
  }

  async function handleFetchAccounts() {
    const res = await getRevolutAccountsAction()
    if (res.success && res.accounts) {
      setAccounts(res.accounts)
    }
  }

  async function handleSync() {
    setSyncLoading(true)
    setSyncResult(null)
    setSyncError(null)
    const res = await syncRevolutTransactionsAction({
      fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
      accountId: selectedAccount || undefined,
    })
    setSyncLoading(false)
    if (!res.success) {
      setSyncError(res.error || "Sync failed")
    } else {
      setSyncResult({ imported: res.imported, skipped: res.skipped })
    }
  }

  async function handleDisconnect() {
    setDisconnectLoading(true)
    await disconnectRevolutAction()
    setDisconnectLoading(false)
  }

  if (isConnected) {
    return (
      <div className="space-y-6 max-w-2xl">
        {/* Connected status */}
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Wifi className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-800">Connected to Revolut Business</p>
            {lastSyncedAt && (
              <p className="text-xs text-green-700">
                Last synced: {new Date(lastSyncedAt).toLocaleString("en-IE")}
              </p>
            )}
            {isSandbox && (
              <p className="text-xs text-yellow-700 mt-1">Sandbox mode — using test data</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectLoading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {disconnectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
            <span className="ml-2">Disconnect</span>
          </Button>
        </div>

        {/* Account selector */}
        <div className="space-y-3">
          <h3 className="font-semibold">Sync Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sync From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account (optional)</label>
              <div className="flex gap-2">
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">All accounts</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency} {a.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={handleFetchAccounts} title="Load accounts">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync button */}
        <div className="space-y-3">
          <Button onClick={handleSync} disabled={syncLoading} className="w-full md:w-auto">
            {syncLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Sync Transactions Now</>
            )}
          </Button>

          {syncResult && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Sync complete — <strong>{syncResult.imported}</strong> transactions imported,{" "}
                <strong>{syncResult.skipped}</strong> skipped (already imported or failed).
                New transactions are in <a href="/unsorted" className="underline">Unsorted</a>.
              </span>
            </div>
          )}

          {syncError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {syncError}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">How syncing works</p>
          <p>
            Synced transactions are imported as <strong>Unverified</strong> and appear in the{" "}
            <a href="/unsorted" className="underline">Unsorted</a> queue. Review each one, upload the
            matching receipt, and the AI will extract the VAT details and categorise it automatically.
          </p>
          <p>
            Duplicate detection is based on the Revolut transaction ID — re-syncing will never create
            duplicate transactions.
          </p>
        </div>
      </div>
    )
  }

  // ─── Setup Wizard (not connected) ─────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        <p className="font-semibold mb-1">Before you start</p>
        <p>
          Revolut Business API uses OAuth 2.0 with certificate-based authentication. You will need to
          generate an RSA key pair and upload the public certificate to your Revolut Business account.
          This is a one-time setup.
        </p>
      </div>

      {/* Step 1 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</div>
          <h3 className="font-semibold text-base">Generate your certificate and get your Client ID</h3>
        </div>
        <div className="ml-10 space-y-3 text-sm text-muted-foreground">
          <p>Run these commands in your Mac Terminal to generate an RSA key pair:</p>
          <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto font-mono">
{`openssl genrsa -out privatecert.pem 2048
openssl req -new -x509 -key privatecert.pem -out publiccert.cer -days 1825`}
          </pre>
          <p>
            Then go to{" "}
            <a
              href="https://business.revolut.com/settings/apis?tab=business-api"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              Revolut Business → Settings → APIs → Business API
              <ExternalLink className="w-3 h-3" />
            </a>
            , click <strong>Add API certificate</strong>, paste the contents of{" "}
            <code>publiccert.cer</code>, set the redirect URI (e.g. <code>https://example.com</code>),
            and copy the <strong>Client ID</strong> shown.
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">2</div>
          <h3 className="font-semibold text-base">Enter your credentials</h3>
        </div>
        <div className="ml-10 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. RB-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Private Key (contents of privatecert.pem)</label>
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
              rows={6}
              className="w-full border rounded-md px-3 py-2 text-xs bg-background font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is stored securely in your local database and never sent anywhere except Revolut's servers.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">OAuth Redirect URI</label>
            <input
              type="text"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              placeholder="https://example.com"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must exactly match the redirect URI you entered in Revolut. For local testing, use <code>https://example.com</code>.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="rounded"
            />
            Use Sandbox environment (for testing only)
          </label>

          {step1Error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {step1Error}
            </div>
          )}

          <Button onClick={handleSaveCredentials} disabled={step1Loading}>
            {step1Loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save & Generate Consent URL"}
          </Button>

          {consentUrl && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-blue-800">Credentials saved! Now authorise the app:</p>
              <a
                href={consentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-700 underline"
              >
                <ExternalLink className="w-4 h-4" />
                Open Revolut consent page
              </a>
              <p className="text-xs text-blue-700">
                After approving, you will be redirected to your redirect URI with a <code>?code=...</code> parameter in the URL.
                Copy that code and paste it below.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">3</div>
          <h3 className="font-semibold text-base">Paste the authorization code</h3>
        </div>
        <div className="ml-10 space-y-4">
          <p className="text-sm text-muted-foreground">
            After approving on Revolut, copy the <code>code</code> value from the redirect URL
            (e.g. <code>https://example.com?code=<strong>xxxxxxxx</strong></code>) and paste it here.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Authorization Code</label>
            <input
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Paste the code from the redirect URL"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
            />
          </div>

          {step2Error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {step2Error}
            </div>
          )}

          <Button onClick={handleExchangeCode} disabled={step2Loading || !authCode}>
            {step2Loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</> : "Connect to Revolut"}
          </Button>
        </div>
      </div>
    </div>
  )
}
