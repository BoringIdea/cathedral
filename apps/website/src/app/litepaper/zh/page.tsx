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

export default function DocsZh() {
  const pathname = usePathname();
  const isZhPath = pathname.includes('/zh');

  const sections = [
    { id: 'vision', label: '愿景架构', icon: Zap },
    { id: 'bonding-curve', label: '联合曲线', icon: Activity },
    { id: 'fees', label: '手续费协议', icon: Network },
    { id: 'ai-analysis', label: 'AI 智能层', icon: Cpu },
    { id: 'comparison', label: '市场定位', icon: BarChart3 }
  ];

  return (
    <div className="bg-background text-foreground min-h-full font-mono selection:bg-cathedral-500/30 pb-20">
      <Header />

      {/* 技术头部 */}
      <div className="border-b border-border bg-secondary/10">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-cathedral-400">
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-cathedral-500/10 border border-cathedral-500/20 rounded-sm">
                  <Terminal className="w-3 h-3" />
                  v0.0.1
                </span>
                <span className="text-muted-foreground/40 font-bold">{"// 文档协议 / DOCUMENTATION_PROTOCOL"}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                技术白皮书
              </h1>
              <p className="text-muted-foreground text-sm uppercase tracking-wider max-w-2xl font-medium">
                开源价值提取、联合曲线机制与流动性协议的技术架构。
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

        {/* 侧边导航 */}
        <aside className="lg:col-span-3 space-y-8 hidden lg:block sticky top-24 h-fit">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 pl-2">目录索引 / INDEX</div>
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
              <span className="text-[9px] font-black uppercase tracking-widest">协议完整性</span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 leading-relaxed uppercase">
              所有市场操作均受 Solana 网络层上不可篡改的智能合约管理。
            </p>
          </div>
        </aside>

        {/* 内容区域 */}
        <div className="lg:col-span-9 space-y-24 scroll-smooth">

          {/* Section: 愿景 */}
          <section id="vision" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Zap className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x01_愿景架构</h2>
            </div>
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
              <p className="first-letter:text-4xl first-letter:font-black first-letter:text-white first-letter:mr-2 first-letter:float-left">
                传统开源资助模式的困境源于多重因素。资金分配的严重不平等使得许多优秀的 GitHub 项目无法获得应有的支持。Cathedral 将资助重新想象为一种市场驱动的价值捕获机制。
              </p>
              <p>
                通过代币化仓库，我们将代码从被动的公共产品转变为主动的可交易资产。这为开源生态系统创造了一个可量化的价值层，允许开发者捕获其创新带来的经济增长。
              </p>
            </div>
          </section>

          {/* Section: 联合曲线 */}
          <section id="bonding-curve" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Activity className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x02_联合曲线动力学</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cathedral 采用离散联合曲线算法来管理项目份额（Shares）的流动性和定价。随着供应量增加，价格遵循确定的数学函数，确保了具备滑点感知能力的进场与退出。
                </p>
                <div className="terminal-card p-4 bg-black/40 border-border/40">
                  <div className="text-[9px] font-black uppercase tracking-widest text-cathedral-400 mb-3 flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    流动性协议 / LIQUIDITY_PROTOCOL
                  </div>
                  <ul className="space-y-2 text-[10px] text-muted-foreground uppercase font-bold">
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>目标储备</span> <span className="text-white">85.00 SOL</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>手续费捕获</span> <span className="text-white">7.00%</span></li>
                    <li className="flex justify-between"><span>铸造上限</span> <span className="text-white">10亿 SHARES</span></li>
                  </ul>
                </div>
              </div>
              <div className="terminal-card overflow-hidden bg-black aspect-video flex items-center justify-center relative group">
                <div className="absolute inset-0 opacity-50" />
                <Activity className="w-16 h-16 text-cathedral-500/20 group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute bottom-4 left-4 text-[9px] text-muted-foreground uppercase opacity-40 font-black tracking-widest animate-pulse">扫描市场频率 / SCANNING_MARKET_PULSE...</span>
              </div>
            </div>
          </section>

          {/* Section: 手续费 */}
          <section id="fees" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Network className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x03_手续费分发协议</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                本协议采用全自动的手续费分配模型，旨在激励开源项目的持续开发与贡献。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="terminal-card p-6 border-white/5 bg-white/[0.02]">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-4 italic text-white/90">主网默认逻辑 / MAINNET_LOGIC</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">维护者资助 (Maintainer)</span>
                      <span className="text-cathedral-400 text-lg italic tracking-tight font-black">5.0%</span>
                    </div>
                    <div className="h-1 bg-white/5 overflow-hidden">
                      <div className="h-full bg-cathedral-500 w-[70%]" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">生态系统费 (Ecosystem)</span>
                      <span className="text-white text-lg italic tracking-tight font-black">2.0%</span>
                    </div>
                    <div className="h-1 bg-white/5 overflow-hidden">
                      <div className="h-full bg-white/40 w-[30%]" />
                    </div>
                  </div>
                </div>

                <div className="terminal-card p-6 border-white/5 bg-white/[0.02] flex flex-col justify-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cathedral-400 mb-2">自动化层 / AUTOMATION</h4>
                  <p className="text-[11px] text-muted-foreground uppercase leading-relaxed">
                    手续费直接路由至项目钱包，或通过分发合约自动执行次级依赖项目的代币回购与销毁。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: AI */}
          <section id="ai-analysis" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <Cpu className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x04_智能分析层</h2>
            </div>
            <div className="p-8 terminal-card border-cathedral-500/30 relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-bold italic tracking-tight font-black uppercase italic">神经网络项目评估</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Cathedral 集成了基于 LLM 的 GitHub 仓库行为分析。我们的 AI 评估提交历史、技术栈健康度、社区情绪和开发动能，提供实时的投资参考评分。
                </p>
                <div className="flex flex-wrap gap-4">
                  {['代码密度', '情绪脉搏', '技术栈现代性', '影响力评分'].map((tag) => (
                    <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-cathedral-500/10 text-cathedral-400 border border-cathedral-500/20 rounded-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cathedral-500/5 -mr-32 -mt-32" />
            </div>
          </section>

          {/* Section: 对比 */}
          <section id="comparison" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-cathedral-500 pb-2">
              <BarChart3 className="w-6 h-6 text-cathedral-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">0x05_市场定位策略</h2>
            </div>
            <div className="terminal-card overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="px-6 py-4 font-black">核心参数</th>
                    <th className="px-6 py-4 font-black">传统发行平台</th>
                    <th className="px-6 py-4 font-black text-cathedral-400">CATHEDRAL 协议</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] uppercase font-bold tracking-tight">
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">验证机制</td>
                    <td className="px-6 py-4">非正式 / 自声明</td>
                    <td className="px-6 py-4 text-emerald-500">GITHUB_权限校验</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">价值驱动</td>
                    <td className="px-6 py-4">MEME / 投机</td>
                    <td className="px-6 py-4 text-emerald-500">项目实用价值</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">治理模式</td>
                    <td className="px-6 py-4">无 / 中心化</td>
                    <td className="px-6 py-4 text-emerald-500">自动联合曲线</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">收益矢量</td>
                    <td className="px-6 py-4">退出流动性</td>
                    <td className="px-6 py-4 text-emerald-500">维护者持续资助</td>
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
