"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ChevronDown, ExternalLink, Filter as FilterIcon, GitFork, Rocket, Search, Star, TrendingUp } from "lucide-react";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
import { useTranslation } from "@/lib/i18n-context";
import type { ApiResponse } from "@/types/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Repository {
  id: string;
  link: string;
  name: string;
  stars: number;
  forks: number;
  owner: string;
  imgUrl: string;
  ticker?: string;
  description: string;
  pool: string;
  supply: number;
  totalVolume?: number;
  marketCap?: number;
  isFork?: boolean;
}

async function fetchRepositories(
  sortBy: string,
  sortField: string | null,
  sortOrder: string,
  page: number,
  limit: number,
  filters?: any
): Promise<{ repositories: Repository[]; pagination: any }> {
  try {
    const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories`;
    let params = `page=${page}&limit=${limit}`;

    if (filters) {
      if (filters.minStars) params += `&minStars=${filters.minStars}`;
      if (filters.maxStars) params += `&maxStars=${filters.maxStars}`;
      if (filters.minForks) params += `&minForks=${filters.minForks}`;
      if (filters.maxForks) params += `&maxForks=${filters.maxForks}`;
      if (filters.timeFilter) params += `&time=${filters.timeFilter}`;
      if (filters.minMarketCap) params += `&minMarketCap=${Number(filters.minMarketCap) * LAMPORTS_PER_SOL}`;
      if (filters.maxMarketCap) params += `&maxMarketCap=${Number(filters.maxMarketCap) * LAMPORTS_PER_SOL}`;
      if (filters.minVolume) params += `&minVolume=${Number(filters.minVolume) * LAMPORTS_PER_SOL}`;
      if (filters.maxVolume) params += `&maxVolume=${Number(filters.maxVolume) * LAMPORTS_PER_SOL}`;
    }

    let sort = "createdAt";
    let order = "desc";

    if (sortField) {
      sort = sortField;
      order = sortOrder;
    } else {
      switch (sortBy) {
        case "top":
          sort = "market_cap";
          order = "desc";
          break;
        case "trading":
          sort = "market_cap";
          order = "desc";
          params += "&time=1";
          break;
        case "new":
          sort = "createdAt";
          order = "desc";
          break;
      }
    }

    const url = `${baseUrl}?sort=${sort}&order=${order}&${params}`;
    const response: ApiResponse<Repository[]> = await apiGet(url);
    return {
      repositories: response.data || [],
      pagination: response.pagination,
    };
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return {
      repositories: [],
      pagination: { total: 0, page: 1, pageSize: limit, hasMore: false, totalPages: 0 },
    };
  }
}

async function fetchSearchRepositories(item: string): Promise<{ repositories: Repository[]; pagination: any }> {
  try {
    const response: ApiResponse<Repository[]> = await apiGet(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/search?item=${item}`
    );
    return {
      repositories: response.data || [],
      pagination: response.pagination,
    };
  } catch (error) {
    console.error("Failed to search repositories:", error);
    return {
      repositories: [],
      pagination: { total: 0, page: 1, pageSize: 15, hasMore: false, totalPages: 0 },
    };
  }
}

export default function Home() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [sortBy, setSortBy] = useState("top");
  const [sortField, setSortField] = useState<"market_cap" | "stars" | "forks" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(0);
  const [repositoriesCnt, setRepositoriesCnt] = useState(0);
  const [displayedRepos, setDisplayedRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters] = useState({
    minStars: "",
    maxStars: "",
    minForks: "",
    maxForks: "",
    timeFilter: "",
    minMarketCap: "",
    maxMarketCap: "",
    minVolume: "",
    maxVolume: "",
  });

  const searchRepositories = useCallback(
    async (item: string) => {
      try {
        setLoading(true);
        if (!item) {
          const result = await fetchRepositories(sortBy, sortField, sortOrder, currentPage, itemsPerPage, filters);
          setDisplayedRepos(result.repositories);
          setRepositoriesCnt(result.pagination.total);
          setTotalPages(result.pagination.totalPages);
          return;
        }
        const result = await fetchSearchRepositories(item);
        setDisplayedRepos(result.repositories);
        setRepositoriesCnt(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, sortField, sortOrder, currentPage, itemsPerPage, filters]
  );

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      const result = await fetchRepositories(sortBy, sortField, sortOrder, currentPage, itemsPerPage, filters);
      setDisplayedRepos(result.repositories);
      setRepositoriesCnt(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      setLoading(false);
    };
    fetchRepos();
  }, [sortBy, sortField, sortOrder, currentPage, itemsPerPage, filters]);

  const metrics = [
    { label: t("dashboard.total_markets"), value: String(repositoriesCnt) },
    { label: t("dashboard.global_tvl"), value: "1,234.56 SOL" },
    { label: t("dashboard.volume_24h"), value: "892.12 SOL" },
    { label: t("dashboard.active_users"), value: "421" },
  ];

  const sortOptions = useMemo(
    () => [
      { value: "top", label: language === "zh" ? "热门" : "Top", icon: TrendingUp },
      { value: "trading", label: language === "zh" ? "交易中" : "Trading", icon: TrendingUp },
      { value: "new", label: language === "zh" ? "最新" : "New", icon: ChevronDown },
    ],
    [language]
  );

  const getSortLabel = () =>
    sortOptions.find((opt) => opt.value === sortBy)?.label || (language === "zh" ? "排序" : "Sort");

  return (
    <div className="cathedral-shell min-h-full text-foreground">
      <Header />

      <main className="px-6 py-8 md:py-10">
        <section className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-5">
            <h1 className="cathedral-title text-balance">
              {language === "zh" ? "让公共代码库成为可交易市场。" : "Fund public codebases like living markets."}
            </h1>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/repository/create">
                <Button className="gap-2 px-5">
                  <Rocket className="h-4 w-4" />
                  {t("common.launch")}
                </Button>
              </Link>
              <Button variant="outline" className="gap-2 px-5" onClick={() => searchRepositories(searchTerm)}>
                <Search className="h-4 w-4" />
                {t("dashboard.search_placeholder")}
              </Button>
            </div>
          </div>

          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-[color:var(--bg-surface)] px-4 py-5">
                <div className="cathedral-kicker mb-2">{metric.label}</div>
                <div className="cathedral-num text-[20px]">{metric.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 border-b border-border py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("dashboard.search_placeholder")}
                className="h-11 border-border bg-[color:var(--bg-surface)] pl-10 text-[11px] uppercase tracking-[0.08em]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void searchRepositories(searchTerm);
                  }
                }}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 px-4">
                  <TrendingUp className="h-4 w-4" />
                  {getSortLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 border-border bg-[color:var(--bg-surface)]">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setSortField(null);
                      setCurrentPage(1);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] uppercase tracking-[0.16em] font-mono hover:bg-secondary"
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="gap-2 px-4">
              <FilterIcon className="h-4 w-4" />
              {t("dashboard.filter")}
            </Button>
          </div>
        </section>

        <section className="py-6">
          <div className="terminal-card overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-[color:var(--bg-muted)]">
                  <th className="cathedral-kicker px-4 py-3">{t("dashboard.table.repository")}</th>
                  <th className="cathedral-kicker px-4 py-3 text-right">{t("dashboard.table.ticker")}</th>
                  <th className="cathedral-kicker px-4 py-3 text-right">{t("dashboard.table.market_cap")}</th>
                  <th className="cathedral-kicker px-4 py-3 text-right">{t("dashboard.table.stars")}</th>
                  <th className="cathedral-kicker px-4 py-3 text-right">{t("dashboard.table.forks")}</th>
                  <th className="cathedral-kicker px-4 py-3 text-right">{t("dashboard.table.price")}</th>
                  <th className="cathedral-kicker px-4 py-3 text-right">{t("dashboard.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="cathedral-kicker">{t("dashboard.loading")}</div>
                    </td>
                  </tr>
                ) : displayedRepos.length > 0 ? (
                  displayedRepos.map((repo) => (
                    <tr
                      key={repo.id}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-[color:var(--bg-muted)]"
                      onClick={() => router.push(`/repository/${repo.id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={repo.imgUrl || "/cathedral.png"}
                            alt=""
                            width={36}
                            height={36}
                            className="border border-border object-cover grayscale"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-[22px] leading-none tracking-[-0.02em] text-[color:var(--fg-strong)]">
                              {repo.owner}/{repo.name}
                            </div>
                            <div className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              {repo.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="cathedral-num px-4 py-4 text-right text-[12px]">{repo.ticker || "-"}</td>
                      <td className="cathedral-num px-4 py-4 text-right text-[12px]">
                        {repo.marketCap
                          ? (repo.marketCap / LAMPORTS_PER_SOL).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "0.00"}
                      </td>
                      <td className="px-4 py-4 text-right text-[12px]">
                        <span className="inline-flex items-center justify-end gap-1 font-mono text-[color:var(--fg-body)]">
                          <Star size={12} />
                          {repo.stars}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-[12px]">
                        <span className="inline-flex items-center justify-end gap-1 font-mono text-[color:var(--fg-body)]">
                          <GitFork size={12} />
                          {repo.forks}
                        </span>
                      </td>
                      <td className="cathedral-num px-4 py-4 text-right text-[12px] price-up">--</td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="outline" size="sm" className="gap-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t("dashboard.table.trade")}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="cathedral-kicker">{t("dashboard.no_markets")}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent className="gap-2">
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="border-border rounded-none font-mono text-[11px] uppercase tracking-[0.16em]"
                      />
                    </PaginationItem>
                  )}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="border-border rounded-none font-mono text-[11px] uppercase tracking-[0.16em]"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
