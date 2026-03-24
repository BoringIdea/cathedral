"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProvider } from "@/components/solana-provider";
import {
  constructBuyInstruction,
  constructSellInstruction,
  getPrice,
  getTokenBalance,
  getSellPriceAfterFee,
  getBuyPriceAfterFee,
  getTokenInfo,
  formatNumber,
  formatShares,
  formatPrice,
  cn
} from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import FeeDistribution from "@/components/fee-distribution";
import SmartTradingChart from "@/components/smart-trading-chart";
import AdvancedTradingChart from "@/components/advanced-trading-chart";
import Holders from "@/components/holders";
import {
  Star,
  GitFork,
  TrendingUp,
  Wallet,
  DollarSign,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Clock,
  Activity,
  Github,
  Copy,
  Check,
  MessageCircle,
  Bot,
  AlertCircle,
  ArrowUpRight, // Added from diff
  Share2 // Added from diff
} from "lucide-react";
import { apiGet } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { AIChatWindow } from '@/components/ai-chat/ai-chat-window';
import { useTranslation } from '@/lib/i18n-context'; // Added from diff

async function fetchPoolOverview(pool: string) {
  try {
    const response: ApiResponse<any> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/pools/${pool}/overview`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pool overview:', error);
    return null;
  }
}

async function fetchOrders(pool: string) {
  try {
    const response: ApiResponse<any[]> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/pools/${pool}/orders`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

async function fetchRepository(id: string) {
  try {
    const response: ApiResponse<any> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/${id}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch repository:', error);
    return null;
  }
}

const MOCK_REPOSITORY = {
  owner: "cathedral",
  name: "cathedral-monorepo",
  stars: 1250,
  forks: 340,
  language: "TypeScript",
  lastCommit: "2 hours ago",
  healthScore: 98,
};

async function fetchPool(id: string): Promise<PoolInfo | null> {
  try {
    const response: ApiResponse<PoolInfo> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/${id}/pool`
    );
    return response.data || null;
  } catch (error) {
    console.error('Failed to fetch pool:', error);
    return null;
  }
}

interface PoolInfo {
  pool: string;
  tokenMint: string;
  creator: string;
  poolTokenAccount: string;
  poolSolVault: string;
  poolSolFeeVault: string;
  description: string;
}


export default function Repository({ params }: { params: { id: string } }) {
  const { id } = params;
  const provider = useAnchorProvider();
  const { connection } = useConnection();
  const { connected, wallet, publicKey, sendTransaction } = useWallet();
  const { t, language } = useTranslation(); // Added from diff
  const locale = language === 'zh' ? zhCN : enUS;

  const [price, setPrice] = useState(0);
  const [isBuying, setIsBuying] = useState<boolean>(true);
  const [amount, setAmount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenInfo, setTokenInfo] = useState<{ symbol: string; name: string } | null>(null);
  const [transactionComplete, setTransactionComplete] = useState<boolean>(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [repository, setRepository] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'grant' | 'trades' | 'overview' | 'ai-chat'>('trades');
  const [poolOverview, setPoolOverview] = useState<any | null>(null);
  const [isMobileTradingExpanded, setIsMobileTradingExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<'pool' | 'creator' | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Copy pool address
  const handleCopyPoolAddress = async () => {
    if (poolInfo?.pool) {
      try {
        await navigator.clipboard.writeText(poolInfo.pool);
        setCopiedAddress('pool');
        setTimeout(() => setCopiedAddress(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Copy creator address
  const handleCopyCreatorAddress = async () => {
    if (poolInfo?.creator) {
      try {
        await navigator.clipboard.writeText(poolInfo.creator);
        setCopiedAddress('creator');
        setTimeout(() => setCopiedAddress(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Fetch repository info
  useEffect(() => {
    const fetchRepo = async () => {
      const repo = await fetchRepository(id);
      setRepository(repo);
    };
    fetchRepo();
  }, [id]);

  // Fetch pool info
  useEffect(() => {
    const fetchPoolInfo = async () => {
      const poolInfo = await fetchPool(id);
      setPoolInfo(poolInfo);
    };
    fetchPoolInfo();
  }, [id, transactionComplete]);

  // Fetch pool overview
  useEffect(() => {
    if (!poolInfo) {
      return;
    }
    const fetchPoolOverviewData = async () => {
      const poolOverview = await fetchPoolOverview(poolInfo.pool);
      setPoolOverview(poolOverview);
    };
    fetchPoolOverviewData();
  }, [poolInfo, transactionComplete]);

  // Fetch pool orders
  useEffect(() => {
    const fetchOrdersInfo = async () => {
      if (!poolInfo) {
        return;
      }
      const orders = await fetchOrders(poolInfo.pool);
      setOrders(orders);
    };
    fetchOrdersInfo();
  }, [poolInfo, transactionComplete]);

  // Fetch solana balance
  useEffect(() => {
    if (!publicKey) {
      return;
    }
    const fetchSolBalance = async () => {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    };
    fetchSolBalance();
  }, [publicKey, connection, transactionComplete]);

  // Update estimated price
  useEffect(() => {
    const updateEstimatedPrice = async () => {
      if (!poolInfo) {
        return;
      }
      if (isBuying) {
        setEstimatedPrice(await getBuyPriceAfterFee(provider, new PublicKey(poolInfo.pool), amount * LAMPORTS_PER_SOL));
      } else {
        setEstimatedPrice(await getSellPriceAfterFee(provider, new PublicKey(poolInfo.pool), amount * LAMPORTS_PER_SOL));
      }
    };
    updateEstimatedPrice();
    setTransactionComplete(false);
  }, [isBuying, provider, amount, poolInfo, transactionComplete]);

  // Fetch token price
  useEffect(() => {
    const fetchPrice = async () => {
      if (!poolInfo) {
        return;
      }
      const price = await getPrice(provider, new PublicKey(poolInfo.pool));
      setPrice(price);
    };

    // Initial fetch
    fetchPrice();
    setTransactionComplete(false);

    // Set up auto-refresh every 1 second
    const intervalId = setInterval(() => {
      fetchPrice();
    }, 1000);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [provider, transactionComplete, poolInfo]);

  // Fetch token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!poolInfo) {
        return;
      }
      try {
        const mint = new PublicKey(poolInfo.tokenMint);
        const info = await getTokenInfo(connection, mint);
        setTokenInfo({
          symbol: info.symbol,
          name: info.name
        });
      } catch (error) {
        console.error('Error fetching token info:', error);
        setTokenInfo({
          symbol: 'UNKNOWN',
          name: 'Unknown Token'
        });
      }
    };
    fetchTokenInfo();
  }, [poolInfo, connection]);

  // Fetch user token balance 
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !poolInfo) {
        return;
      }

      const mint = new PublicKey(poolInfo.tokenMint);
      const balance = await getTokenBalance(connection, mint, publicKey);
      setBalance(balance);
    };
    fetchBalance();
  }, [publicKey, connection, poolInfo, transactionComplete]);

  // Handle quick amount
  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  // Handle buy
  const handleBuy = async () => {
    if (!publicKey || !wallet || !connected) {
      return;
    }
    if (!poolInfo) {
      return;
    }

    setIsBuying(true);
    const lamportsAmount = amount * LAMPORTS_PER_SOL;
    console.log('buy amount', lamportsAmount);
    try {
      setIsLoading(true);
      const mint = new PublicKey(poolInfo.tokenMint);
      const pool = new PublicKey(poolInfo.pool);
      const poolTokenAccount = new PublicKey(poolInfo.poolTokenAccount);
      const poolSolVault = new PublicKey(poolInfo.poolSolVault);
      const poolSolFeeVault = new PublicKey(poolInfo.poolSolFeeVault);
      const poolCreator = new PublicKey(poolInfo.creator);

      const transaction = await constructBuyInstruction(
        connection,
        provider,
        publicKey,
        mint,
        pool,
        poolTokenAccount,
        poolSolVault,
        poolSolFeeVault,
        poolCreator,
        lamportsAmount
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const messageLegacy = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: transaction.instructions,
      }).compileToV0Message();

      const newtransaction = new VersionedTransaction(messageLegacy);

      const signature = await sendTransaction(newtransaction, connection);

      alert(language === 'zh'
        ? `🚀交易已发送，买入数量：${amount} 份额`
        : `🚀Send transaction success, buy amount: ${amount} Shares`);
      setTransactionComplete(true);
    } catch (error) {
      console.error(error);
      alert('Buy failed, ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!publicKey || !wallet || !connected) {
      return;
    }
    if (!poolInfo) {
      return;
    }

    setIsBuying(false);
    const lamportsAmount = amount * LAMPORTS_PER_SOL;
    console.log('sell amount', lamportsAmount);

    try {
      setIsLoading(true);
      const mint = new PublicKey(poolInfo.tokenMint);
      const pool = new PublicKey(poolInfo.pool);
      const poolTokenAccount = new PublicKey(poolInfo.poolTokenAccount);
      const poolSolVault = new PublicKey(poolInfo.poolSolVault);
      const poolSolFeeVault = new PublicKey(poolInfo.poolSolFeeVault);
      const poolCreator = new PublicKey(poolInfo.creator);

      const transaction = await constructSellInstruction(
        connection,
        provider,
        publicKey,
        mint,
        pool,
        poolTokenAccount,
        poolSolVault,
        poolSolFeeVault,
        poolCreator,
        lamportsAmount
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const messageLegacy = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: transaction.instructions,
      }).compileToV0Message();

      const newtransaction = new VersionedTransaction(messageLegacy);

      const signature = await sendTransaction(newtransaction, connection);

      alert(language === 'zh'
        ? `🚀交易已发送，卖出数量：${amount} 份额`
        : `🚀Send transaction success, sell amount: ${amount} Shares`);
      setTransactionComplete(true);
    } catch (error) {
      console.error(error);
      alert('Sell failed, ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAmount = () => {
    setAmount(0);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#0d0d0d] text-foreground font-mono leading-tight">
      <Header />

      <main className="relative flex flex-1">
        {/* Middle Column: Repository Info, Chart & Tabs */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Enhanced Header: Project Identity & Metadata */}
          <div className="border-b border-border bg-[color:var(--bg-surface)] px-6 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="border border-border bg-[color:var(--bg-page)] p-3">
                    <TrendingUp className="h-7 w-7 text-[color:var(--fg-strong)]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-[28px] font-semibold uppercase tracking-tight text-[color:var(--fg-strong)]">
                        {repository?.owner}/{repository?.name}
                      </h1>
                      <span className="shrink-0 border border-border bg-[color:var(--bg-page)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--fg-strong)]">
                        {tokenInfo?.symbol || '...'}
                      </span>
                      {repository?.isFork && (
                        <span className="flex items-center gap-1 border border-border bg-[color:var(--bg-page)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
                          <GitFork size={10} />
                          Fork
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {poolInfo?.description || repository?.description || (language === 'zh' ? "初始化公共代码库资助协议..." : "Initializing decentralized repository sponsorship protocol...")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{language === 'zh' ? '仓库方' : 'Owner'}</span>
                    <span className="inline-flex items-center gap-1 border border-border bg-[color:var(--bg-page)] px-2 py-1 text-[color:var(--fg-strong)]">
                      <Github size={10} className="text-[color:var(--fg-strong)]" />
                      {repository?.owner}
                    </span>
                    {repository?.followers ? (
                      <span className="text-[color:var(--fg-muted)]">{formatNumber(repository.followers)} {language === 'zh' ? '关注者' : 'followers'}</span>
                    ) : null}
                  </div>
                  <button className="flex items-center gap-2 transition-colors hover:text-[color:var(--fg-strong)]" onClick={handleCopyPoolAddress}>
                    <span>CA</span>
                    <span className="font-mono text-[color:var(--fg-strong)]">
                      {poolInfo?.pool ? `${poolInfo.pool.slice(0, 8)}...${poolInfo.pool.slice(-8)}` : (language === 'zh' ? "等待发行" : "GENESIS_PENDING")}
                    </span>
                    {copiedAddress === 'pool' ? <Check size={12} className="text-[color:var(--success)]" /> : <Copy size={12} />}
                  </button>
                  <button className="flex items-center gap-2 transition-colors hover:text-[color:var(--fg-strong)]" onClick={handleCopyCreatorAddress}>
                    <span>{language === 'zh' ? '创建者' : 'Creator'}</span>
                    <span className="font-mono text-[color:var(--fg-strong)]">
                      {poolInfo?.creator ? `${poolInfo.creator.slice(0, 8)}...${poolInfo.creator.slice(-8)}` : (language === 'zh' ? "匿名" : "ANONYMOUS")}
                    </span>
                    {copiedAddress === 'creator' ? <Check size={12} className="text-[color:var(--success)]" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 items-start">
                <a
                  href={`https://github.com/${repository?.owner}/${repository?.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 border border-border bg-[color:var(--bg-page)] px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-strong)] transition-colors hover:bg-[color:var(--bg-muted)]"
                >
                  <Github size={13} />
                  {language === 'zh' ? '查看 GitHub' : 'View on GitHub'}
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border/20 sm:grid-cols-4">
              {[
                { label: t('repository.stats.stars'), value: formatNumber(repository?.stars || 0), icon: Star, color: 'text-[color:var(--fg-strong)]' },
                { label: t('repository.stats.forks'), value: formatNumber(repository?.forks || 0), icon: GitFork, color: 'text-[color:var(--fg-strong)]' },
                { label: t('repository.stats.market_cap'), value: formatNumber((poolOverview?.totalSupply || 0) * price), unit: 'SOL', icon: DollarSign, color: 'text-[color:var(--success)]' },
                { label: t('repository.stats.price'), value: formatPrice(price), unit: 'SOL', icon: TrendingUp, color: 'text-[color:var(--fg-strong)]' },
              ].map((m, i) => (
                <div key={i} className="bg-[color:var(--bg-page)] px-4 py-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <m.icon size={10} className={m.color} />
                    {m.label}
                  </div>
                  <div className="text-[28px] font-semibold leading-none tracking-tight text-[color:var(--fg-strong)]">
                    {m.value}
                    {m.unit && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">{m.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Area: Fixed height to prevent stretching */}
          <div className="flex-shrink-0 border-b border-border bg-[color:var(--bg-page)] px-4 py-4">
            {poolInfo && tokenInfo ? (
              <AdvancedTradingChart
                poolAddress={poolInfo.pool}
                tokenSymbol={tokenInfo.symbol}
                marketCap={price * (poolOverview?.totalSupply ?? 0)}
                theme="dark"
                height={520}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground uppercase text-xs tracking-widest">
                {language === 'zh' ? '正在加载价格数据...' : 'Loading price data...'}
              </div>
            )}
          </div>

          {/* Bottom Tabs Area: Flex-1 fills the remaining gap */}
          <div className="flex flex-col bg-[color:var(--bg-surface)]">
            <div className="relative z-10 flex bg-[color:var(--bg-surface)] px-4 border-b border-border">
              {[
                { key: 'trades', label: t('repository.tabs.trades') },
                { key: 'grant', label: t('repository.tabs.grant') },
                { key: 'overview', label: t('repository.tabs.overview') },
                { key: 'ai-chat', label: t('repository.tabs.ai_chat') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    "px-4 py-3 text-[10px] uppercase font-bold tracking-widest transition-colors border-b",
                    activeTab === tab.key ? "border-[color:var(--fg-strong)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {activeTab === 'trades' && (
                <table className="w-full text-left text-[11px] border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-muted-foreground uppercase text-[9px] tracking-widest">
                      <th className="pb-2">{t('repository.trades_table.trader')}</th>
                      <th className="pb-2">{t('repository.trades_table.type')}</th>
                      <th className="pb-2 text-right">{t('repository.trades_table.price')} (SOL)</th>
                      <th className="pb-2 text-right">{t('repository.trades_table.amount')}</th>
                      <th className="pb-2 text-right">{t('repository.trades_table.total')} (SOL)</th>
                      <th className="pb-2 text-right">{t('repository.trades_table.time')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[color:var(--bg-muted)] transition-colors group">
                        <td className="py-1 font-mono text-muted-foreground">
                          {order.user ? `${order.user.slice(0, 4)}...${order.user.slice(-4)}` : (language === 'zh' ? "未知" : "unknown")}
                        </td>
                        <td className={cn("py-1 font-bold", order.side === 'buy' ? "text-[color:var(--success)]" : "text-[color:var(--danger)]")}>
                          {language === 'zh'
                            ? order.side === 'buy' ? '买入' : '卖出'
                            : order.side.toUpperCase()}
                        </td>
                        <td className="py-1 text-right font-mono">{(order.price / LAMPORTS_PER_SOL).toFixed(6)}</td>
                        <td className="py-1 text-right font-mono">{(order.amount / LAMPORTS_PER_SOL).toFixed(4)}</td>
                        <td className="py-1 text-right font-mono">{(order.price * order.amount / (LAMPORTS_PER_SOL * LAMPORTS_PER_SOL)).toFixed(4)}</td>
                        <td className="py-1 text-right text-muted-foreground text-[10px]">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'grant' && poolInfo && (
                <div className="space-y-6">
                  <div className="mb-4 border border-border bg-[color:var(--bg-muted)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-[color:var(--fg-strong)]" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--fg-strong)]">{t('repository.grant_panel.funding_mechanics_title')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('repository.grant_panel.funding_mechanics_description_part1')}
                      <span className="mx-1 text-foreground">2%</span> {t('repository.grant_panel.funding_mechanics_description_part2')}
                      <span className="mx-1 text-foreground">5%</span> {t('repository.grant_panel.funding_mechanics_description_part3')}
                    </p>
                  </div>
                  <FeeDistribution
                    poolAddress={poolInfo.pool}
                    tokenMint={poolInfo.tokenMint}
                    isCreator={publicKey && poolInfo.creator ? publicKey.equals(new PublicKey(poolInfo.creator)) : false}
                  />
                </div>
              )}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/20 border border-border/20">
                    {[
                      { label: t('repository.overview_stats.total_supply'), value: formatNumber(poolOverview?.totalSupply || 0), unit: 'SHARES' },
                      { label: t('repository.overview_stats.sol_reserve'), value: formatNumber(poolOverview?.solReserve || 0), unit: 'SOL' },
                      { label: t('repository.overview_stats.total_volume'), value: formatNumber(poolOverview?.totalVolume || 0), unit: 'SOL' },
                      { label: t('repository.overview_stats.market_cap'), value: formatNumber((poolOverview?.totalSupply || 0) * price), unit: 'SOL' },
                    ].map((m, i) => (
                      <div key={i} className="bg-[color:var(--bg-page)] p-4">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">{m.label}</div>
                        <div className="text-xl font-semibold  tracking-tighter text-foreground leading-none">
                          {m.value}
                          <span className="text-[9px] ml-1.5 opacity-40 font-bold">{m.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1">{t('repository.overview_sections.technical_stack')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {repository?.language && (
                          <span className="border border-border bg-[color:var(--bg-muted)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--fg-strong)]">
                            {repository.language.toUpperCase()}
                          </span>
                        )}
                        <span className="border border-border/40 bg-[color:var(--bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          Git-Core
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1">{t('repository.overview_sections.activity_index')}</h4>
                      <div className="flex items-center gap-4 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Star size={10} className="text-[color:var(--fg-strong)]" />
                          <span className="font-bold">{repository?.stargazersCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GitFork size={10} className="text-[color:var(--fg-strong)]" />
                          <span className="font-bold">{repository?.forksCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity size={10} className="text-[color:var(--success)]" />
                          <span className="text-muted-foreground">{language === 'zh' ? '活跃' : 'ACTIVE'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'ai-chat' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center bg-[color:var(--bg-muted)]">
                    <Bot className="w-6 h-6 text-[color:var(--fg-strong)]" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">{t('repository.ai_chat.analysis_ready')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('repository.ai_chat.analysis_description', { repoName: repository?.name })}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAIChatOpen(true)}
                    className="bg-primary text-primary-foreground hover:opacity-90 text-[10px] uppercase font-semibold tracking-[0.18em]"
                  >
                    {t('repository.ai_chat.launch_analyst')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Panel */}
        <div className="flex w-full flex-col border-l border-border bg-[color:var(--bg-page)] lg:w-[320px] xl:w-[360px]">
          <div className="flex items-center justify-between border-b border-border bg-[color:var(--bg-surface)] px-4 py-3">
            <div className="space-y-1">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t('repository.trade_panel.execution')}</span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-[color:var(--fg-strong)]">
                {isBuying ? t('repository.trade_panel.confirm_buy') : t('repository.trade_panel.confirm_sell')}
              </span>
            </div>
            <div className="flex gap-1 border border-border bg-[color:var(--bg-page)] p-1">
              <button
                onClick={() => setIsBuying(true)}
                className={cn("px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors", isBuying ? "bg-[color:var(--fg-strong)] text-[color:var(--bg-page)]" : "text-muted-foreground hover:text-[color:var(--fg-strong)]")}
              >
                {t('repository.trade_panel.buy')}
              </button>
              <button
                onClick={() => setIsBuying(false)}
                className={cn("px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors", !isBuying ? "bg-[color:var(--fg-strong)] text-[color:var(--bg-page)]" : "text-muted-foreground hover:text-[color:var(--fg-strong)]")}
              >
                {t('repository.trade_panel.sell')}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8 p-4">
            <div className="space-y-4 border border-border bg-[color:var(--bg-surface)] p-4">
              <div className="flex items-end justify-between gap-3">
                <label className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('repository.trade_panel.amount')}</label>
                <span className="border border-border bg-[color:var(--bg-page)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-strong)]">
                  {isBuying ? t('repository.trade_panel.sponsoring') : t('repository.trade_panel.liquidating')}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="h-16 border-border bg-[color:var(--bg-page)] text-center font-mono text-[32px] tracking-tight text-[color:var(--fg-strong)] focus:ring-1 focus:ring-ring"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {language === 'zh' ? '份额' : 'Shares'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.1, 0.5, 1, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickAmount(val)}
                    className="border border-border bg-[color:var(--bg-page)] py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--fg-strong)] transition-colors hover:bg-[color:var(--bg-muted)]"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 border border-border bg-[color:var(--bg-surface)] p-4">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="text-muted-foreground">{t('repository.trade_panel.balance')}</span>
                <span className="font-mono text-[color:var(--fg-strong)]">
                  {isBuying
                    ? solBalance.toFixed(4) + ' SOL'
                    : balance.toFixed(4) + ` ${language === 'zh' ? '份额' : 'Shares'}`}
                </span>
              </div>
              <div className="h-px border-t border-border" />
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em]">
                <span className="text-muted-foreground">{isBuying ? t('repository.trade_panel.estimated_cost') : t('repository.trade_panel.estimated_return')}</span>
                <span className="font-mono text-[20px] tracking-tight text-[color:var(--fg-strong)]">
                  {estimatedPrice && Number(estimatedPrice) !== 0
                    ? Number(estimatedPrice).toFixed(6) + ' SOL'
                    : '0.00'}
                </span>
              </div>
            </div>

            <Button
              onClick={isBuying ? handleBuy : handleSell}
              disabled={isLoading || amount <= 0}
              className={cn(
                "h-14 w-full text-sm font-semibold uppercase tracking-[0.24em] transition-colors",
                isLoading || amount <= 0
                  ? "border border-border bg-[color:var(--bg-muted)] text-[color:var(--fg-muted)]"
                  : "bg-[color:var(--fg-strong)] text-[color:var(--bg-page)] hover:opacity-92"
              )}
            >
              {isLoading ? t('repository.trade_panel.executing') : (isBuying ? t('repository.trade_panel.confirm_buy') : t('repository.trade_panel.confirm_sell'))}
            </Button>

            {/* User Portfolio in this Token */}
            <div className="border-t border-border pt-4">
              <div className="mb-3 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Wallet className="w-3 h-3 text-[color:var(--fg-strong)]" />
                {t('repository.trade_panel.your_position')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-border bg-[color:var(--bg-surface)] p-3">
                  <div className="mb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('repository.trade_panel.holdings')}</div>
                  <div className="text-[26px] font-semibold leading-none tracking-tight text-[color:var(--fg-strong)]">{balance.toFixed(4)}</div>
                </div>
                <div className="border border-border bg-[color:var(--bg-surface)] p-3">
                  <div className="mb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('repository.trade_panel.value')} (SOL)</div>
                  <div className="text-[26px] font-semibold leading-none tracking-tight text-[color:var(--fg-strong)]">{(balance * price).toFixed(4)}</div>
                </div>
              </div>
            </div>

            {/* Holders List */}
            {poolInfo && (
              <div className="border-t border-border pt-4">
                <Holders poolAddress={poolInfo.pool} limit={5} />
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Global Overlays */}
      <AIChatWindow
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        repositoryId={Number(id)}
        repositoryName={`${repository?.owner}/${repository?.name}`}
      />

      {/* Mobile Trading Overlay */}
      {isMobileTradingExpanded && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[color:rgba(17,17,17,0.92)] backdrop-blur-md flex flex-col pt-12 overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="mb-8 flex items-center justify-between px-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">{t('repository.trade_panel.execution')}</span>
            <button onClick={() => setIsMobileTradingExpanded(false)} className="text-muted-foreground hover:text-foreground uppercase text-[10px] tracking-widest">{language === 'zh' ? '关闭 [X]' : 'Close [X]'}</button>
          </div>
          <div className="flex-1 px-4 space-y-8">
            <div className="p-6 cathedral-panel space-y-4">
              <div className="flex gap-1 border border-border bg-[color:var(--bg-page)] p-1 h-12">
                <button onClick={() => setIsBuying(true)} className={cn("flex-1 text-[10px] font-semibold uppercase tracking-widest transition-colors", isBuying ? "bg-[color:var(--fg-strong)] text-[color:var(--bg-page)]" : "text-muted-foreground")}>{t('repository.trade_panel.buy')}</button>
                <button onClick={() => setIsBuying(false)} className={cn("flex-1 text-[10px] font-semibold uppercase tracking-widest transition-colors", !isBuying ? "bg-[color:var(--fg-strong)] text-[color:var(--bg-page)]" : "text-muted-foreground")}>{t('repository.trade_panel.sell')}</button>
              </div>
              <div className="relative">
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="bg-[color:var(--bg-page)] h-16 text-2xl font-mono border border-border pr-16" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {language === 'zh' ? '份额' : 'Shares'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.1, 0.5, 1, 5].map(v => <button key={v} onClick={() => handleQuickAmount(v)} className="border border-border py-3 bg-[color:var(--bg-page)] text-[10px] font-semibold">{v}</button>)}
              </div>
            </div>
            <Button
              onClick={isBuying ? handleBuy : handleSell}
              disabled={isLoading || amount <= 0}
              className={cn(
                "w-full h-20 text-lg font-semibold uppercase tracking-[0.3em]",
                isLoading || amount <= 0
                  ? "border border-border bg-[color:var(--bg-muted)] text-[color:var(--fg-muted)]"
                  : "bg-[color:var(--fg-strong)] text-[color:var(--bg-page)] hover:opacity-90"
              )}
            >
              {isLoading ? t('repository.trade_panel.executing') : (isBuying ? t('repository.trade_panel.confirm_buy') : t('repository.trade_panel.confirm_sell'))}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: string | number | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
