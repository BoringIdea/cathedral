'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProvider } from '@/components/solana-provider';
import {
  distributeUserFee,
  distributePoolFee,
  getFeeRecipients,
  getPoolTokenMint,
  claimUserFees,
  validatePoolExists,
  getPoolCreator,
} from '@/lib/utils';
import {
  User,
  GitBranch,
  Plus,
  Edit3,
  TrendingUp,
  Download,
  Activity,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
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

const inputClassName =
  'h-9 border-border bg-[color:var(--bg-surface)] font-mono text-[11px] text-[color:var(--fg-strong)] placeholder:text-[color:var(--fg-muted)] focus-visible:ring-ring';

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
  const [isUserCreator, setIsUserCreator] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingPool, setEditingPool] = useState<string | null>(null);
  const [, setEditUserPercentage] = useState('');
  const [, setEditPoolPercentage] = useState('');
  const [myFeeInfo, setMyFeeInfo] = useState<FeeRecipient | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [poolCreators, setPoolCreators] = useState<Record<string, string>>({});
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  const fetchFeeRecipients = async () => {
    try {
      setIsLoadingRecipients(true);
      if (!provider) return;

      const feeRecipients = await getFeeRecipients(provider, poolAddress);
      const users: FeeRecipient[] = [];
      const pools: FeeRecipient[] = [];

      try {
        const creator = await getPoolCreator(provider, poolAddress);
        if (publicKey && creator) {
          setIsUserCreator(publicKey.toString() === creator);
        } else {
          setIsUserCreator(false);
        }
      } catch (error) {
        console.error('Failed to check creator permission', error);
      }

      feeRecipients.forEach((recipient: any) => {
        const feeRecipient: FeeRecipient = {
          recipientType: recipient.recipientType.user ? 'User' : 'Pool',
          address: recipient.address.toString(),
          sharePercentage: recipient.sharePercentage,
          totalFee: recipient.totalFee.toNumber(),
          unclaimedFee: recipient.unclaimedFee.toNumber(),
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
        } catch (error) {
          console.error('Failed to fetch pool creator', error);
        }
      }
      setPoolCreators(poolCreatorMap);

      if (publicKey) {
        const currentUserRecipient = feeRecipients.find(
          (recipient: any) => recipient.address.toString() === publicKey.toString() && recipient.recipientType.user
        );

        if (currentUserRecipient) {
          setMyFeeInfo({
            recipientType: 'User',
            address: currentUserRecipient.address.toString(),
            sharePercentage: currentUserRecipient.sharePercentage,
            totalFee: currentUserRecipient.totalFee.toNumber(),
            unclaimedFee: currentUserRecipient.unclaimedFee.toNumber(),
          });
        } else {
          setMyFeeInfo(null);
        }
      }
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
  }, [poolAddress, provider]);

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
      const txSignature = await distributePoolFee(
        provider,
        poolAddress,
        tokenMint,
        distributePoolAddress,
        distributePoolTokenMint,
        percentage
      );
      addToast(`Pool fee distributed! TX: ${txSignature.substring(0, 8)}...`, 'success');
      fetchFeeRecipients();
    } catch (error: any) {
      addToast(`${error.message || error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSOL = (lamports: number) => (lamports / 1e9).toFixed(6);
  const totalDistributed = userRecipients.reduce((sum, r) => sum + r.totalFee, 0) + poolRecipients.reduce((sum, r) => sum + r.totalFee, 0);
  const totalUnclaimed = userRecipients.reduce((sum, r) => sum + r.unclaimedFee, 0) + poolRecipients.reduce((sum, r) => sum + r.unclaimedFee, 0);

  const RecipientRow = ({
    recipient,
    index,
    kind,
  }: {
    recipient: FeeRecipient;
    index: number;
    kind: 'user' | 'pool';
  }) => {
    const isPool = kind === 'pool';
    const creatorAddress = isPool ? poolCreators[recipient.address] : null;

    return (
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border border-border bg-[color:var(--bg-surface)] px-3 py-3 transition-colors hover:bg-[color:var(--bg-muted)]">
        <div className="flex h-8 w-8 items-center justify-center border border-border bg-[color:var(--bg-muted)] font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="truncate font-mono text-[11px] text-[color:var(--fg-strong)]">{recipient.address}</div>
          {creatorAddress && (
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--fg-muted)]">
              creator {creatorAddress.slice(0, 6)}...{creatorAddress.slice(-4)}
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--fg-muted)]">
            <span>{t(isPool ? 'repository.grant_panel.distributed' : 'repository.grant_panel.total')}: {formatSOL(recipient.totalFee)}</span>
            <span>{t('repository.grant_panel.pending')}: {formatSOL(recipient.unclaimedFee)}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="text-right">
            <div className="font-mono text-[13px] text-[color:var(--fg-strong)]">{recipient.sharePercentage}%</div>
          </div>
          {isUserCreator && (
            <button
              onClick={() => {
                if (isPool) {
                  setEditingPool(recipient.address);
                  setEditPoolPercentage(recipient.sharePercentage.toString());
                } else {
                  setEditingUser(recipient.address);
                  setEditUserPercentage(recipient.sharePercentage.toString());
                }
              }}
              className="mt-0.5 text-[color:var(--fg-muted)] transition-colors hover:text-[color:var(--fg-strong)]"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden text-[11px] leading-tight text-[color:var(--fg-body)]">
      <div className="grid shrink-0 grid-cols-1 border-b border-border bg-[color:var(--bg-muted)] md:grid-cols-2">
        <div className="space-y-2 border-b border-border px-5 py-4 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-muted)]">
            <Activity className="h-3.5 w-3.5 text-[color:var(--fg-strong)]" />
            <span>{t('repository.grant_panel.global_distributed')}</span>
          </div>
          <div className="cathedral-num text-[28px] leading-none">{formatSOL(totalDistributed)}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">SOL</div>
        </div>

        <div className="space-y-2 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-muted)]">
              <TrendingUp className="h-3.5 w-3.5 text-[color:var(--fg-strong)]" />
              <span>{t('repository.grant_panel.unclaimed_pool')}</span>
            </div>
            {myFeeInfo && myFeeInfo.unclaimedFee > 0 && (
              <Button
                onClick={handleClaimFees}
                disabled={isClaiming}
                variant="outline"
                size="sm"
                className="h-8 border-border bg-[color:var(--bg-surface)] px-3 text-[10px] text-[color:var(--fg-strong)]"
              >
                {isClaiming ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />}
                {t('repository.grant_panel.claim_my_share')}
              </Button>
            )}
          </div>
          <div className="cathedral-num text-[28px] leading-none">{formatSOL(totalUnclaimed)}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">SOL</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-5 custom-scrollbar">
        <div className="space-y-8">
          {myFeeInfo && (
            <section className="space-y-3 border border-border bg-[color:var(--bg-surface)] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-muted)]">
                    {t('repository.grant_panel.available_to_claim')}
                  </div>
                  <div className="cathedral-h2 mt-2 text-[24px]">{formatSOL(myFeeInfo.unclaimedFee)} SOL</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
                  {t('repository.grant_panel.active_recipient')}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="border border-border bg-[color:var(--bg-muted)] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
                    {t('repository.grant_panel.my_share')}
                  </div>
                  <div className="cathedral-num mt-2 text-[20px]">{myFeeInfo.sharePercentage}%</div>
                </div>
                <div className="border border-border bg-[color:var(--bg-muted)] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
                    {t('repository.grant_panel.accumulated')}
                  </div>
                  <div className="cathedral-num mt-2 text-[20px]">{formatSOL(myFeeInfo.totalFee)}</div>
                </div>
                <div className="border border-border bg-[color:var(--bg-surface)] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
                    {t('repository.grant_panel.claimable')}
                  </div>
                  <div className="cathedral-num mt-2 text-[20px]">{formatSOL(myFeeInfo.unclaimedFee)}</div>
                </div>
              </div>

              {myFeeInfo.unclaimedFee > 0 && (
                <Button
                  onClick={handleClaimFees}
                  disabled={isClaiming}
                  variant="outline"
                  className="h-10 w-full border-border bg-[color:var(--fg-strong)] text-[color:var(--bg-surface)] hover:bg-[color:var(--fg-body)]"
                >
                  {isClaiming ? (
                    t('repository.grant_panel.processing')
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="h-3.5 w-3.5" />
                      {t('repository.grant_panel.claim_distribution')}
                    </span>
                  )}
                </Button>
              )}
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-strong)]">
                  <User className="h-3.5 w-3.5" />
                  {t('repository.grant_panel.collaborators')}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">
                  {userRecipients.length} {t('repository.grant_panel.slots')}
                </span>
              </div>

              <div className="space-y-2">
                {userRecipients.map((recipient, index) => (
                  <RecipientRow key={`${recipient.address}-${index}`} recipient={recipient} index={index} kind="user" />
                ))}

                {isUserCreator && (
                  <div className="grid gap-2 border border-dashed border-border bg-[color:var(--bg-muted)] p-3 md:grid-cols-[1fr_88px_auto]">
                    <Input
                      placeholder={t('repository.grant_panel.collaborator_placeholder')}
                      value={newUserAddress}
                      onChange={(e) => setNewUserAddress(e.target.value)}
                      className={inputClassName}
                    />
                    <Input
                      placeholder="%"
                      value={newUserPercentage}
                      onChange={(e) => setNewUserPercentage(e.target.value)}
                      className={`${inputClassName} text-center`}
                    />
                    <Button
                      onClick={async () => {
                        await handleDistributeUserFee(newUserAddress, parseInt(newUserPercentage, 10));
                        setNewUserAddress('');
                        setNewUserPercentage('');
                      }}
                      disabled={isLoading || !newUserAddress}
                      variant="outline"
                      className="h-9 border-border bg-[color:var(--bg-surface)] text-[color:var(--fg-strong)]"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      add
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-strong)]">
                  <GitBranch className="h-3.5 w-3.5" />
                  {t('repository.grant_panel.cross_pool')}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">
                  {poolRecipients.length} {t('repository.grant_panel.pools')}
                </span>
              </div>

              <div className="space-y-2">
                {poolRecipients.map((recipient, index) => (
                  <RecipientRow key={`${recipient.address}-${index}`} recipient={recipient} index={index} kind="pool" />
                ))}

                {isUserCreator && (
                  <div className="grid gap-2 border border-dashed border-border bg-[color:var(--bg-muted)] p-3 md:grid-cols-[1fr_88px_auto]">
                    <Input
                      placeholder={t('repository.grant_panel.target_pool_placeholder')}
                      value={newPoolAddress}
                      onChange={(e) => setNewPoolAddress(e.target.value)}
                      className={inputClassName}
                    />
                    <Input
                      placeholder="%"
                      value={newPoolPercentage}
                      onChange={(e) => setNewPoolPercentage(e.target.value)}
                      className={`${inputClassName} text-center`}
                    />
                    <Button
                      onClick={async () => {
                        await handleDistributePoolFee(newPoolAddress, parseInt(newPoolPercentage, 10));
                        setNewPoolAddress('');
                        setNewPoolPercentage('');
                      }}
                      disabled={isLoading || !newPoolAddress}
                      variant="outline"
                      className="h-9 border-border bg-[color:var(--bg-surface)] text-[color:var(--fg-strong)]"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      add
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex items-start gap-3 border border-border bg-[color:var(--bg-muted)] p-4">
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--fg-strong)]" />
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-strong)]">
                {t('repository.grant_panel.grant_protocol_title')}
              </p>
              <p className="cathedral-copy text-[13px] leading-6">
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
