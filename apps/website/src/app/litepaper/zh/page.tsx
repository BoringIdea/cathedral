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
    <div className="cathedral-shell min-h-full text-foreground pb-20">
      <Header />

      {/* 技术头部 */}
      <div className="border-b border-border bg-[color:var(--bg-muted)]">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 cathedral-kicker text-[10px] text-[color:var(--fg-strong)]">
                <span className="flex items-center gap-1.5 border border-border bg-[color:var(--bg-muted)] px-2 py-0.5">
                  <Terminal className="w-3 h-3" />
                  v0.0.1
                </span>
                <span className="text-muted-foreground font-bold">{"// 文档协议 / DOCUMENTATION_PROTOCOL"}</span>
              </div>
              <h1 className="cathedral-title">
                技术白皮书
              </h1>
              <p className="cathedral-copy max-w-2xl text-[17px]">
                开源价值提取、联合曲线机制与流动性协议的技术架构。
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 bg-[color:var(--bg-surface)] border border-border/50  w-fit">
              <Link
                href="/litepaper"
                className={cn(
                  "px-4 py-2 cathedral-kicker text-[10px] transition-all  flex items-center gap-2",
                  !isZhPath ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="w-3 h-3" />
                EN_US
              </Link>
              <Link
                href="/litepaper/zh"
                className={cn(
                  "px-4 py-2 cathedral-kicker text-[10px] transition-all  flex items-center gap-2",
                  isZhPath ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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
            <div className="cathedral-kicker mb-4 pl-2">目录索引 / INDEX</div>
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
              <span className="cathedral-kicker text-[9px]">协议完整性</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase">
              所有市场操作均受 Solana 网络层上不可篡改的智能合约管理。
            </p>
          </div>
        </aside>

        {/* 内容区域 */}
        <div className="lg:col-span-9 space-y-24 scroll-smooth">

          {/* Section: 愿景 */}
          <section id="vision" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Zap className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x01_愿景架构</h2>
            </div>
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
              <p className="first-letter:text-4xl first-letter:font-semibold first-letter:text-[color:var(--fg-strong)] first-letter:mr-2 first-letter:float-left">
                传统开源资助模式的困境源于多重因素。资金分配的严重不平等使得许多优秀的 GitHub 项目无法获得应有的支持。Cathedral 将资助重新想象为一种市场驱动的价值捕获机制。
              </p>
              <p>
                通过代币化仓库，我们将代码从被动的公共产品转变为主动的可交易资产。这为开源生态系统创造了一个可量化的价值层，允许开发者捕获其创新带来的经济增长。
              </p>
            </div>
          </section>

          {/* Section: 联合曲线 */}
          <section id="bonding-curve" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Activity className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x02_联合曲线动力学</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cathedral 采用离散联合曲线算法来管理项目份额（Shares）的流动性和定价。随着供应量增加，价格遵循确定的数学函数，确保了具备滑点感知能力的进场与退出。
                </p>
                <div className="terminal-card p-4 bg-[color:var(--bg-surface)] border-border/40">
                  <div className="cathedral-kicker text-[9px] text-[color:var(--fg-strong)] mb-3 flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    流动性协议 / LIQUIDITY_PROTOCOL
                  </div>
                  <ul className="space-y-2 text-[10px] text-muted-foreground uppercase font-bold">
                    <li className="flex justify-between border-b border-border/40 pb-1"><span>目标储备</span> <span className="text-[color:var(--fg-strong)]">85.00 SOL</span></li>
                    <li className="flex justify-between border-b border-border/40 pb-1"><span>手续费捕获</span> <span className="text-[color:var(--fg-strong)]">7.00%</span></li>
                    <li className="flex justify-between"><span>铸造上限</span> <span className="text-[color:var(--fg-strong)]">10亿 SHARES</span></li>
                  </ul>
                </div>
              </div>
              <div className="terminal-card overflow-hidden bg-[color:var(--bg-surface)] aspect-video flex items-center justify-center relative group">
                <div className="absolute inset-0 opacity-50" />
                <Activity className="w-16 h-16 text-[color:var(--fg-muted)]/40 group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute bottom-4 left-4 text-[9px] text-muted-foreground uppercase opacity-40 font-semibold tracking-widest animate-pulse">扫描市场频率 / SCANNING_MARKET_PULSE...</span>
              </div>
            </div>
          </section>

          {/* Section: 手续费 */}
          <section id="fees" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Network className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x03_手续费分发协议</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                本协议采用全自动的手续费分配模型，旨在激励开源项目的持续开发与贡献。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="terminal-card p-6 border-border/40 bg-[color:var(--bg-surface)]">
                  <h4 className="text-sm font-semibold uppercase tracking-widest mb-4 text-[color:var(--fg-strong)]">主网默认逻辑 / MAINNET_LOGIC</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">维护者资助 (Maintainer)</span>
                      <span className="text-[color:var(--fg-strong)] text-lg  tracking-tight font-semibold">5.0%</span>
                    </div>
                    <div className="h-1 bg-[color:var(--bg-muted)] overflow-hidden">
                      <div className="h-full bg-primary w-[70%]" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">生态系统费 (Ecosystem)</span>
                      <span className="text-[color:var(--fg-strong)] text-lg  tracking-tight font-semibold">2.0%</span>
                    </div>
                    <div className="h-1 bg-[color:var(--bg-muted)] overflow-hidden">
                      <div className="h-full bg-[color:var(--fg-muted)] w-[30%]" />
                    </div>
                  </div>
                </div>

                <div className="terminal-card p-6 border-border/40 bg-[color:var(--bg-surface)] flex flex-col justify-center">
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-strong)] mb-2">自动化层 / AUTOMATION</h4>
                  <p className="text-[11px] text-muted-foreground uppercase leading-relaxed">
                    手续费直接路由至项目钱包，或通过分发合约自动执行次级依赖项目的代币回购与销毁。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: AI */}
          <section id="ai-analysis" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <Cpu className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x04_智能分析层</h2>
            </div>
            <div className="p-8 terminal-card border-border relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <h3 className="cathedral-h2 text-[26px]">神经网络项目评估</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Cathedral 集成了基于 LLM 的 GitHub 仓库行为分析。我们的 AI 评估提交历史、技术栈健康度、社区情绪和开发动能，提供实时的投资参考评分。
                </p>
                <div className="flex flex-wrap gap-4">
                  {['代码密度', '情绪脉搏', '技术栈现代性', '影响力评分'].map((tag) => (
                    <span key={tag} className="cathedral-kicker border border-border bg-[color:var(--bg-muted)] px-2 py-1 text-[9px] text-[color:var(--fg-strong)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-32 -mt-32 h-64 w-64 bg-[color:var(--bg-muted)]" />
            </div>
          </section>

          {/* Section: 对比 */}
          <section id="comparison" className="space-y-8">
            <div className="inline-flex items-center gap-3 border-b-2 border-[color:var(--fg-strong)] pb-2">
              <BarChart3 className="w-6 h-6 text-[color:var(--fg-strong)]" />
              <h2 className="cathedral-h2">0x05_市场定位策略</h2>
            </div>
            <div className="terminal-card overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="bg-[color:var(--bg-muted)] text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="px-6 py-4 font-semibold">核心参数</th>
                    <th className="px-6 py-4 font-semibold">传统发行平台</th>
                    <th className="px-6 py-4 font-semibold text-[color:var(--fg-strong)]">CATHEDRAL 协议</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] uppercase font-semibold tracking-tight">
                  <tr className="border-b border-border/40 hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">验证机制</td>
                    <td className="px-6 py-4">非正式 / 自声明</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">GITHUB_权限校验</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">价值驱动</td>
                    <td className="px-6 py-4">MEME / 投机</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">项目实用价值</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">治理模式</td>
                    <td className="px-6 py-4">无 / 中心化</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">自动联合曲线</td>
                  </tr>
                  <tr className="hover:bg-[color:var(--bg-surface)]">
                    <td className="px-6 py-4 text-muted-foreground">收益矢量</td>
                    <td className="px-6 py-4">退出流动性</td>
                    <td className="px-6 py-4 text-[color:var(--fg-strong)]">维护者持续资助</td>
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
