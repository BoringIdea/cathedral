'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Github, Loader2, Shield, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthCallback() {
  const router = useRouter();
  const [isAuthProcessed, setIsAuthProcessed] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'Starting secure sign-in…',
    'Preparing GitHub authorization exchange…',
  ]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message].slice(-5));
  };

  useEffect(() => {
    const processAuth = async () => {
      if (isAuthProcessed) return;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code && !isAuthProcessed) {
        setIsAuthProcessed(true);
        addLog(`Authorization code received: ${code.slice(0, 8)}…`);

        try {
          addLog('Requesting session token…');
          const response: ApiResponse<any> = await apiPost(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
            { code }
          );

          const authData = response.data || response;
          if (authData.success && authData.user_name && authData.jwt_token) {
            addLog(`Identity verified: ${authData.user_name}`);
            addLog('Saving session…');

            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user_name', authData.user_name);
            localStorage.setItem('jwt_token', authData.jwt_token);

            addLog('Redirecting…');
            setTimeout(() => {
              router.push('/');
            }, 800);
          } else {
            addLog('Authentication could not be completed.');
            router.push('/login?error=auth_failed');
          }
        } catch (error: any) {
          addLog('Authentication failed.');
          console.error('auth process failed', error);

          const errorPath = error.status === 400
            ? 'invalid_code'
            : error.status === 500
              ? 'server_error'
              : error.message?.includes('Failed to get access token')
                ? 'github_auth_failed'
                : 'unknown';

          router.push(`/login?error=${errorPath}`);
        }
      }
    };

    processAuth();
  }, [router, isAuthProcessed]);

  return (
    <div className="min-h-screen bg-[color:var(--bg-page)] px-6 py-10 text-[color:var(--fg-body)]">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full space-y-8">
          <div className="space-y-4 text-center">
            <div
              className="inline-flex h-16 w-16 items-center justify-center border bg-[color:var(--bg-surface)]"
              style={{ borderColor: "var(--border-hairline)" }}
            >
              <Github className="h-8 w-8 text-[color:var(--fg-strong)]" />
            </div>
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--fg-muted)]">GitHub sign-in</div>
              <h1 className="cathedral-title text-[48px] leading-none">Authenticating</h1>
              <p className="cathedral-copy text-[13px] leading-6">Verifying identity and creating a session.</p>
            </div>
          </div>

          <div
            className="border bg-[color:var(--bg-surface)] p-6"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: "var(--border-hairline)" }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">Session log</div>
              <Loader2 className="h-4 w-4 animate-spin text-[color:var(--fg-muted)]" />
            </div>

            <div className="mt-4 space-y-2">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    'font-mono text-[11px] leading-6',
                    log.includes('verified')
                      ? 'text-[color:var(--fg-strong)]'
                      : log.includes('failed') || log.includes('could not')
                        ? 'text-[color:var(--danger)]'
                        : 'text-[color:var(--fg-body)]'
                  )}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: 'verified' },
              { icon: Cpu, label: 'session' },
              { icon: Activity, label: 'redirect' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 border bg-[color:var(--bg-surface)] px-3 py-4"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <item.icon className="h-4 w-4 text-[color:var(--fg-strong)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
