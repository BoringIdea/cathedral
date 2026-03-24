"use client";

import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/solana-provider";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BookOpen, Github, Rocket, TrendingUp, Wallet } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { useTranslation } from "@/lib/i18n-context";

export default function Header() {
  const { language, setLanguage, t } = useTranslation();
  const pathname = usePathname();
  const [githubLogin, setGithubLogin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [boundWallet, setBoundWallet] = useState<string | null>(null);

  const sectionMeta = (() => {
    if (pathname.startsWith("/repository/create")) {
      return {
        icon: Rocket,
        group: language === "zh" ? "交易" : "Trade",
        label: language === "zh" ? "启动" : "Launch",
      };
    }
    if (pathname.startsWith("/repository/")) {
      return {
        icon: TrendingUp,
        group: language === "zh" ? "交易" : "Trade",
        label: language === "zh" ? "仓库" : "Repository",
      };
    }
    if (pathname.startsWith("/litepaper")) {
      return {
        icon: BookOpen,
        group: language === "zh" ? "协议" : "Protocol",
        label: language === "zh" ? "白皮书" : "Litepaper",
      };
    }
    if (pathname.startsWith("/user")) {
      return {
        icon: Wallet,
        group: language === "zh" ? "账户" : "Account",
        label: language === "zh" ? "资料" : "Profile",
      };
    }
    return {
      icon: TrendingUp,
      group: language === "zh" ? "交易" : "Trade",
      label: language === "zh" ? "市场" : "Markets",
    };
  })();

  const SectionIcon = sectionMeta.icon;

  useEffect(() => {
    const storedUserName = localStorage.getItem("user_name");
    if (storedUserName) {
      setUserName(storedUserName);
      setGithubLogin(true);

      const jwt = localStorage.getItem("jwt_token");
      if (jwt) {
        fetchUserInfo(jwt);
      }
    }
  }, []);

  const fetchUserInfo = async (jwt: string) => {
    try {
      const response: ApiResponse<any> = await apiGet(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
        Authorization: `Bearer ${jwt}`,
      });
      if (response.data) {
        setBoundWallet(response.data.wallet || null);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_name");
    setGithubLogin(false);
    setUserName(null);
    setBoundWallet(null);
  };

  const login = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ""}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI || "")}&scope=user`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex h-[58px] items-center justify-between px-6">
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex h-9 w-9 items-center justify-center border border-border bg-[color:var(--bg-surface)]">
            <SectionIcon className="h-4 w-4 text-[color:var(--fg-muted)]" />
          </div>
          <span>{sectionMeta.group}</span>
          <span className="opacity-40">/</span>
          <span className="text-[color:var(--fg-strong)]">{sectionMeta.label}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-1 border border-border bg-white px-1 py-1 md:flex">
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "px-2 py-1 text-[10px] uppercase tracking-[0.18em] font-mono transition-colors",
                language === "en" ? "border border-border bg-[color:var(--bg-muted)] text-[color:var(--fg-strong)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("zh")}
              className={cn(
                "px-2 py-1 text-[10px] uppercase tracking-[0.18em] font-mono transition-colors",
                language === "zh" ? "border border-border bg-[color:var(--bg-muted)] text-[color:var(--fg-strong)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              中文
            </button>
          </div>

          {githubLogin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 px-3">
                  <Github size={14} />
                  {userName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-border bg-[color:var(--bg-surface)]">
                <div className="border-b border-border px-3 py-2 text-[11px] font-mono text-muted-foreground">
                  {t("header.signed_in_as")} <span className="text-foreground">{userName}</span>
                </div>
                {boundWallet && <div className="border-b border-border px-3 py-2 text-[11px] font-mono text-muted-foreground">{boundWallet}</div>}
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  {t("header.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={login} variant="outline" size="sm" className="gap-2 px-3">
              <Github size={14} />
              {t("header.login")}
            </Button>
          )}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
