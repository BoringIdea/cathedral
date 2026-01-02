"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { User, Wallet, Package, ArrowUpRight, Github, Hexagon, ShieldCheck, Activity } from "lucide-react";
import Header from "@/components/header";
import { apiGet } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n-context';

async function getDeployedRepositories(jwt: string) {
  try {
    const response: ApiResponse<any[]> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/users/me/deployed`,
      { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' }
    );
    return response.data || [];
  } catch (error: any) {
    if (error.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_name');
    }
    return [];
  }
}

async function getHoldingRepositories(publicKey: string) {
  try {
    const response: ApiResponse<any[]> = await apiGet(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/users/${publicKey}/holdings`);
    return response.data || [];
  } catch (error) {
    return [];
  }
}

export default function UserPage() {
  const { publicKey } = useWallet();
  const [userName, setUserName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deployed' | 'holdings'>('holdings');
  const [jwt, setJwt] = useState<string | null>(null);
  const [deployedRepositories, setDeployedRepositories] = useState<any[]>([]);
  const [holdingRepositories, setHoldingRepositories] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    setUserName(localStorage.getItem('user_name'));
    setJwt(localStorage.getItem('jwt_token'));
  }, []);

  useEffect(() => {
    if (jwt) getDeployedRepositories(jwt).then(setDeployedRepositories);
  }, [jwt]);

  useEffect(() => {
    if (publicKey) getHoldingRepositories(publicKey.toString()).then(setHoldingRepositories);
  }, [publicKey]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] font-mono text-foreground select-none overflow-hidden">
      <Header />

      {/* Top Banner: Profile Header */}
      <div className="shrink-0 border-b border-border bg-secondary/5 h-48 flex items-end p-8 relative overflow-hidden">
        {/* Abstract Background Element */}

        <div className="relative z-10 flex items-center gap-8 w-full">
          <div className="w-24 h-24 bg-background border border-border/40 rounded-sm p-1.5 shrink-0 shadow-2xl">
            <div className="w-full h-full bg-secondary/20 flex items-center justify-center border border-border/20">
              <User size={40} className="text-muted-foreground opacity-30" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">{userName || "Anonymous Agent"}</h1>
              <div className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 border border-emerald-500/20 rounded-full tracking-widest uppercase animate-pulse">
                Verified Node
              </div>
            </div>

            <div className="flex items-center gap-6 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
              <div className="flex items-center gap-2">
                <Github size={12} className="opacity-50" />
                <span>{userName || "--"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet size={12} className="opacity-50 text-blue-400" />
                <span className="font-mono lowercase opacity-60 truncate max-w-[120px]">{publicKey?.toString() || "Unlinked"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={12} className="opacity-50 text-orange-400" />
                <span>Last Sync: Just Now</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 flex flex-col min-h-0 bg-background/40">

        {/* Navigation Tabs */}
        <div className="shrink-0 flex items-center bg-secondary/10 px-8 border-b border-border h-12">
          {[
            { id: 'holdings', label: t('profile.portfolio_assets'), icon: Wallet, count: holdingRepositories.length },
            { id: 'deployed', label: t('profile.deployed_repository'), icon: Package, count: deployedRepositories.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "h-full px-6 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-blue-500 text-foreground bg-blue-500/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <tab.icon size={13} className={activeTab === tab.id ? "text-blue-400" : "opacity-40"} />
              {tab.label}
              <span className="text-[9px] opacity-40 font-bold ml-1">[{tab.count}]</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content List */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-4">

            {activeTab === 'holdings' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <table className="w-full text-left border-separate border-spacing-y-1.5">
                  <thead>
                    <tr className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">
                      <th className="px-4 pb-3">{t('header.repository')}</th>
                      <th className="px-4 pb-3">{t('profile.repository_id')}</th>
                      <th className="px-4 pb-3 text-right">{t('profile.shares_owned')}</th>
                      <th className="px-4 pb-3 text-right">{t('profile.valuation')} (SOL)</th>
                      <th className="px-4 pb-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="space-y-4">
                    {holdingRepositories.length > 0 ? holdingRepositories.map((repo, i) => (
                      <tr key={repo.id} className="group bg-secondary/10 hover:bg-secondary/20 border border-border/40 transition-all rounded-sm overflow-hidden">
                        <td className="px-4 py-4 rounded-l-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center font-black italic text-blue-400">
                              {repo.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[12px] font-black uppercase tracking-tight">{repo.name}</div>
                              <div className="text-[8px] text-muted-foreground uppercase opacity-40 tracking-widest font-bold">SHARES_V1</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-[10px] text-muted-foreground opacity-60">
                          {repo.id}
                        </td>
                        <td className="px-4 py-4 text-right text-lg font-black italic tracking-tighter text-emerald-400 leading-none">
                          {repo.balance}
                        </td>
                        <td className="px-4 py-4 text-right text-lg font-black italic tracking-tighter text-foreground leading-none">
                          -- <span className="text-[9px] not-italic opacity-30 ml-1">SOL</span>
                        </td>
                        <td className="px-4 py-4 rounded-r-sm text-center">
                          <Link href={`/repository/${repo.id}`} className="block opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition-all">
                            <ArrowUpRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 border border-dashed border-border/20 rounded-sm p-12">
                            No assets detected in current neural link.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'deployed' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deployedRepositories.length > 0 ? deployedRepositories.map((repo, i) => (
                  <Link key={repo.id} href={`/repository/${repo.id}`} className="group block h-40 bg-secondary/10 border border-border/40 hover:border-blue-500/40 p-5 rounded-sm transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rotate-45 transform translate-x-10 translate-y-[-10px] pointer-events-none" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-secondary/30 border border-border/20 rounded-sm flex items-center justify-center">
                        <Package size={20} className="text-blue-500/50" />
                      </div>
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-background/50 px-2 py-0.5 border border-border/20">
                        DEPLOYED: {new Date(repo.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <h4 className="text-lg font-black italic tracking-tighter uppercase mb-1 leading-none group-hover:text-blue-400 transition-colors">{repo.name}</h4>
                    <div className="text-[9px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest flex items-center gap-2">
                      IDENT: {repo.id}
                    </div>
                    <div className="absolute bottom-5 right-5 text-blue-500/30 group-hover:text-blue-500 transition-colors">
                      <ArrowUpRight size={24} />
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 border border-dashed border-border/20 rounded-sm p-12">
                      No deployment records found on-chain.
                      <Link href="/repository/create" className="block mt-4 text-blue-500 hover:text-blue-400 underline underline-offset-4">INITIATE NEW DEPLOYMENT</Link>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </main>

    </div>
  );
}
