'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Github, Loader2, Terminal, Shield, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthCallback() {
  const router = useRouter();
  const [isAuthProcessed, setIsAuthProcessed] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[PROMETHEUS] Initializing secure handshake...",
    "[CORE] Intercepting GitHub OAuth packet..."
  ]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message].slice(-5));
  };

  useEffect(() => {
    const processAuth = async () => {
      if (isAuthProcessed) return;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code && !isAuthProcessed) {
        setIsAuthProcessed(true);
        addLog("[INFO] Authorization code 0x" + code.slice(0, 8) + "... received.");

        try {
          addLog("[INFO] Exchanging for cryptographic JWT token...");
          const response: ApiResponse<any> = await apiPost(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
            { code }
          );

          const authData = response.data || response;
          if (authData.success && authData.user_name && authData.jwt_token) {
            addLog("[OK] Identity verified: " + authData.user_name);
            addLog("[OK] Storing secure session keys...");

            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user_name', authData.user_name);
            localStorage.setItem('jwt_token', authData.jwt_token);

            addLog("[INFO] Redirecting to system core...");
            // Small delay to let user see the "Success" logs
            setTimeout(() => {
              router.push('/');
            }, 800);
          } else {
            addLog("[ERROR] Authentication sequence aborted.");
            router.push('/login?error=auth_failed');
          }
        } catch (error: any) {
          addLog("[CRITICAL] Protocol failure detected.");
          console.error('auth process failed', error);

          const errorPath = error.status === 400 ? 'invalid_code' :
            error.status === 500 ? 'server_error' :
              error.message?.includes('Failed to get access token') ? 'github_auth_failed' : 'unknown';

          router.push(`/login?error=${errorPath}`);
        }
      }
    };

    processAuth();
  }, [router, isAuthProcessed]);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center p-6 selection:bg-cathedral-500/30">
      <div className="max-w-md w-full space-y-8 animate-in fade-in duration-1000">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-cathedral-500/10 rounded-sm border border-cathedral-500/20">
            <Github className="w-12 h-12 text-cathedral-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Authenticating Identity</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">Synchronizing with cryptographic hash layer</p>
          </div>
        </div>

        <div className="terminal-card bg-black/40 border-border/50 p-6 space-y-4 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] border-t border-cathedral-400/20 opacity-20" />

          <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cathedral-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Auth_Security_Protocol_v2.4</span>
            </div>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-cathedral-500/20" />
              <div className="w-1 h-1 rounded-full bg-cathedral-500/40" />
              <div className="w-1 h-1 rounded-full bg-cathedral-500/60" />
            </div>
          </div>

          <div className="space-y-2.5 min-h-[120px] flex flex-col justify-end">
            {logs.map((log, i) => (
              <div key={i} className={cn(
                "text-[10px] uppercase font-bold tracking-tight transform transition-all duration-300",
                log.includes("[OK]") ? "text-emerald-500" :
                  log.includes("[ERROR]") || log.includes("[CRITICAL]") ? "text-rose-500" :
                    "text-muted-foreground/80"
              )}>
                <span className="mr-2 opacity-30">❯</span>
                {log}
              </div>
            ))}
            <div className="flex items-center gap-2 text-[10px] font-black italic text-cathedral-400 mt-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="animate-pulse uppercase tracking-widest">Awaiting kernel sync...</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, label: "ENCRYPTED" },
            { icon: Cpu, label: "PROCESSING" },
            { icon: Activity, label: "LIVE_LINK" }
          ].map((item, i) => (
            <div key={i} className="terminal-card p-3 bg-white/[0.02] border-white/5 flex flex-col items-center gap-2 group hover:border-cathedral-500/20 transition-all">
              <item.icon className="w-4 h-4 text-muted-foreground/20 group-hover:text-cathedral-500/40 transition-colors" />
              <span className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter group-hover:text-muted-foreground/40">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em]">
            Authorized Access Only • System Time: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}