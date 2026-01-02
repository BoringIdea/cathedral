'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProvider } from "@/components/solana-provider";
import { Connection } from '@solana/web3.js';
import {
  distributeUserFee,
  distributePoolFee,
  getFeeRecipients,
  getPoolTokenMint,
  claimUserFees,
  validatePoolExists,
  validateSolanaAddress,
  getPoolCreator
} from "@/lib/utils";
import {
  User,
  GitBranch,
  Plus,
  Edit3,
  TrendingUp,
  Wallet,
  Download,
  Activity,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { useToast } from "@/components/ui/toast";
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n-context';

interface FeeRecipient {
  recipientType: 'User' | 'Pool';
  address: string;
  sharePercentage: number;
  totalFee: number;
  unclaimedFee: number;
}

interface FeeDistributionProps {
  poolAddress: string;
  tokenMint: string;
  isCreator: boolean;
}

export default function FeeDistribution({ poolAddress, tokenMint }: Omit<FeeDistributionProps, 'isCreator'> & { isCreator?: boolean }) {
  const { publicKey } = useWallet();
  const provider = useAnchorProvider();
  const { addToast, ToastContainer } = useToast();
  const { t } = useTranslation();

  const [userRecipients, setUserRecipients] = useState<FeeRecipient[]>([]);
  const [poolRecipients, setPoolRecipients] = useState<FeeRecipient[]>([]);
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserPercentage, setNewUserPercentage] = useState('');
  const [newPoolAddress, setNewPoolAddress] = useState('');
  const [newPoolPercentage, setNewPoolPercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUserCreator, setIsUserCreator] = useState(false); // Internal state for creator permission
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingPool, setEditingPool] = useState<string | null>(null);
  const [editUserPercentage, setEditUserPercentage] = useState('');
  const [editPoolPercentage, setEditPoolPercentage] = useState('');
  const [myFeeInfo, setMyFeeInfo] = useState<FeeRecipient | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [poolCreators, setPoolCreators] = useState<Record<string, string>>({});
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // ... (keeping fetchFeeRecipients, handleClaimFees, useEffect, handleDistributeUserFee, handleDistributePoolFee, formatSOL as they were) ...

  const fetchFeeRecipients = async () => {
    try {
      setIsLoadingRecipients(true);
      if (!provider) return;

      const feeRecipients = await getFeeRecipients(provider, poolAddress);
      const users: FeeRecipient[] = [];
      const pools: FeeRecipient[] = [];

      // Check Creator Permission
      try {
        const creator = await getPoolCreator(provider, poolAddress);
        if (publicKey && creator) {
          setIsUserCreator(publicKey.toString() === creator);
        } else {
          setIsUserCreator(false);
        }
      } catch (e) {
        console.error("Failed to check creator permission", e);
      }

      feeRecipients.forEach((recipient: any) => {
        const feeRecipient: FeeRecipient = {
          recipientType: recipient.recipientType.user ? 'User' : 'Pool',
          address: recipient.address.toString(),
          sharePercentage: recipient.sharePercentage,
          totalFee: recipient.totalFee.toNumber(),
          unclaimedFee: recipient.unclaimedFee.toNumber()
        };

        if (feeRecipient.recipientType === 'User') users.push(feeRecipient);
        else pools.push(feeRecipient);
      });

      setUserRecipients(users);
      setPoolRecipients(pools);

      const poolCreatorMap: Record<string, string> = {};
      for (const poolRecipient of pools) {
        try {
          const creator = await getPoolCreator(provider, poolRecipient.address);
          if (creator) poolCreatorMap[poolRecipient.address] = creator;
        } catch (e) { }
      }
      setPoolCreators(poolCreatorMap);

      if (publicKey) {
        const currentUserRecipient = feeRecipients.find((recipient: any) =>
          // Use stricter string comparison or proper PK comparison if available on recipient object
          recipient.address.toString() === publicKey.toString() &&
          recipient.recipientType.user
        );

        if (currentUserRecipient) {
          setMyFeeInfo({
            recipientType: 'User',
            address: currentUserRecipient.address.toString(),
            sharePercentage: currentUserRecipient.sharePercentage,
            totalFee: currentUserRecipient.totalFee.toNumber(),
            unclaimedFee: currentUserRecipient.unclaimedFee.toNumber()
          });
        }
      }
    } catch (error) {
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const handleClaimFees = async () => {
    if (!provider || !publicKey || !myFeeInfo) return;
    try {
      setIsClaiming(true);
      const txSignature = await claimUserFees(provider, poolAddress, tokenMint);
      addToast(`Fees claimed! TX: ${txSignature.substring(0, 8)}...`, 'success');
      fetchFeeRecipients();
    } catch (error) {
      addToast(`Claim failed: ${error}`, 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (poolAddress && provider) fetchFeeRecipients();
  }, [poolAddress, provider, fetchFeeRecipients]);

  const handleDistributeUserFee = async (recipientAddress: string, percentage: number) => {
    if (!provider || !publicKey) return;
    try {
      setIsLoading(true);
      const txSignature = await distributeUserFee(provider, poolAddress, tokenMint, recipientAddress, percentage);
      addToast(`User fee distributed! TX: ${txSignature.substring(0, 8)}...`, 'success');
      fetchFeeRecipients();
    } catch (error) {
      addToast(`Distribution failed: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributePoolFee = async (distributePoolAddress: string, percentage: number) => {
    if (!provider || !publicKey) return;
    try {
      setIsLoading(true);
      if (distributePoolAddress === poolAddress) throw new Error('Cannot distribute to same pool');
      const poolExists = await validatePoolExists(provider, distributePoolAddress);
      if (!poolExists) throw new Error('Target pool does not exist');
      const distributePoolTokenMint = await getPoolTokenMint(provider, distributePoolAddress);
      const txSignature = await distributePoolFee(provider, poolAddress, tokenMint, distributePoolAddress, distributePoolTokenMint, percentage);
      addToast(`Pool fee distributed! TX: ${txSignature.substring(0, 8)}...`, 'success');
      fetchFeeRecipients();
    } catch (error: any) {
      addToast(`${error.message || error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSOL = (lamports: number) => (lamports / 1e9).toFixed(6);

  return (
    <div className="h-full flex flex-col font-mono text-[11px] leading-tight select-none overflow-hidden">
      {/* Top Banner: Global Fees Summary */}
      <div className="grid grid-cols-2 border-b border-border bg-secondary/5 h-20 shrink-0 overflow-hidden">
        <div className="px-5 py-3 border-r border-border relative">
          <div className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest font-black text-[9px] mb-1">
            <Activity className="w-2.5 h-2.5 text-emerald-500" />
            {t('repository.grant_panel.global_distributed')}
          </div>
          <div className="text-xl font-black italic tracking-tighter text-emerald-400">
            {formatSOL(userRecipients.reduce((sum, r) => sum + r.totalFee, 0) + poolRecipients.reduce((sum, r) => sum + r.totalFee, 0))}
            <span className="text-[10px] ml-1.5 opacity-50 not-italic">SOL</span>
          </div>
          <div className="absolute top-3 right-5 opacity-10 text-[24px] pointer-events-none">{t('repository.grant_panel.fee_watermark')}</div>
        </div>

        <div className="px-5 py-3 relative group">
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest font-black text-[9px]">
              <TrendingUp className="w-2.5 h-2.5 text-orange-500" />
              {t('repository.grant_panel.unclaimed_pool')}
            </div>
            {myFeeInfo && myFeeInfo.unclaimedFee > 0 && (
              <button
                onClick={handleClaimFees}
                disabled={isClaiming}
                className="text-[9px] font-black uppercase tracking-widest text-cathedral-400 hover:text-cathedral-500 transition-colors flex items-center gap-1 bg-cathedral-500/10 px-2 py-0.5 rounded-sm border border-cathedral-500/20"
              >
                {isClaiming ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Download className="w-2.5 h-2.5" />}
                {t('repository.grant_panel.claim_my_share')}
              </button>
            )}
          </div>
          <div className="text-xl font-black italic tracking-tighter text-orange-400">
            {formatSOL(userRecipients.reduce((sum, r) => sum + r.unclaimedFee, 0) + poolRecipients.reduce((sum, r) => sum + r.unclaimedFee, 0))}
            <span className="text-[10px] ml-1.5 opacity-50 not-italic">SOL</span>
          </div>
          <div className="absolute top-3 right-5 opacity-10 text-[24px] pointer-events-none group-hover:opacity-5 transition-opacity">{t('repository.grant_panel.pool_watermark')}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-5 space-y-8 custom-scrollbar">

        {/* User's Claimable Section */}
        {myFeeInfo && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <h3 className="uppercase tracking-widest font-black text-foreground">{t('repository.grant_panel.available_to_claim')}</h3>
              </div>
              <div className="text-[9px] px-2 py-0.5 border border-emerald-500/30 text-emerald-500 font-bold tracking-tighter rounded-full bg-emerald-500/5">
                {t('repository.grant_panel.active_recipient')}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/20 border border-border p-3 rounded-sm">
                <span className="block text-[8px] text-muted-foreground uppercase mb-0.5">{t('repository.grant_panel.my_share')}</span>
                <span className="text-lg font-black italic text-foreground leading-none">{myFeeInfo.sharePercentage}%</span>
              </div>
              <div className="bg-secondary/20 border border-border p-3 rounded-sm">
                <span className="block text-[8px] text-muted-foreground uppercase mb-0.5">{t('repository.grant_panel.accumulated')}</span>
                <span className="text-lg font-black italic text-foreground leading-none">{formatSOL(myFeeInfo.totalFee)}</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-sm flex-1">
                  <span className="block text-[8px] text-emerald-500/70 uppercase mb-0.5">{t('repository.grant_panel.claimable')}</span>
                  <span className="text-lg font-black italic text-emerald-400 leading-none">{formatSOL(myFeeInfo.unclaimedFee)}</span>
                </div>
              </div>
            </div>

            {myFeeInfo.unclaimedFee > 0 && (
              <Button
                onClick={handleClaimFees}
                disabled={isClaiming}
                className="w-full mt-3 h-10 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest text-[10px] rounded-sm transition-all"
              >
                {isClaiming ? t('repository.grant_panel.processing') : (
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    {t('repository.grant_panel.claim_distribution')}
                  </span>
                )}
              </Button>
            )}
          </section>
        )}

        {/* Recipients Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* USER RECIPIENTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <h3 className="uppercase tracking-widest font-black text-foreground flex items-center gap-2">
                <User className="w-3 h-3 text-blue-500" />
                {t('repository.grant_panel.collaborators')}
              </h3>
              <span className="text-[9px] text-muted-foreground font-bold">{userRecipients.length} {t('repository.grant_panel.slots')}</span>
            </div>

            <div className="space-y-1.5">
              {userRecipients.map((r, i) => (
                <div key={i} className="group flex items-center bg-secondary/10 border border-border/40 p-1.5 hover:border-blue-500/30 transition-all rounded-sm overflow-hidden">
                  <div className="w-6 h-6 flex items-center justify-center bg-secondary/30 text-[9px] font-black mr-2 opacity-50">0{i + 1}</div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-[10px] font-bold text-foreground truncate font-mono">{r.address}</div>
                    <div className="flex items-center gap-4 mt-1 opacity-60 text-[9px] uppercase tracking-tighter">
                      <span>{t('repository.grant_panel.total')}: {formatSOL(r.totalFee)}</span>
                      <span>{t('repository.grant_panel.pending')}: {formatSOL(r.unclaimedFee)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black italic text-blue-400 leading-none">{r.sharePercentage}%</div>
                    {isUserCreator && (
                      <button
                        onClick={() => { setEditingUser(r.address); setEditUserPercentage(r.sharePercentage.toString()); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-opacity mt-1.5"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isUserCreator && (
                <div className="pt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('repository.grant_panel.collaborator_placeholder')}
                      value={newUserAddress}
                      onChange={e => setNewUserAddress(e.target.value)}
                      className="flex-1 h-8 bg-black/40 border-border text-[10px] font-bold uppercase placeholder:opacity-30 rounded-sm focus:ring-1 focus:ring-blue-500/30"
                    />
                    <Input
                      placeholder="%"
                      value={newUserPercentage}
                      onChange={e => setNewUserPercentage(e.target.value)}
                      className="w-12 h-8 bg-black/40 border-border text-[10px] font-bold text-center rounded-sm focus:ring-1 focus:ring-blue-500/30"
                    />
                    <Button
                      onClick={async () => { await handleDistributeUserFee(newUserAddress, parseInt(newUserPercentage)); setNewUserAddress(''); setNewUserPercentage(''); }}
                      disabled={isLoading || !newUserAddress}
                      className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-black rounded-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* POOL RECIPIENTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <h3 className="uppercase tracking-widest font-black text-foreground flex items-center gap-2">
                <GitBranch className="w-3 h-3 text-purple-500" />
                {t('repository.grant_panel.cross_pool')}
              </h3>
              <span className="text-[9px] text-muted-foreground font-bold">{poolRecipients.length} {t('repository.grant_panel.pools')}</span>
            </div>

            <div className="space-y-1.5">
              {poolRecipients.map((r, i) => (
                <div key={i} className="group flex items-center bg-secondary/10 border border-border/40 p-1.5 hover:border-purple-500/30 transition-all rounded-sm overflow-hidden">
                  <div className="w-6 h-6 flex items-center justify-center bg-secondary/30 text-[9px] font-black mr-2 opacity-50">0{i + 1}</div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-[10px] font-bold text-foreground truncate font-mono">{r.address}</div>
                    <div className="flex items-center gap-4 mt-1 opacity-60 text-[9px] uppercase tracking-tighter">
                      <span>{t('repository.grant_panel.distributed')}: {formatSOL(r.totalFee)}</span>
                      <span>{t('repository.grant_panel.pending')}: {formatSOL(r.unclaimedFee)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black italic text-purple-400 leading-none">{r.sharePercentage}%</div>
                    {isUserCreator && (
                      <button
                        onClick={() => { setEditingPool(r.address); setEditPoolPercentage(r.sharePercentage.toString()); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-opacity mt-1.5"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isUserCreator && (
                <div className="pt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('repository.grant_panel.target_pool_placeholder')}
                      value={newPoolAddress}
                      onChange={e => setNewPoolAddress(e.target.value)}
                      className="flex-1 h-8 bg-black/40 border-border text-[10px] font-bold uppercase placeholder:opacity-30 rounded-sm focus:ring-1 focus:ring-purple-500/30"
                    />
                    <Input
                      placeholder="%"
                      value={newPoolPercentage}
                      onChange={e => setNewPoolPercentage(e.target.value)}
                      className="w-12 h-8 bg-black/40 border-border text-[10px] font-bold text-center rounded-sm focus:ring-1 focus:ring-purple-500/30"
                    />
                    <Button
                      onClick={async () => { await handleDistributePoolFee(newPoolAddress, parseInt(newPoolPercentage)); setNewPoolAddress(''); setNewPoolPercentage(''); }}
                      disabled={isLoading || !newPoolAddress}
                      className="h-8 w-8 p-0 bg-purple-500 hover:bg-purple-600 text-black rounded-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Global Alert / Info */}
        <div className="bg-secondary/5 border-l-2 border-emerald-500/30 p-4 rounded-r-sm">
          <div className="flex items-start gap-3">
            <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-foreground font-black uppercase tracking-widest text-[10px]">{t('repository.grant_panel.grant_protocol_title')}</p>
              <p className="text-muted-foreground leading-normal">
                {t('repository.grant_panel.grant_protocol_description')}
              </p>
            </div>
          </div>
        </div>

      </div>

      <ToastContainer />
    </div>
  );
}
