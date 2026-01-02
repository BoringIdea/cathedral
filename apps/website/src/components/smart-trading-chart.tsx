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
            <p className="text-gray-400 mb-2">{t('chart.loading_price')}</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      );
    }

    const { currentPrice, change24h, volume24h } = birdeyePriceData;
    const isPositive = change24h >= 0;
    const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

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
      <div className="h-full flex flex-col bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden">
        {/* Chart Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center space-x-4">
            {/* Timeframe buttons */}
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1 text-xs rounded transition-colors ${selectedTimeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {/* Chart type indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-400">Line</span>
            </div>
            {/* Indicators button */}
            <button className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
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
              stroke="#6b7280"
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
          <div className="absolute right-4 top-4 text-xs text-gray-400">
            <div>High: ${maxPrice.toFixed(8)}</div>
            <div>Low: ${minPrice.toFixed(8)}</div>
            <div className="mt-2">Current: ${currentPrice.toFixed(8)}</div>
            <div className="mt-2 text-blue-400">Timeframe: {selectedTimeframe}</div>
            <div className="mt-1">Data Points: {filteredPriceHistory.length}</div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between p-3 border-t border-gray-700 bg-[#1a1a1a]">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400">Volume: ${volume24h.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              %
            </button>
            <button className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              log
            </button>
            <button className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
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
        className="bg-[#1A1A1A] rounded-lg flex items-center justify-center border border-gray-700"
      >
        <div className="text-center">
          <p className="text-red-400 mb-4">{t('chart.load_failed')}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-xl font-bold text-white">{tokenSymbol}</span>
            <span className={`ml-2 text-lg ${birdeyePriceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${birdeyePriceData.currentPrice.toFixed(8)}
            </span>
            <span className={`ml-2 text-sm ${birdeyePriceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {birdeyePriceData.change24h >= 0 ? '+' : ''}{birdeyePriceData.change24h.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm text-gray-400">
            <div>24h Volume</div>
            <div className="text-white">${birdeyePriceData.volume24h.toLocaleString()}</div>
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
          className="bg-[#1A1A1A] rounded-lg border border-gray-700"
        >
          {renderCustomChart()}
        </div>

        {isLoading && (
          <div
            style={{ height: `${height}px`, width }}
            className="absolute inset-0 bg-[#1A1A1A] rounded-lg flex items-center justify-center border border-gray-700 z-10"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">{t('chart.loading_price_data')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
