"use client"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Header from "@/components/header";
import { useState, useEffect, useCallback } from 'react';
import BeatLoader from "react-spinners/BeatLoader";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ChevronDown, Star, GitFork, TrendingUp, Search, Rocket, Plus, ExternalLink, Filter as FilterIcon } from "lucide-react";
import { apiGet } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const sortOptions = [
  { value: 'top', label: 'Top', icon: TrendingUp },
  { value: 'trading', label: 'Trading', icon: TrendingUp },
  { value: 'new', label: 'New', icon: ChevronDown },
];

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

    // Add filter parameters
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

    let sort = 'createdAt';
    let order = 'desc';

    // Determine sort based on sortBy or sortField
    if (sortField) {
      sort = sortField;
      order = sortOrder;
    } else {
      switch (sortBy) {
        case 'top':
          sort = 'market_cap';
          order = 'desc';
          break;
        case 'trading':
          sort = 'market_cap'; // 暂时用 market_cap，后续可以改为 volume
          order = 'desc';
          // TODO: 添加 time filter for 1 hour
          params += '&time=1';
          break;
        case 'new':
          sort = 'createdAt';
          order = 'desc';
          break;
      }
    }

    const url = `${baseUrl}?sort=${sort}&order=${order}&${params}`;
    const response: ApiResponse<Repository[]> = await apiGet(url);
    return {
      repositories: response.data || [],
      pagination: response.pagination
    };
  } catch (error) {
    console.error('Failed to fetch repositories:', error);
    return {
      repositories: [],
      pagination: { total: 0, page: 1, pageSize: limit, hasMore: false, totalPages: 0 }
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
      pagination: response.pagination
    };
  } catch (error) {
    console.error('Failed to search repositories:', error);
    return {
      repositories: [],
      pagination: { total: 0, page: 1, pageSize: 15, hasMore: false, totalPages: 0 }
    };
  }
}

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const [sortBy, setSortBy] = useState('top');
  const [sortField, setSortField] = useState<'market_cap' | 'stars' | 'forks' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(0);
  const [repositoriesCnt, setRepositoriesCnt] = useState(0);
  const [displayedRepos, setDisplayedRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    minStars: '',
    maxStars: '',
    minForks: '',
    maxForks: '',
    timeFilter: '', // hours (1, 24, etc.)
    minMarketCap: '',
    maxMarketCap: '',
    minVolume: '',
    maxVolume: '',
  })

  const searchRepositories = useCallback(async (item: string) => {
    try {
      setLoading(true)
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
      console.log(error)
    }
    setLoading(false)
  }, [sortBy, sortField, sortOrder, currentPage, itemsPerPage, filters]);

  // Fetch repositories and update pagination info
  useEffect(() => {
    const fetchRepos = async () => {
      const result = await fetchRepositories(sortBy, sortField, sortOrder, currentPage, itemsPerPage, filters);
      console.log('fetchedRepos', result);
      setDisplayedRepos(result.repositories);
      setRepositoriesCnt(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    };
    fetchRepos();
  }, [sortBy, sortField, sortOrder, currentPage, itemsPerPage, filters]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setSortField(null); // Clear header sort when using dropdown
    setCurrentPage(1);
  };

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Sort';
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1) ||
        (currentPage <= 3 && i <= maxVisiblePages) ||
        (currentPage >= totalPages - 2 && i >= totalPages - maxVisiblePages + 1)
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="bg-[#1A1A1A] text-xs sm:text-sm text-white hover:bg-[#2A2A2A] hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-none border-0 font-mono"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === currentPage - 2 && currentPage > 3) ||
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis className="text-gray-400" />
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Markets Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border bg-secondary/30">
          <div className="px-6 py-4 border-r border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t('dashboard.total_markets')}</div>
            <div className="text-xl font-bold font-mono tracking-tight">{repositoriesCnt}</div>
          </div>
          <div className="px-6 py-4 border-r border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t('dashboard.global_tvl')}</div>
            <div className="text-xl font-bold font-mono tracking-tight text-emerald-500">1,234.56 SOL</div>
          </div>
          <div className="px-6 py-4 border-r border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t('dashboard.volume_24h')}</div>
            <div className="text-xl font-bold font-mono tracking-tight text-cathedral-400">892.12 SOL</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t('dashboard.active_users')}</div>
            <div className="text-xl font-bold font-mono tracking-tight text-cathedral-400">421</div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card text-card-foreground">
          <div className="flex gap-4 items-center flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('dashboard.search_placeholder')}
                className="bg-secondary/50 border-border focus:ring-0 rounded-sm pl-9 h-9 text-sm font-mono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 text-xs gap-2 border border-border rounded-sm">
                  <FilterIcon className="w-3.5 h-3.5" />
                  {t('dashboard.filter')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 bg-background border-border rounded-sm">
                {/* Filters internal logic kept same for now */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href="/repository/create">
            <Button className="h-9 px-4 bg-cathedral-600 hover:bg-cathedral-700 text-white font-bold rounded-sm gap-2">
              <Rocket className="w-4 h-4" />
              {t('common.launch')}
            </Button>
          </Link>
        </div>

        {/* Main Table Area */}
        <div className="px-6 py-6">
          <div className="terminal-card overflow-hidden">
            <table className="w-full text-left font-mono border-collapse">
              <thead>
                <tr className="bg-secondary/50 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">{t('dashboard.table.repository')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('dashboard.table.ticker')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('dashboard.table.market_cap')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('dashboard.table.stars')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('dashboard.table.forks')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('dashboard.table.price')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('dashboard.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground uppercase text-xs tracking-widest">
                      {t('dashboard.loading')}
                    </td>
                  </tr>
                ) : displayedRepos?.length > 0 ? (
                  displayedRepos.map((repo: Repository) => (
                    <tr
                      key={repo.id}
                      className="border-b border-border hover:bg-secondary/20 cursor-pointer group transition-colors"
                      onClick={() => router.push(`/repository/${repo.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Image
                            src={repo.imgUrl || '/cathedral.png'}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded-sm border border-border grayscale group-hover:grayscale-0 transition-all"
                          />
                          <div>
                            <div className="text-sm font-bold tracking-tight text-foreground">{repo.owner}/{repo.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-xs">{repo.description || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-cathedral-400 font-bold text-xs">{repo.ticker || '-'}</td>
                      <td className="px-4 py-3 text-right text-xs">
                        {repo.marketCap ? (repo.marketCap / LAMPORTS_PER_SOL).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) : '0.00'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5 text-yellow-500/80">
                          <Star size={12} />
                          {repo.stars}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5 text-blue-500/80">
                          <GitFork size={12} />
                          {repo.forks}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-emerald-500">
                        --{/* Live price will go here */}--
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-cathedral-600 hover:text-white border-border rounded-sm transition-all">
                          {t('dashboard.table.trade')}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground uppercase text-xs tracking-widest">
                      {t('dashboard.no_markets')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent className="flex-wrap justify-center gap-2">
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="border-border rounded-none text-xs uppercase"
                      />
                    </PaginationItem>
                  )}
                  {/* Page numbers logic same as before but simplified styling */}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="border-border rounded-none text-xs uppercase"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
