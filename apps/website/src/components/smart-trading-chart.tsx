'use client';

import { useEffect, useRef, useState } from 'react';
import { getBirdeyePriceData } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n-context';

interface SmartTradingChartProps {
  tokenMint: string;
  tokenSymbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: string;
}

export default function SmartTradingChart({
  tokenMint,
  tokenSymbol = 'TOKEN',
  theme = 'dark',
  height = 500,
  width = '100%'
}: SmartTradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [birdeyePriceData, setBirdeyePriceData] = useState<{
    currentPrice: number;
    change24h: number;
    volume24h: number;
    priceHistory: Array<{ timestamp: number; price: number }>;
  } | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const { t } = useTranslation();

  // Fetch Birdeye data
  useEffect(() => {
    const fetchPriceData = async () => {
      if (!tokenMint) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getBirdeyePriceData(tokenMint);
        if (data) {
          setBirdeyePriceData(data);
        } else {
          setError('No price data available');
        }
      } catch (err) {
        console.error('Error fetching Birdeye price data:', err);
        setError('Failed to load price data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceData();
  }, [tokenMint]);

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    console.log('Timeframe changed to:', timeframe);
  };

  // Filter data based on selected timeframe
  const getFilteredData = () => {
    if (!birdeyePriceData || !birdeyePriceData.priceHistory.length) {
      return [];
    }

    const now = Date.now();
    let timeRange = 0;

    // Calculate time range based on selected timeframe
    switch (selectedTimeframe) {
      case '1m':
        timeRange = 60 * 1000; // 1 minute
        break;
      case '5m':
        timeRange = 5 * 60 * 1000; // 5 minutes
        break;
      case '15m':
        timeRange = 15 * 60 * 1000; // 15 minutes
        break;
      case '1h':
        timeRange = 60 * 60 * 1000; // 1 hour
        break;
      case '4h':
        timeRange = 4 * 60 * 60 * 1000; // 4 hours
        break;
      case '1D':
        timeRange = 24 * 60 * 60 * 1000; // 1 day
        break;
      default:
        timeRange = 5 * 60 * 1000; // default to 5 minutes
    }

    // Filter data points within the time range
    const filteredData = birdeyePriceData.priceHistory.filter(point => {
      return (now - point.timestamp) <= timeRange;
    });

    // If we don't have enough data for the selected timeframe, return all data
    if (filteredData.length < 2) {
      return birdeyePriceData.priceHistory;
    }

    return filteredData;
  };

  // Render custom chart with Birdeye data
  const renderCustomChart = () => {
    if (!birdeyePriceData || !birdeyePriceData.priceHistory.length) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="mb-2 text-[color:var(--fg-muted)]">{t('chart.loading_price')}</p>
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-[color:var(--fg-strong)]"></div>
          </div>
        </div>
      );
    }

    const { currentPrice, change24h, volume24h } = birdeyePriceData;
    const isPositive = change24h >= 0;
    const changeColor = isPositive ? 'text-[color:var(--fg-strong)]' : 'text-[color:var(--danger)]';

    // Get filtered data based on selected timeframe
    const filteredPriceHistory = getFilteredData();

    // Prepare chart data
    const prices = filteredPriceHistory.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // Avoid division by zero

    // Timeframes
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D'];

    return (
      <div className="h-full overflow-hidden border border-border bg-[color:var(--bg-surface)]">
        {/* Chart Header */}
        <div className="flex items-center justify-between border-b border-border bg-[color:var(--bg-muted)] px-3 py-3">
          <div className="flex items-center space-x-4">
            {/* Timeframe buttons */}
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`border px-3 py-1 text-xs transition-colors ${selectedTimeframe === tf ? 'border-border bg-[color:var(--fg-strong)] text-[color:var(--bg-surface)]' : 'border-transparent bg-transparent text-[color:var(--fg-muted)] hover:border-border hover:bg-[color:var(--bg-muted)] hover:text-[color:var(--fg-strong)]'}`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {/* Chart type indicator */}
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 border border-border bg-[color:var(--fg-strong)]"></div>
              <span className="text-xs text-[color:var(--fg-muted)]">Line</span>
            </div>
            {/* Indicators button */}
            <button className="border border-border bg-[color:var(--bg-surface)] px-3 py-1 text-xs text-[color:var(--fg-body)] transition-colors hover:bg-[color:var(--bg-muted)]">
              fₓ Indicators
            </button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative p-4">
          <svg
            className="w-full h-full"
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#2a2a2a" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Price line */}
            <polyline
              fill="none"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth="2"
              points={filteredPriceHistory.map((point, index) => {
                const x = (index / (filteredPriceHistory.length - 1)) * 800;
                const y = 300 - ((point.price - minPrice) / priceRange) * 250 - 25;
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Current price line */}
            <line
              x1="0"
              y1={300 - ((currentPrice - minPrice) / priceRange) * 250 - 25}
              x2="800"
              y2={300 - ((currentPrice - minPrice) / priceRange) * 250 - 25}
              stroke="#8d867e"
              strokeWidth="1"
              strokeDasharray="5,5"
            />

            {/* Price dots */}
            {filteredPriceHistory.map((point, index) => {
              const x = (index / (filteredPriceHistory.length - 1)) * 800;
              const y = 300 - ((point.price - minPrice) / priceRange) * 250 - 25;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={isPositive ? "#10b981" : "#ef4444"}
                />
              );
            })}
          </svg>

          {/* Price labels */}
          <div className="absolute right-4 top-4 text-xs text-[color:var(--fg-muted)]">
            <div>High: ${maxPrice.toFixed(8)}</div>
            <div>Low: ${minPrice.toFixed(8)}</div>
            <div className="mt-2">Current: ${currentPrice.toFixed(8)}</div>
            <div className="mt-2 text-[color:var(--fg-strong)]">Timeframe: {selectedTimeframe}</div>
            <div className="mt-1">Data Points: {filteredPriceHistory.length}</div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between border-t border-border bg-[color:var(--bg-muted)] px-3 py-3">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-[color:var(--fg-muted)]">Volume: ${volume24h.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="border border-border bg-[color:var(--bg-surface)] px-2 py-1 text-xs text-[color:var(--fg-body)] transition-colors hover:bg-[color:var(--bg-muted)]">
              %
            </button>
            <button className="border border-border bg-[color:var(--bg-surface)] px-2 py-1 text-xs text-[color:var(--fg-body)] transition-colors hover:bg-[color:var(--bg-muted)]">
              log
            </button>
            <button className="border border-border bg-[color:var(--bg-surface)] px-2 py-1 text-xs text-[color:var(--fg-body)] transition-colors hover:bg-[color:var(--bg-muted)]">
              auto
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div
        style={{ height: `${height}px`, width }}
        className="flex items-center justify-center border border-border bg-[color:var(--bg-surface)]"
      >
        <div className="text-center">
          <p className="mb-4 text-[color:var(--danger)]">{t('chart.load_failed')}</p>
          <button
            onClick={() => window.location.reload()}
            className="border border-border bg-[color:var(--fg-strong)] px-4 py-2 text-[color:var(--bg-surface)] transition-colors hover:bg-[color:var(--fg-body)]"
          >
            {t('chart.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Birdeye price info - moved above chart, not overlapping */}
      {birdeyePriceData && (
        <div className="flex items-center justify-between border border-border bg-[color:var(--bg-surface)] p-4">
          <div>
            <span className="cathedral-h2 text-[28px]">{tokenSymbol}</span>
            <span className={`ml-2 text-lg ${birdeyePriceData.change24h >= 0 ? 'text-[color:var(--fg-strong)]' : 'text-[color:var(--danger)]'}`}>
              ${birdeyePriceData.currentPrice.toFixed(8)}
            </span>
            <span className={`ml-2 text-sm ${birdeyePriceData.change24h >= 0 ? 'text-[color:var(--fg-strong)]' : 'text-[color:var(--danger)]'}`}>
              {birdeyePriceData.change24h >= 0 ? '+' : ''}{birdeyePriceData.change24h.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm text-[color:var(--fg-muted)]">
            <div>24h Volume</div>
            <div className="text-[color:var(--fg-strong)]">${birdeyePriceData.volume24h.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Custom Chart with Birdeye Data */}
      <div className="relative">
        <div
          ref={containerRef}
          style={{
            height: `${height}px`,
            width
          }}
          className="border border-border bg-[color:var(--bg-surface)]"
        >
          {renderCustomChart()}
        </div>

        {isLoading && (
          <div
            style={{ height: `${height}px`, width }}
            className="absolute inset-0 z-10 flex items-center justify-center border border-border bg-[color:var(--bg-surface)]/90"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--fg-strong)]"></div>
              <p className="text-[color:var(--fg-muted)]">{t('chart.loading_price_data')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
