"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useAnchorProvider } from "@/components/solana-provider";
import { constructCreatePoolInstruction, cn } from "@/lib/utils";
import {
  Github,
  Package,
  Plus,
  Search,
  FileText,
  Image as ImageIcon,
  Wallet,
  AlertCircle,
  Rocket,
  Terminal,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { apiGet, apiPostFormData, apiPost } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { useTranslation } from '@/lib/i18n-context';

async function fectchUserRepositories(jwt: string) {
  try {
    const response: ApiResponse<any[]> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/repositories`,
      { 'Authorization': `Bearer ${jwt}` }
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    if (error.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_name');
    }
    return [];
  }
}

async function fetchUserInfo(jwt: string) {
  try {
    const response: ApiResponse<any> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
      { 'Authorization': `Bearer ${jwt}` }
    );
    return response.data;
  } catch (error: any) {
    if (error.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_name');
    }
    return null;
  }
}

async function bindWallet(jwt: string, signature: string, message: string, walletAddress: string) {
  try {
    return await apiPost(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/wallet/bind`,
      { signature, message, walletAddress },
      { 'Authorization': `Bearer ${jwt}` }
    );
  } catch (error: any) {
    console.error('Bind wallet failed:', error);
    throw error;
  }
}

export default function CreateCoin() {
  const provider = useAnchorProvider();
  const { connection } = useConnection();
  const { connected, wallet, publicKey, sendTransaction, signMessage } = useWallet();
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [repositories, setRepositories] = useState<{ name: string; updatedAt: string; description?: string }[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [filteredRepositories, setFilteredRepositories] = useState<{ name: string; updatedAt: string; description?: string }[]>([]);

  const [boundWallet, setBoundWallet] = useState<string | null>(null);
  const [isBindingWallet, setIsBindingWallet] = useState(false);
  const [walletMismatch, setWalletMismatch] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const jwt = localStorage.getItem('jwt_token');
    const fetchUser = async () => {
      if (jwt) {
        const userInfo = await fetchUserInfo(jwt);
        setUsername(userInfo?.githubLogin || '');
        setBoundWallet(userInfo?.wallet || null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (boundWallet && publicKey) {
      const currentWallet = publicKey.toBase58();
      setWalletMismatch(currentWallet !== boundWallet);
    } else {
      setWalletMismatch(false);
    }
  }, [boundWallet, publicKey]);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt_token');
    const fetchRepos = async () => {
      if (jwt) {
        const repos = await fectchUserRepositories(jwt);
        setRepositories(repos);
        setFilteredRepositories(repos);
      }
    };
    fetchRepos();
  }, [username, transactionComplete]);

  useEffect(() => {
    const results = repositories.filter(repo =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRepositories(results);
  }, [searchTerm, repositories]);

  const handleImport = (repo: any) => {
    if (selectedRepo === repo.name) {
      setSelectedRepo('');
      setName('');
      setTicker('');
      setDescription('');
    } else {
      setSelectedRepo(repo.name);
      setName(repo.name);
      setTicker(repo.name.split('-').join('').toUpperCase());
      setDescription(repo.description?.slice(0, 80) || '');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const encodeBase58 = (bytes: Uint8Array): string => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    const ZERO = BigInt(0), BASE = BigInt(58);
    while (num > ZERO) {
      result = alphabet[Number(num % BASE)] + result;
      num = num / BASE;
    }
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = '1' + result;
    return result || '1';
  };

  const handleBindWallet = async () => {
    if (!connected || !publicKey || !signMessage) return alert('Please connect wallet');
    const jwt = localStorage.getItem('jwt_token');
    if (!jwt) return alert('Please login with GitHub');

    try {
      setIsBindingWallet(true);
      const message = `Bind wallet to Cathedral account: ${username}\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
      const signature = encodeBase58(await signMessage(new TextEncoder().encode(message)));
      await bindWallet(jwt, signature, message, publicKey.toBase58());
      setBoundWallet(publicKey.toBase58());
      setWalletMismatch(false);
      alert('✅ Wallet bound successfully!');
    } catch (error: any) {
      alert('Failed to bind wallet: ' + (error.message || error));
    } finally {
      setIsBindingWallet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey || !wallet) return alert('Please connect wallet');
    if (!name || !ticker || !description) return alert('Please fill in all fields');

    let imgUrl = 'https://res.cloudinary.com/drk2xlevs/image/upload/v1728208486/px76xwyyegca5apu12oh.png';
    if (image) {
      try {
        const formData = new FormData();
        formData.append('image', image);
        const response: ApiResponse<any> = await apiPostFormData(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/upload`, formData);
        imgUrl = response.data.data || imgUrl;
      } catch (error) {
        console.error('Upload image failed:', error);
      }
    }

    try {
      setIsLoading(true);
      const mintKeypair = Keypair.generate();
      const transaction = await constructCreatePoolInstruction(
        connection, provider, publicKey, mintKeypair.publicKey, 9,
        name, ticker.toUpperCase(), imgUrl, description,
        selectedRepo, `https://github.com/${username}/${selectedRepo}`, username
      );

      const { blockhash } = await connection.getLatestBlockhash();
      const messageLegacy = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: transaction.instructions,
      }).compileToV0Message();

      const newtransaction = new VersionedTransaction(messageLegacy);
      newtransaction.sign([mintKeypair]);
      await sendTransaction(newtransaction, connection);

      alert('🚀 Launch sequence completed successfully!');
      setTransactionComplete(true);
      setSelectedRepo(''); setName(''); setTicker(''); setDescription('');
    } catch (error) {
      alert('Launch failed, ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground font-mono selection:bg-cathedral-500/30">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Column: Documentation & Status */}
        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
          <div className="terminal-card p-6 bg-secondary/5 border-cathedral-500/20">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Terminal className="w-4 h-4 text-cathedral-400" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">{t('launch.deployment_protocol.title')}</h2>
            </div>
            <div className="space-y-6 text-[11px] leading-relaxed text-muted-foreground uppercase tracking-tight">
              <div className="flex gap-4">
                <span className="text-cathedral-500 font-bold shrink-0">01.</span>
                <p>{t('launch.deployment_protocol.step1')}</p>
              </div>
              <div className="flex gap-4">
                <span className="text-cathedral-500 font-bold shrink-0">02.</span>
                <p>{t('launch.deployment_protocol.step2')}</p>
              </div>
              <div className="flex gap-4">
                <span className="text-cathedral-500 font-bold shrink-0">03.</span>
                <p>{t('launch.deployment_protocol.step3')}</p>
              </div>
              <div className="flex gap-4 border-t border-border pt-6 text-amber-500/80">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="normal-case italic">{t('launch.deployment_protocol.alert')}</p>
              </div>
            </div>
          </div>

          <div className="terminal-card p-6 border-white/5 bg-white/[0.02]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">{t('launch.network_status.title')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-sm">
                <span className="text-[10px] uppercase">Solana Devnet</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] text-amber-500 font-bold">{t('launch.network_status.online')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-sm">
                <span className="text-[10px] uppercase">Protocol V0.0.1</span>
                <span className="text-[10px] text-cathedral-400 font-bold">{t('launch.network_status.active')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Column: Main Launch Form */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cathedral-500/10 rounded-sm border border-cathedral-500/20">
                <Rocket className="w-6 h-6 text-cathedral-500" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">{t('launch.title')}</h1>
            </div>
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">{t('launch.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Repository Discovery */}
            <div className="terminal-card overflow-hidden">
              <div className="px-6 py-4 bg-secondary/30 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('launch.select_repo')}</span>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('launch.scan_placeholder')}
                    className="h-7 bg-black/40 border-none text-[10px] pl-7 focus:ring-1 focus:ring-cathedral-500/30"
                  />
                </div>
              </div>

              <ScrollArea className="h-[300px] bg-black/20">
                <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredRepositories.map((repo, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleImport(repo)}
                      className={cn(
                        "p-4 rounded-sm border transition-all cursor-pointer group",
                        selectedRepo === repo.name
                          ? "bg-cathedral-500/10 border-cathedral-500/50"
                          : "bg-white/[0.02] border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-bold truncate max-w-[200px] group-hover:text-cathedral-400 transition-colors">
                            {repo.name}
                          </div>
                          <div className="text-[9px] text-muted-foreground uppercase">
                            {t('launch.modified')}: {new Date(repo.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        {selectedRepo === repo.name && (
                          <div className="w-4 h-4 bg-cathedral-500 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredRepositories.length === 0 && (
                    <div className="col-span-2 py-20 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                      {t('launch.zero_repos', { username })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Step 2: Protocol Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="terminal-card p-6 space-y-6">
                  <div className="flex items-center gap-2 border-b border-border pb-4">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('launch.genesis_config')}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-muted-foreground">{t('launch.ticker')}</label>
                        <Input
                          value={ticker}
                          onChange={(e) => setTicker(e.target.value)}
                          placeholder="GRT"
                          className="bg-black/40 border-border/50 font-black italic uppercase placeholder:not-italic"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-muted-foreground">{t('launch.initial_mint')}</label>
                        <Input
                          disabled
                          value="1,000,000,000"
                          className="bg-black/20 border-white/5 text-muted-foreground/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground">{t('launch.project_brief')}</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-32 bg-black/40 border border-border/50 rounded-sm p-4 text-xs font-mono focus:border-cathedral-500/50 focus:ring-0 transition-all resize-none"
                        placeholder={t('launch.define_mission_placeholder')}
                      />
                      <div className="text-right text-[8px] text-muted-foreground uppercase">{description.length}/80 {t('launch.characters')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="terminal-card p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('launch.asset_visual')}</span>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <input type="file" id="image-upload" className="hidden" onChange={handleImageChange} accept="image/*" />
                    <label
                      htmlFor="image-upload"
                      className="flex-1 border-2 border-dashed border-border/40 rounded-sm hover:border-cathedral-500/40 transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center bg-black/20"
                    >
                      {image ? (
                        <div className="space-y-2">
                          <Activity className="w-8 h-8 text-emerald-500 mx-auto" />
                          <span className="text-[9px] font-bold uppercase block truncate max-w-[120px]">{image.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Cpu className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t('launch.upload_core_icon')}</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Layer */}
            <div className="pt-6">
              {walletMismatch && boundWallet && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/20 p-4 rounded-sm flex items-center gap-4">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <div className="text-[10px] uppercase font-bold text-rose-500/90 leading-relaxed">
                    {t('launch.identity_mismatch', { wallet: `${boundWallet.slice(0, 6)}...${boundWallet.slice(-6)}` })}
                  </div>
                </div>
              )}

              {!boundWallet ? (
                <Button
                  type="button"
                  onClick={handleBindWallet}
                  disabled={!connected || isBindingWallet}
                  className="w-full h-16 bg-white text-black hover:bg-gray-200 uppercase font-black tracking-[0.3em] flex items-center justify-center gap-3 transition-all rounded-sm"
                >
                  {isBindingWallet ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      {t('launch.bind_identity')}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!connected || isLoading || !selectedRepo || walletMismatch}
                  className="w-full h-16 bg-cathedral-600 hover:bg-cathedral-700 text-white uppercase font-black tracking-[0.3em] flex items-center justify-center gap-3 transition-all rounded-sm disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      {t('launch.initiate_launch')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}