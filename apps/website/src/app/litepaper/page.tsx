"use client";

import Header from "@/components/header";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Globe,
  BookOpen,
  ChevronRight,
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  BarChart3,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Docs() {
  const pathname = usePathname();
  const isZhPath = pathname.includes('/zh');

  const sections = [
    { id: 'vision', label: 'Vision', icon: Zap },
    { id: 'bonding-curve', label: 'Bonding Curve', icon: Activity },
    { id: 'fees', label: 'Fee Protocol', icon: Network },
    { id: 'ai-analysis', label: 'AI Intelligence', icon: Cpu },
    { id: 'comparison', label: 'Market Position', icon: BarChart3 }
  ];

  return (
    <div className="cathedral-shell min-h-full text-foreground pb-20">
      <Header />

      {/* Technical Header */}
      <div className="border-b border-border bg-[color:var(--bg-muted)]">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 cathedral-kicker text-[10px] text-[color:var(--fg-strong)]">
                <span className="flex items-center gap-1.5 border border-border bg-[color:var(--bg-muted)] px-2 py-0.5">
                  <Terminal className="w-3 h-3" />
                  v0.0.1
                </span>
                <span className="text-muted-foreground font-bold">{"// Documentation_Protocol"}</span>
              </div>
              <h1 className="cathedral-title">
                LITEPAPER
              </h1>
              <p className="cathedral-copy max-w-2xl text-[17px]">
                The technical architecture of open-source value extraction and bonding curve mechanics.
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 bg-[color:var(--bg-surface)] border border-border/50  w-fit">
              <Link
                href="/litepaper"
                className={cn(
                  "px-4 py-2 cathedral-kicker text-[10px] transition-all  flex items-center gap-2",
                  !isZhPath ? "border border-border bg-[color:var(--bg-muted)] text-[color:var(--fg-strong)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="w-3 h-3" />
                EN_US
              </Link>
              <Link
                href="/litepaper/zh"
                className={cn(
                  "px-4 py-2 cathedral-kicker text-[10px] transition-all  flex items-center gap-2",
                  isZhPath ? "border border-border bg-[color:var(--bg-muted)] text-[color:var(--fg-strong)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-3 h-3" />
                ZH_CN
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-8 hidden lg:block sticky top-24 h-fit">
          <div className="space-y-1">
            <div className="cathedral-kicker mb-4 pl-2">Index_Registry</div>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="group flex items-center justify-between border border-transparent p-3 transition-all hover:border-border hover:bg-[color:var(--bg-muted)]"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="w-4 h-4 text-muted-foreground group-hover:text-[color:var(--fg-strong)]" />
                  <span className="cathedral-kicker text-[10px] text-muted-foreground group-hover:text-[color:var(--fg-strong)] transition-colors">{section.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-transparent group-hover:text-[color:var(--fg-strong)] transition-all -translate-x-2 group-hover:translate-x-0" />
              </a>
            ))}
          </div>

          <div className="terminal-card border-border bg-[color:var(--bg-muted)] p-6">
            <div className="flex items-center gap-2 text-[color:var(--fg-strong)] mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="cathedral-kicker text-[9px]">Protocol Integrity</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase">
              All market operations are governed by immutable smart contracts on the Solana network layer.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-24 scroll-smooth">

          {/* Section: Vision */}
          <section id="vision" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Zap className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x01_Vision_Architecture</h2>
            </div>
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
              <p className="first-letter:text-4xl first-letter:font-semibold first-letter:text-[color:var(--fg-strong)] first-letter:mr-2 first-letter:float-left">
                The predicament of traditional open source funding models stems from multiple factors. Severe inequality in fund distribution leads to many excellent GitHub projects failing to receive the support they deserve. Cathedral reimaginges funding as a market-driven value capture mechanism.
              </p>
              <p>
                By tokenizing repositories, we transform code from a passive public good into an active tradeable asset. This creates a quantifiable value layer for the open-source ecosystem, allowing developers to capture the economic upside of their innovations.
              </p>
            </div>
          </section>

          {/* Section: Bonding Curve */}
          <section id="bonding-curve" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Activity className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x02_Bonding_Curve_Dynamics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cathedral employs a discrete bonding curve algorithm to manage the liquidity and pricing of project Shares. As supply increases, price follows a deterministic mathematical function, ensuring slippage-aware entries and exits.
                </p>
                <div className="terminal-card p-4 bg-[color:var(--bg-surface)] border-border/40">
                  <div className="cathedral-kicker text-[9px] text-[color:var(--fg-strong)] mb-3 flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    Liquidity Protocol
                  </div>
                  <ul className="space-y-2 text-[10px] text-muted-foreground uppercase font-bold">
                    <li className="flex justify-between border-b border-border/40 pb-1"><span>Target Reserve</span> <span className="text-[color:var(--fg-strong)]">85.00 SOL</span></li>
                    <li className="flex justify-between border-b border-border/40 pb-1"><span>Fee Capture</span> <span className="text-[color:var(--fg-strong)]">7.00%</span></li>
                    <li className="flex justify-between"><span>Mint Capacity</span> <span className="text-[color:var(--fg-strong)]">1B SHARES</span></li>
                  </ul>
                </div>
              </div>
              <div className="terminal-card overflow-hidden bg-[color:var(--bg-surface)] aspect-video flex items-center justify-center relative group">
                <div className="absolute inset-0 opacity-50" />
                <Activity className="w-16 h-16 text-[color:var(--fg-muted)]/40 group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute bottom-4 left-4 text-[9px] text-muted-foreground uppercase opacity-40 font-semibold tracking-widest animate-pulse">Scanning_Market_Pulse...</span>
              </div>
            </div>
          </section>

          {/* Section: Fees */}
          <section id="fees" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Network className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x03_Fee_Distribution_Protocol</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our protocol adopts an automated fee sharing model aimed at incentivizing continuous development and contribution.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="terminal-card p-6 border-border/40 bg-[color:var(--bg-surface)]">
                  <h4 className="text-sm font-semibold uppercase tracking-widest mb-4 text-[color:var(--fg-strong)]">Mainnet_Default_Logic</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">Maintainer Grant</span>
                      <span className="text-[color:var(--fg-strong)] text-lg  tracking-tight font-semibold">5.0%</span>
                    </div>
                    <div className="h-1 bg-[color:var(--bg-muted)] overflow-hidden">
                      <div className="h-full bg-primary w-[70%]" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">Ecosystem Fee</span>
                      <span className="text-[color:var(--fg-strong)] text-lg  tracking-tight font-semibold">2.0%</span>
                    </div>
                    <div className="h-1 bg-[color:var(--bg-muted)] overflow-hidden">
                      <div className="h-full bg-[color:var(--fg-muted)] w-[30%]" />
                    </div>
                  </div>
                </div>

                <div className="terminal-card p-6 border-border/40 bg-[color:var(--bg-surface)] flex flex-col justify-center">
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-strong)] mb-2">Automation Layer</h4>
                  <p className="text-[11px] text-muted-foreground uppercase leading-relaxed">
                    Fees are directly routed to project wallets or used to execute sub-dependency token buybacks and burns automatically via the distribution contract.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: AI */}
          <section id="ai-analysis" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Cpu className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x04_Intelligence_Layer</h2>
            </div>
            <div className="p-8 terminal-card border-border relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <h3 className="cathedral-h2 text-[26px]">Neural Network Project Evaluation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Cathedral integrates LLM-based behavioral analysis of GitHub repositories. Our AI evaluates commit history, technology stack health, community sentiment, and development momentum to provide real-time investment scores.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['Commit_Density', 'Sentiment_Pulse', 'Stack_Modernity', 'Impact_Score'].map((tag) => (
                    <span key={tag} className="cathedral-kicker border border-border bg-[color:var(--bg-muted)] px-2 py-1 text-[9px] text-[color:var(--fg-strong)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-32 -mt-32 h-64 w-64 bg-[color:var(--bg-muted)]" />
            </div>
          </section>

          {/* Section: Comparison */}
          <section id="comparison" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <BarChart3 className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x05_Positioning_Strategy</h2>
            </div>
            <div className="terminal-card overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="bg-[color:var(--bg-muted)] text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="px-6 py-4 font-semibold">Parameter</th>
                    <th className="px-6 py-4 font-semibold">Legacy Platforms</th>
                    <th className="px-6 py-4 font-semibold text-[color:var(--fg-strong)]">Cathedral Protocol</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] uppercase font-semibold tracking-tight">
                  <tr className="border-b border-border/40 hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">Verification</td>
                    <td className="px-6 py-4">Informal / Self-Cert</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">Github_Auth_Owned</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">Value Driver</td>
                    <td className="px-6 py-4">Meme / Speculation</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">Project_Utility</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">Governance</td>
                    <td className="px-6 py-4">None / Centralized</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">Automated_Bonding</td>
                  </tr>
                  <tr className="hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">Yield Vector</td>
                    <td className="px-6 py-4">Exit_Liquidity</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">Maintainer_Grants</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
