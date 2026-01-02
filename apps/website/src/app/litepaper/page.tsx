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
    <div className="bg-background text-foreground min-h-full font-mono selection:bg-cathedral-500/30 pb-20">
      <Header />

      {/* Technical Header */}
      <div className="border-b border-border bg-secondary/10">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-cathedral-400">
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-cathedral-500/10 border border-cathedral-500/20 rounded-sm">
                  <Terminal className="w-3 h-3" />
                  v0.0.1
                </span>
                <span className="text-muted-foreground/40 font-bold">{"// Documentation_Protocol"}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                LITEPAPER
              </h1>
              <p className="text-muted-foreground text-sm uppercase tracking-wider max-w-2xl font-medium">
                The technical architecture of open-source value extraction and bonding curve mechanics.
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 bg-black/40 border border-border/50 rounded-sm w-fit">
              <Link
                href="/litepaper"
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm flex items-center gap-2",
                  !isZhPath ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="w-3 h-3" />
                EN_US
              </Link>
              <Link
                href="/litepaper/zh"
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm flex items-center gap-2",
                  isZhPath ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
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
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 pl-2">Index_Registry</div>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="group flex items-center justify-between p-3 rounded-sm hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="w-4 h-4 text-muted-foreground group-hover:text-cathedral-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">{section.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-white/0 group-hover:text-white/50 transition-all -translate-x-2 group-hover:translate-x-0" />
              </a>
            ))}
          </div>

          <div className="p-6 terminal-card border-cathedral-500/20 bg-cathedral-500/5">
            <div className="flex items-center gap-2 text-cathedral-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Protocol Integrity</span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 leading-relaxed uppercase">
              All market operations are governed by immutable smart contracts on the Solana network layer.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-24 scroll-smooth">

          {/* Section: Vision */}
          <section id="vision" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Zap className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x01_Vision_Architecture</h2>
            </div>
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
              <p className="first-letter:text-4xl first-letter:font-black first-letter:text-white first-letter:mr-2 first-letter:float-left">
                The predicament of traditional open source funding models stems from multiple factors. Severe inequality in fund distribution leads to many excellent GitHub projects failing to receive the support they deserve. Cathedral reimaginges funding as a market-driven value capture mechanism.
              </p>
              <p>
                By tokenizing repositories, we transform code from a passive public good into an active tradeable asset. This creates a quantifiable value layer for the open-source ecosystem, allowing developers to capture the economic upside of their innovations.
              </p>
            </div>
          </section>

          {/* Section: Bonding Curve */}
          <section id="bonding-curve" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Activity className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x02_Bonding_Curve_Dynamics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cathedral employs a discrete bonding curve algorithm to manage the liquidity and pricing of project Shares. As supply increases, price follows a deterministic mathematical function, ensuring slippage-aware entries and exits.
                </p>
                <div className="terminal-card p-4 bg-black/40 border-border/40">
                  <div className="text-[9px] font-black uppercase tracking-widest text-cathedral-400 mb-3 flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    Liquidity Protocol
                  </div>
                  <ul className="space-y-2 text-[10px] text-muted-foreground uppercase font-bold">
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>Target Reserve</span> <span className="text-white">85.00 SOL</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>Fee Capture</span> <span className="text-white">7.00%</span></li>
                    <li className="flex justify-between"><span>Mint Capacity</span> <span className="text-white">1B SHARES</span></li>
                  </ul>
                </div>
              </div>
              <div className="terminal-card overflow-hidden bg-black aspect-video flex items-center justify-center relative group">
                <div className="absolute inset-0 opacity-50" />
                <Activity className="w-16 h-16 text-cathedral-500/20 group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute bottom-4 left-4 text-[9px] text-muted-foreground uppercase opacity-40 font-black tracking-widest animate-pulse">Scanning_Market_Pulse...</span>
              </div>
            </div>
          </section>

          {/* Section: Fees */}
          <section id="fees" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Network className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x03_Fee_Distribution_Protocol</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our protocol adopts an automated fee sharing model aimed at incentivizing continuous development and contribution.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="terminal-card p-6 border-white/5 bg-white/[0.02]">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-4 italic text-white/90">Mainnet_Default_Logic</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">Maintainer Grant</span>
                      <span className="text-cathedral-400 text-lg italic tracking-tight font-black">5.0%</span>
                    </div>
                    <div className="h-1 bg-white/5 overflow-hidden">
                      <div className="h-full bg-cathedral-500 w-[70%]" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">Ecosystem Fee</span>
                      <span className="text-white text-lg italic tracking-tight font-black">2.0%</span>
                    </div>
                    <div className="h-1 bg-white/5 overflow-hidden">
                      <div className="h-full bg-white/40 w-[30%]" />
                    </div>
                  </div>
                </div>

                <div className="terminal-card p-6 border-white/5 bg-white/[0.02] flex flex-col justify-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cathedral-400 mb-2">Automation Layer</h4>
                  <p className="text-[11px] text-muted-foreground uppercase leading-relaxed">
                    Fees are directly routed to project wallets or used to execute sub-dependency token buybacks and burns automatically via the distribution contract.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: AI */}
          <section id="ai-analysis" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Cpu className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x04_Intelligence_Layer</h2>
            </div>
            <div className="p-8 terminal-card border-cathedral-500/30 relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-bold italic tracking-tight font-black uppercase italic">Neural Network Project Evaluation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Cathedral integrates LLM-based behavioral analysis of GitHub repositories. Our AI evaluates commit history, technology stack health, community sentiment, and development momentum to provide real-time investment scores.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['Commit_Density', 'Sentiment_Pulse', 'Stack_Modernity', 'Impact_Score'].map((tag) => (
                    <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-cathedral-500/10 text-cathedral-400 border border-cathedral-500/20 rounded-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cathedral-500/5 -mr-32 -mt-32" />
            </div>
          </section>

          {/* Section: Comparison */}
          <section id="comparison" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <BarChart3 className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x05_Positioning_Strategy</h2>
            </div>
            <div className="terminal-card overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="px-6 py-4 font-black">Parameter</th>
                    <th className="px-6 py-4 font-black">Legacy Platforms</th>
                    <th className="px-6 py-4 font-black text-cathedral-400">Cathedral Protocol</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] uppercase font-bold tracking-tight">
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">Verification</td>
                    <td className="px-6 py-4">Informal / Self-Cert</td>
                    <td className="px-6 py-4 text-emerald-500">Github_Auth_Owned</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">Value Driver</td>
                    <td className="px-6 py-4">Meme / Speculation</td>
                    <td className="px-6 py-4 text-emerald-500">Project_Utility</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">Governance</td>
                    <td className="px-6 py-4">None / Centralized</td>
                    <td className="px-6 py-4 text-emerald-500">Automated_Bonding</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">Yield Vector</td>
                    <td className="px-6 py-4">Exit_Liquidity</td>
                    <td className="px-6 py-4 text-emerald-500">Maintainer_Grants</td>
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