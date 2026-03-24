"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowUpRight, Github, Package, Wallet } from "lucide-react";

import Header from "@/components/header";
import { apiGet } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n-context";

async function getDeployedRepositories(jwt: string) {
  try {
    const response: ApiResponse<any[]> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/users/me/deployed`,
      { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
    );
    return response.data || [];
  } catch (error: any) {
    if (error.status === 401) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_name");
    }
    return [];
  }
}

async function getHoldingRepositories(publicKey: string) {
  try {
    const response: ApiResponse<any[]> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/users/${publicKey}/holdings`
    );
    return response.data || [];
  } catch (error) {
    return [];
  }
}

export default function UserPage() {
  const { publicKey } = useWallet();
  const [userName, setUserName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deployed" | "holdings">("holdings");
  const [jwt, setJwt] = useState<string | null>(null);
  const [deployedRepositories, setDeployedRepositories] = useState<any[]>([]);
  const [holdingRepositories, setHoldingRepositories] = useState<any[]>([]);
  const { t, language } = useTranslation();

  useEffect(() => {
    setUserName(localStorage.getItem("user_name"));
    setJwt(localStorage.getItem("jwt_token"));
  }, []);

  useEffect(() => {
    if (jwt) getDeployedRepositories(jwt).then(setDeployedRepositories);
  }, [jwt]);

  useEffect(() => {
    if (publicKey) getHoldingRepositories(publicKey.toString()).then(setHoldingRepositories);
  }, [publicKey]);

  const tabs = [
    { id: "holdings" as const, label: t("profile.portfolio_assets"), count: holdingRepositories.length },
    { id: "deployed" as const, label: t("profile.deployed_repository"), count: deployedRepositories.length },
  ];

  return (
    <div className="cathedral-shell min-h-full text-foreground">
      <Header />

      <main className="px-6 py-8 md:py-10">
        <section className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="cathedral-kicker">Account Registry</div>
            <h1 className="cathedral-title">{userName || "Anonymous"}</h1>
            <div className="flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.16em] font-mono text-[color:var(--fg-muted)]">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>{userName || "Not linked"}</span>
              </div>
              <div className="flex items-center gap-2 max-w-full">
                <Wallet className="h-4 w-4" />
                <span className="truncate">{publicKey?.toString() || "Wallet unavailable"}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            <div className="bg-[color:var(--bg-surface)] px-4 py-5">
              <div className="cathedral-kicker mb-2">Holdings</div>
              <div className="cathedral-num text-[20px]">{holdingRepositories.length}</div>
            </div>
            <div className="bg-[color:var(--bg-surface)] px-4 py-5">
              <div className="cathedral-kicker mb-2">Deployments</div>
              <div className="cathedral-num text-[20px]">{deployedRepositories.length}</div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2 border-b border-border py-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "border px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-mono transition-colors",
                activeTab === tab.id
                  ? "border-[color:var(--accent-brand)] bg-[color:var(--accent-brand)] text-[color:var(--bg-page)]"
                  : "border-border bg-[color:var(--bg-surface)] text-[color:var(--fg-muted)] hover:text-[color:var(--fg-strong)]"
              )}
            >
              {tab.label} [{tab.count}]
            </button>
          ))}
        </section>

        <section className="py-6">
          {activeTab === "holdings" ? (
            <div className="terminal-card overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-[color:var(--bg-muted)]">
                    <th className="cathedral-kicker px-4 py-3">{t("header.repository")}</th>
                    <th className="cathedral-kicker px-4 py-3">{t("profile.repository_id")}</th>
                    <th className="cathedral-kicker px-4 py-3 text-right">{t("profile.shares_owned")}</th>
                    <th className="cathedral-kicker px-4 py-3 text-right">{t("profile.valuation")} (SOL)</th>
                    <th className="cathedral-kicker px-4 py-3 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingRepositories.length > 0 ? (
                    holdingRepositories.map((repo) => (
                      <tr key={repo.id} className="border-b border-border transition-colors hover:bg-[color:var(--bg-muted)]">
                        <td className="px-4 py-4">
                          <div className="text-[24px] leading-none tracking-[-0.02em] text-[color:var(--fg-strong)]">{repo.name}</div>
                        </td>
                        <td className="px-4 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--fg-muted)]">
                          {repo.id}
                        </td>
                        <td className="cathedral-num px-4 py-4 text-right text-[12px]">{repo.balance}</td>
                        <td className="cathedral-num px-4 py-4 text-right text-[12px]">--</td>
                        <td className="px-4 py-4 text-right">
                          <Link href={`/repository/${repo.id}`} className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--fg-strong)] hover:text-[color:var(--fg-muted)]">
                            <ArrowUpRight className="h-4 w-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <div className="cathedral-kicker">No holdings detected.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {deployedRepositories.length > 0 ? (
                deployedRepositories.map((repo) => (
                  <Link key={repo.id} href={`/repository/${repo.id}`} className="terminal-card flex min-h-[180px] flex-col justify-between p-5 hover:bg-[color:var(--bg-muted)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="cathedral-kicker mb-2">Deployment</div>
                        <h2 className="cathedral-h2">{repo.name}</h2>
                      </div>
                      <Package className="h-5 w-5 text-[color:var(--fg-muted)]" />
                    </div>
                    <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--fg-muted)]">
                      <div>{repo.id}</div>
                      <div>{new Date(repo.createdAt).toLocaleDateString()}</div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="cathedral-panel col-span-full px-4 py-16 text-center">
                  <div className="cathedral-kicker">No deployment records found.</div>
                  <Link href="/repository/create" className="mt-4 inline-flex font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--fg-strong)] underline underline-offset-4">
                    Start A Launch
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
