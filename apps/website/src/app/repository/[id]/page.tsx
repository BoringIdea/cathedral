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

      alert('🚀Send transaction success, buy amount: ' + amount + ' Shares');
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

      alert('🚀Send transaction success, sell amount: ' + amount + ' Shares');
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

      <main className="flex-1 flex relative">
        {/* Middle Column: Repository Info, Chart & Tabs */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Enhanced Header: Project Identity & Metadata */}
          <div className="px-6 py-6 border-b border-border bg-secondary/5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cathedral-500/10 rounded-sm border border-cathedral-500/20">
                  <TrendingUp className="w-8 h-8 text-cathedral-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic line-clamp-1">
                      {repository?.owner}/{repository?.name}
                    </h1>
                    <span className="bg-cathedral-500/10 text-cathedral-400 border border-cathedral-500/20 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                      {tokenInfo?.symbol || '...'}
                    </span>
                    {repository?.isFork && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-widest">
                        <GitFork size={10} />
                        Fork
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-medium max-w-2xl line-clamp-2 uppercase tracking-tight">
                    {poolInfo?.description || repository?.description || "Initializing decentralized repository sponsorship protocol..."}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span>by</span>
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-secondary/30 rounded border border-border/50 text-foreground">
                      <Github size={10} className="text-cathedral-400" />
                      {repository?.owner}
                    </div>
                    {repository?.followers && (
                      <>
                        <span className="opacity-30">•</span>
                        <span>{formatNumber(repository.followers)} followers</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://github.com/${repository?.owner}/${repository?.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-gray-200 transition-all"
                >
                  <Github size={14} />
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Trust Bar: Addresses & Stats */}
            <div className="pt-2 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleCopyPoolAddress}>
                  <span className="text-muted-foreground/60">CA:</span>
                  <span className="font-mono text-foreground hover:text-cathedral-400 transition-colors">
                    {poolInfo?.pool ? `${poolInfo.pool.slice(0, 8)}...${poolInfo.pool.slice(-8)}` : "GENESIS_PENDING"}
                  </span>
                  {copiedAddress === 'pool' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-muted-foreground/40 group-hover:text-foreground" />}
                </div>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleCopyCreatorAddress}>
                  <span className="text-muted-foreground/60">Creator:</span>
                  <span className="font-mono text-foreground hover:text-cathedral-400 transition-colors">
                    {poolInfo?.creator ? `${poolInfo.creator.slice(0, 8)}...${poolInfo.creator.slice(-8)}` : "ANONYMOUS"}
                  </span>
                  {copiedAddress === 'creator' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-muted-foreground/40 group-hover:text-foreground" />}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/20 border border-border/20">
                {[
                  { label: t('repository.stats.stars'), value: formatNumber(repository?.stars || 0), icon: Star, color: 'text-yellow-500' },
                  { label: t('repository.stats.forks'), value: formatNumber(repository?.forks || 0), icon: GitFork, color: 'text-blue-500' },
                  { label: t('repository.stats.market_cap'), value: formatNumber((poolOverview?.totalSupply || 0) * price), unit: 'SOL', icon: DollarSign, color: 'text-emerald-500' },
                  { label: t('repository.stats.price'), value: formatPrice(price), unit: 'SOL', icon: TrendingUp, color: 'text-cathedral-400' },
                ].map((m, i) => (
                  <div key={i} className="bg-background/40 p-3 space-y-1 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                      <m.icon size={10} className={m.color} />
                      {m.label}
                    </div>
                    <div className="text-base font-black italic tracking-tighter text-foreground leading-none">
                      {m.value}
                      {m.unit && <span className="text-[8px] ml-1 opacity-40 not-italic font-bold">{m.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Area: Fixed height to prevent stretching */}
          <div className="h-[500px] border-b border-border bg-background flex-shrink-0">
            {poolInfo && tokenInfo ? (
              <AdvancedTradingChart
                poolAddress={poolInfo.pool}
                tokenSymbol={tokenInfo.symbol}
                marketCap={price * (poolOverview?.totalSupply ?? 0)}
                theme="dark"
                height={500}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground uppercase text-xs tracking-widest">
                Loading price data...
              </div>
            )}
          </div>

          {/* Bottom Tabs Area: Flex-1 fills the remaining gap */}
          <div className="flex flex-col bg-card/10">
            <div className="flex bg-secondary/10 px-4 border-b border-border">
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
                    "px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors border-b-2",
                    activeTab === tab.key ? "border-cathedral-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
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
                      <tr key={order.id} className="hover:bg-secondary/10 transition-colors group">
                        <td className="py-1 font-mono text-muted-foreground/80">
                          {order.user ? `${order.user.slice(0, 4)}...${order.user.slice(-4)}` : "unknown"}
                        </td>
                        <td className={cn("py-1 font-bold", order.side === 'buy' ? "text-emerald-500" : "text-rose-500")}>
                          {order.side.toUpperCase()}
                        </td>
                        <td className="py-1 text-right font-mono">{(order.price / LAMPORTS_PER_SOL).toFixed(6)}</td>
                        <td className="py-1 text-right font-mono">{(order.amount / LAMPORTS_PER_SOL).toFixed(4)}</td>
                        <td className="py-1 text-right font-mono">{(order.price * order.amount / (LAMPORTS_PER_SOL * LAMPORTS_PER_SOL)).toFixed(4)}</td>
                        <td className="py-1 text-right text-muted-foreground/60 text-[10px]">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'grant' && poolInfo && (
                <div className="space-y-6">
                  <div className="bg-cathedral-500/5 border border-cathedral-500/20 rounded p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-cathedral-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-cathedral-400">{t('repository.grant_panel.funding_mechanics_title')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('repository.grant_panel.funding_mechanics_description_part1')}
                      <span className="text-foreground mx-1">2%</span> {t('repository.grant_panel.funding_mechanics_description_part2')}
                      <span className="text-foreground mx-1">5%</span> {t('repository.grant_panel.funding_mechanics_description_part3')}
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
                      <div key={i} className="bg-background p-4">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1.5">{m.label}</div>
                        <div className="text-xl font-black italic tracking-tighter text-foreground leading-none">
                          {m.value}
                          <span className="text-[9px] ml-1.5 opacity-40 not-italic font-bold">{m.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1">{t('repository.overview_sections.technical_stack')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {repository?.language && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 rounded-sm">
                            {repository.language.toUpperCase()}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-secondary/30 text-muted-foreground text-[10px] font-bold border border-border/40 rounded-sm uppercase">
                          Git-Core
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1">{t('repository.overview_sections.activity_index')}</h4>
                      <div className="flex items-center gap-4 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Star size={10} className="text-orange-500" />
                          <span className="font-bold">{repository?.stargazersCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GitFork size={10} className="text-blue-500" />
                          <span className="font-bold">{repository?.forksCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity size={10} className="text-emerald-500" />
                          <span className="text-muted-foreground">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'ai-chat' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-12 h-12 bg-cathedral-500/10 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-cathedral-500" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">{t('repository.ai_chat.analysis_ready')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('repository.ai_chat.analysis_description', { repoName: repository?.name })}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAIChatOpen(true)}
                    className="bg-cathedral-600 hover:bg-cathedral-700 text-white text-[10px] uppercase font-black"
                  >
                    {t('repository.ai_chat.launch_analyst')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Panel */}
        <div className="flex flex-col bg-card border-l border-border w-full lg:w-[320px] xl:w-[380px]">
          <div className="p-4 border-b border-border bg-secondary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('repository.trade_panel.execution')}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsBuying(true)}
                className={cn("px-3 py-1 text-[10px] uppercase font-bold rounded-sm transition-all", isBuying ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground")}
              >
                {t('repository.trade_panel.buy')}
              </button>
              <button
                onClick={() => setIsBuying(false)}
                className={cn("px-3 py-1 text-[10px] uppercase font-bold rounded-sm transition-all", !isBuying ? "bg-rose-600 text-white" : "bg-secondary text-muted-foreground")}
              >
                {t('repository.trade_panel.sell')}
              </button>
            </div>
          </div>

          <div className="p-4 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{t('repository.trade_panel.amount')}</label>
                <span className="text-[10px] text-cathedral-400 font-bold uppercase tracking-widest bg-cathedral-500/5 px-1.5 rounded">
                  {isBuying ? t('repository.trade_panel.sponsoring') : t('repository.trade_panel.liquidating')}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="bg-secondary/20 border-border/50 rounded-sm font-mono text-lg h-14 focus:ring-1 focus:ring-emerald-500/30 transition-all text-center"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                  Shares
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.1, 0.5, 1, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickAmount(val)}
                    className="py-1 bg-secondary hover:bg-secondary/80 text-[10px] font-bold rounded-sm border border-border"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-secondary/5 rounded-sm border border-border/30 space-y-4 backdrop-blur-sm">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground/60">{t('repository.trade_panel.balance')}</span>
                <span className="font-mono text-foreground/80">
                  {isBuying
                    ? solBalance.toFixed(4) + ' SOL'
                    : balance.toFixed(4) + ' Shares'}
                </span>
              </div>
              <div className="h-px border-t border-border/50" />
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground/60">{isBuying ? t('repository.trade_panel.estimated_cost') : t('repository.trade_panel.estimated_return')}</span>
                <span className="font-mono text-cathedral-400">
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
                "w-full h-14 rounded-sm text-sm font-black uppercase tracking-widest transition-all",
                isBuying ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
              )}
            >
              {isLoading ? t('repository.trade_panel.executing') : (isBuying ? t('repository.trade_panel.confirm_buy') : t('repository.trade_panel.confirm_sell'))}
            </Button>

            {/* User Portfolio in this Token */}
            <div className="pt-4 border-t border-border/40">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Wallet className="w-3 h-3 text-cathedral-400" />
                {t('repository.trade_panel.your_position')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/10 border border-border/20 p-3 rounded-sm">
                  <div className="text-[8px] text-muted-foreground uppercase mb-1 font-black">{t('repository.trade_panel.holdings')}</div>
                  <div className="text-lg font-black italic tracking-tighter leading-none">{balance.toFixed(4)}</div>
                </div>
                <div className="bg-secondary/10 border border-border/20 p-3 rounded-sm">
                  <div className="text-[8px] text-muted-foreground uppercase mb-1 font-black">{t('repository.trade_panel.value')} (SOL)</div>
                  <div className="text-lg font-black italic tracking-tighter text-cathedral-400 leading-none">{(balance * price).toFixed(4)}</div>
                </div>
              </div>
            </div>

            {/* Holders List */}
            {poolInfo && (
              <div className="pt-4 border-t border-border/40">
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
        <div className="lg:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col pt-12 overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="px-6 flex justify-between items-center mb-8">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Fast Execution</span>
            <button onClick={() => setIsMobileTradingExpanded(false)} className="text-muted-foreground hover:text-white uppercase text-[10px] tracking-widest">Close [X]</button>
          </div>
          <div className="flex-1 px-4 space-y-8">
            <div className="p-6 terminal-card space-y-4">
              <div className="flex gap-1 h-12">
                <button onClick={() => setIsBuying(true)} className={cn("flex-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all", isBuying ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground")}>BUY</button>
                <button onClick={() => setIsBuying(false)} className={cn("flex-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all", !isBuying ? "bg-rose-600 text-white" : "bg-secondary text-muted-foreground")}>SELL</button>
              </div>
              <div className="relative">
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="bg-secondary/20 h-16 text-2xl font-mono border-none pr-16" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                  Shares
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.1, 0.5, 1, 5].map(v => <button key={v} onClick={() => handleQuickAmount(v)} className="py-3 bg-secondary rounded-sm text-[10px] font-bold">{v}</button>)}
              </div>
            </div>
            <Button
              onClick={isBuying ? handleBuy : handleSell}
              className={cn("w-full h-20 text-lg font-black uppercase tracking-[0.3em]", isBuying ? "bg-emerald-600" : "bg-rose-600")}
            >
              Confirm
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