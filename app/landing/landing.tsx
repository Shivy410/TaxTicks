import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import Image from "next/image"
import Link from "next/link"
import {
  Bot,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  BookOpen,
  Box,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Cloud,
  Code2,
  Cpu,
  Database,
  Download,
  FileSearch,
  FileText,
  Filter,
  Globe,
  Key,
  Landmark,
  LayoutDashboard,
  Lock,
  Receipt,
  RefreshCw,
  Search,
  Server,
  Settings2,
  Shield,
  SlidersHorizontal,
  Star,
  Upload,
  Wand2,
  Zap,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #e8f0eb 0%, #f6f1e8 50%, #e2e8e4 100%)" }}>
      {/* Header */}
      <header className="py-5 px-4 md:px-8 bg-white/70 backdrop-blur-xl shadow-sm border-b border-white/60 fixed w-full z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo/logo-wide.png" alt="TaxTicks" width={140} height={46} className="h-9 w-auto" />
          </Link>
          <Link
            href="/enter"
            className="cursor-pointer font-semibold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all duration-200 text-sm shadow-sm"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Zap className="h-3.5 w-3.5" />
              Under Active Development
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6 text-foreground pb-2">
              Let AI finally care about{" "}
              <span className="text-primary">your taxes</span>,<br />
              scan receipts and analyse expenses
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium">
              Self-hosted accounting app crafted for freelancers, indie-hackers and small businesses
            </p>
            <div className="flex gap-4 justify-center text-sm md:text-base">
              <Link
                href="#start"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`mailto:${config.app.supportEmail}`}
                className="inline-flex items-center gap-2 px-8 py-4 border border-border bg-white/70 text-foreground font-bold rounded-xl hover:bg-white transition-all duration-200 hover:-translate-y-0.5"
              >
                Contact Us
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/60">
            <video className="w-full h-auto" autoPlay loop muted playsInline poster="/landing/ai-scanner-big.webp">
              <source src="/landing/video.mp4" type="video/mp4" />
              <Image src="/landing/ai-scanner-big.webp" alt="TaxTicks" width={1728} height={1080} priority />
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-3">
              Your Taxes, <ColoredText>Simplified</ColoredText>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              TaxTicks saves you time, money and nerves
            </p>
          </div>

          {/* AI Scanner Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-16 bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 group">
            <div className="flex-1 min-w-60">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold mb-5">
                <Bot className="h-4 w-4" />
                LLM-Powered
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Analyse photos and invoices with AI</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Upload your receipts or invoices in PDF for automatic recognition",
                  "Extract key information like dates, items, and vendors",
                  "Works with any language and any photo quality",
                  "Automatically organise everything into a structured database",
                  "Bulk upload and analyse multiple files at once",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-white/60">
              <Image src="/landing/ai-scanner.webp" alt="AI Document Analyser" width={1900} height={1524} />
            </div>
          </div>

          {/* Multi-currency Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-16 bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 group flex-row-reverse">
            <div className="flex-1 min-w-60">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 text-sm font-semibold mb-5">
                <Globe className="h-4 w-4" />
                Currency Converter
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Automatically convert currencies (even crypto!)</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Detects foreign currencies and converts to yours",
                  "Knows historical exchange rates on the date of transaction",
                  "Supports 170+ world currencies",
                  "Works with popular cryptocurrencies (BTC, ETH, LTC, etc.)",
                  "Still allows you to fill it manually",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-white/60">
              <Image src="/landing/multi-currency.webp" alt="Currency Converter" width={1400} height={1005} />
            </div>
          </div>

          {/* Transaction Table Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-16 bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 group">
            <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-white/60">
              <Image src="/landing/transactions.webp" alt="Transactions Table" width={2000} height={1279} />
            </div>
            <div className="flex-1 min-w-60">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-700 text-sm font-semibold mb-5">
                <Filter className="h-4 w-4" />
                Filters & Categories
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Organise transactions with fully customisable categories, projects and fields</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Absolute freedom to create custom categories, projects and fields",
                  "Add, edit and manage your transactions",
                  "Filter by any column, category or date range",
                  "Customise which columns to show in the table",
                  "Import transactions from CSV",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Invoice Generator */}
          <div className="flex flex-wrap items-center gap-12 mb-16 bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 group flex-row-reverse">
            <div className="flex-1 min-w-60">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-700 text-sm font-semibold mb-5">
                <Receipt className="h-4 w-4" />
                Invoice Generator
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Create custom invoices</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Advanced invoice generator to create any invoice in any language",
                  "Edit any field, even labels and titles",
                  "Export invoices to PDF or as transactions",
                  "Save invoices as templates to reuse them later",
                  "Native support for both included and excluded taxes (VAT, GST, etc.)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="max-w-sm flex-1 relative rounded-xl overflow-hidden shadow-lg border border-white/60">
              <Image src="/landing/invoice-generator.webp" alt="Invoice Generator" width={1800} height={1081} />
            </div>
          </div>

          {/* Custom Fields & AI Control */}
          <div className="flex flex-wrap items-center gap-12 mb-16 bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 group">
            <div className="flex-1 min-w-60">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-700 text-sm font-semibold mb-5">
                <Wand2 className="h-4 w-4" />
                Control over AI
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Tune any LLM prompt to extract anything you need</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Expand and improve your TaxTicks instance with custom LLM prompts",
                  "Create custom fields and categories and tell AI how to parse them",
                  "Extract any additional information you need",
                  "Automatically categorise by project or category",
                  "Ask AI to assess risk level or any other criteria",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-white/60">
              <Image src="/landing/custom-llm.webp" alt="Custom LLM prompts" width={1800} height={1081} />
            </div>
          </div>

          {/* Data Export */}
          <div className="flex flex-wrap items-center gap-12 mb-16 bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 group flex-row-reverse">
            <div className="flex-1 min-w-60">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-700 text-sm font-semibold mb-5">
                <Box className="h-4 w-4" />
                Self-hosting & Data Export
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Your Data — Your Rules</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Deploy your own instance of TaxTicks for 100% privacy",
                  "Export your transactions to CSV for tax prep",
                  "Full-text search across documents and invoices",
                  "Download full data archive to migrate to another service",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-white/60">
              <Image src="/landing/export.webp" alt="Export" width={1200} height={1081} />
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section id="start" className="py-20 px-8 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Choose Your Version of <ColoredText>TaxTicks</ColoredText>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Self-Hosted */}
            <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Server className="h-4 w-4" />
                Use Your Own Server
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Self-Hosted Edition</h3>
              <ul className="space-y-3 text-muted-foreground mb-8">
                {[
                  { icon: BadgeCheck, text: "Free and Open Source" },
                  { icon: Lock, text: "Complete control over your data" },
                  { icon: Building2, text: "Deploy at your own infrastructure or home server" },
                  { icon: Key, text: "Bring your own keys (OpenAI, Gemini, Mistral, etc.)" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="https://github.com/Shivy410/TaxTicks"
                target="_blank"
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                GitHub + Docker Compose
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Cloud Version */}
            <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300 relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-700 text-sm font-semibold mb-6">
                <Cloud className="h-4 w-4" />
                We Host It For You
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Cloud Edition</h3>
              <ul className="space-y-3 text-muted-foreground mb-8">
                {[
                  { icon: Zap, text: "SaaS version if you don't want to hassle with own servers" },
                  { icon: Bot, text: "We provide you with AI keys and storage" },
                  { icon: CircleDollarSign, text: "Yearly subscription plans. No hidden fees" },
                  { icon: RefreshCw, text: "Automatic updates and new features" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <Icon className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-muted text-muted-foreground font-bold rounded-xl shadow-sm opacity-70 cursor-not-allowed"
              >
                Temporarily Unavailable
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-20 px-8 mt-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Upcoming Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;re a small, indie project constantly improving. Here&apos;s what we&apos;re working on next.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/60 backdrop-blur-md p-7 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Better AI Analytics & Agents</h3>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {["Income & expense insights", "AI agents to automate your workflows", "Recommendations for tax optimisation", "Custom and local LLM models"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/60 backdrop-blur-md p-7 rounded-2xl shadow-sm border border-white/70 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Landmark className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Bank Integrations</h3>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {["Revolut Business API sync", "Automatic transaction import", "Receipt-to-transaction reconciliation", "Real-time balance tracking"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <ChevronRight className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-8 border-t border-border/50 bg-white/40 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Image src="/logo/logo-wide.png" alt="TaxTicks" width={120} height={40} className="h-8 w-auto opacity-70" />
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/docs/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/docs/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href={`mailto:${config.app.supportEmail}`} className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TaxTicks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
