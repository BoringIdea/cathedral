import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/solana-provider";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Home, Check, User, FileText, Github, Menu, Wallet, Terminal, Rocket, BarChart2, BookOpen, Shield } from "lucide-react";
import { apiGet } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { usePathname } from "next/navigation";

import { useTranslation } from '@/lib/i18n-context';

export default function Header() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useTranslation();
  const [githubLogin, setGithubLogin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [boundWallet, setBoundWallet] = useState<string | null>(null);

  // Dynamic Header Content
  const getHeaderContent = () => {
    if (pathname === "/") {
      return { main: t('header.system'), sub: t('header.markets'), icon: BarChart2 };
    }
    if (pathname.includes("/repository/create")) {
      return { main: t('header.protocol'), sub: t('header.launch'), icon: Rocket };
    }
    if (pathname.includes("/repository/") && !pathname.includes("/create")) {
      return { main: t('header.trade'), sub: t('header.repository'), icon: Terminal };
    }
    if (pathname.includes("/litepaper")) {
      return { main: t('header.docs'), sub: t('header.litepaper'), icon: BookOpen };
    }
    if (pathname.includes("/user")) {
      return { main: t('header.identity'), sub: t('header.profile'), icon: Shield };
    }
    return { main: t('header.system'), sub: t('header.terminal'), icon: Terminal };
  };

  const { main, sub, icon: Icon } = getHeaderContent();

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
      const response: ApiResponse<any> = await apiGet(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
        {
          'Authorization': `Bearer ${jwt}`
        }
      );
      if (response.data) {
        setBoundWallet(response.data.wallet || null);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
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
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ""
      }&redirect_uri=${encodeURIComponent(
        process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI || ""
      )}&scope=user`;
  };

  return (
    <div className="flex justify-between items-center w-full px-6 h-16 bg-background border-b border-border font-mono sticky top-0 z-50">
      {/* Left Section: Breadcrumbs or Active Page */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-secondary/50 rounded-sm border border-border/50">
          <Icon size={14} className="text-cathedral-400" />
        </div>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{main}</span>
        <div className="h-3 w-px bg-border/50" />
        <span className="text-xs font-black text-foreground uppercase tracking-wider italic">{sub}</span>
      </div>

      {/* Right Section: Language Switch & Auth & Wallet */}
      <div className="flex items-center gap-3">
        <div className="flex items-center p-1 bg-secondary/30 border border-border/50 rounded-sm">
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "px-2 py-1 text-[9px] font-black tracking-widest transition-all rounded-sm",
              language === 'en' ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('zh')}
            className={cn(
              "px-2 py-1 text-[9px] font-black tracking-widest transition-all rounded-sm",
              language === 'zh' ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            中文
          </button>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {githubLogin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 text-xs font-mono gap-2 border border-border rounded-sm hover:bg-secondary transition-colors">
                <Github size={14} />
                {userName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border rounded-sm">
              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                {t('header.signed_in_as')} <span className="text-foreground font-semibold">{userName}</span>
              </div>
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={login}
            variant="outline"
            className="h-9 px-3 text-xs font-mono gap-2 border-border rounded-sm hover:bg-secondary transition-colors"
          >
            <Github size={14} />
            {t('header.login')}
          </Button>
        )}
        <div className="h-6 w-px bg-border mx-1" />
        <WalletButton />
      </div>
    </div>
  );
}
