'use client';

import React, { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Maximize2, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-context';

interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CurrentOHLC {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AdvancedTradingChartProps {
  poolAddress: string;
  tokenSymbol?: string;
  marketCap?: number;
  theme?: 'light' | 'dark';
  height?: number;
  width?: string;
}

export default function AdvancedTradingChart({
  poolAddress,
  tokenSymbol = 'TOKEN',
  marketCap = 0,
  theme = 'dark',
  height = 500,
  width = '100%'
}: AdvancedTradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const { t } = useTranslation();

  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [ohlcvData, setOhlcvData] = useState<OHLCVData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [currentOHLC, setCurrentOHLC] = useState<CurrentOHLC | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframes = ['1s', '5s', '30s', '1m', '5m', '15m', '30m', '1h', '4h', '1d'];

  useEffect(() => {
    let isInitialLoad = true;
    const fetchData = async () => {
      if (!poolAddress) return;
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      }
      try {
        let apiInterval = selectedTimeframe;
        if (['1s', '5s', '30s'].includes(selectedTimeframe)) {
          apiInterval = '1m';
        }
        const response: ApiResponse<OHLCVData[]> = await apiGet(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/repositories/pools/${poolAddress}/ohlcv?interval=${apiInterval}&limit=1000`
        );
        if (response.data && response.data.length > 0) {
          setOhlcvData(response.data);
          const latestCandle = response.data[response.data.length - 1];
          setCurrentPrice(latestCandle.close);
          setCurrentOHLC({
            time: new Date(latestCandle.time * 1000).toLocaleString(),
            open: latestCandle.open,
            high: latestCandle.high,
            low: latestCandle.low,
            close: latestCandle.close,
            volume: latestCandle.volume,
          });
          if (response.data.length > 1) {
            const firstCandle = response.data[0];
            const change = ((latestCandle.close - firstCandle.open) / firstCandle.open) * 100;
            setPriceChange24h(change);
          }
        } else if (isInitialLoad) {
          setError(t('chart.no_data'));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isInitialLoad) setError(t('chart.load_failed'));
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
          isInitialLoad = false;
        }
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, [poolAddress, selectedTimeframe, t]);

  useEffect(() => {
    if (!chartContainerRef.current || ohlcvData.length === 0) return;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries } = await import('lightweight-charts');
        if (chartInstanceRef.current) {
          chartInstanceRef.current.remove();
          chartInstanceRef.current = null;
        }
        if (!chartContainerRef.current) return;

        const containerWidth = chartContainerRef.current.clientWidth;

        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { color: '#0A0A0A' },
            textColor: '#D9D9D9',
          },
          grid: {
            vertLines: { color: '#111', style: 1 },
            horzLines: { color: '#111', style: 1 },
          },
          width: containerWidth,
          height: height - 120, // Adjusted to reserve space for headers
          timeScale: {
            timeVisible: true,
            secondsVisible: ['1s', '5s', '30s'].includes(selectedTimeframe),
            borderColor: '#1A1A1A',
          },
          rightPriceScale: {
            borderColor: '#1A1A1A',
            scaleMargins: { top: 0.1, bottom: 0.1 },
          },
          crosshair: {
            mode: 1,
            vertLine: { width: 1, color: '#333', style: 3 },
            horzLine: { width: 1, color: '#333', style: 3 },
          },
        });

        chartInstanceRef.current = chart;
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#f43f5e',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#f43f5e',
        });
        candleSeriesRef.current = candleSeries;

        const candleData = ohlcvData.map(d => ({
          time: d.time as any,
          open: Number(d.open),
          high: Number(d.high),
          low: Number(d.low),
          close: Number(d.close),
        }));
        candleSeries.setData(candleData);

        chart.subscribeCrosshairMove((param) => {
          if (param.time && param.seriesData.get(candleSeries)) {
            const data = param.seriesData.get(candleSeries) as any;
            setCurrentOHLC({
              time: new Date((param.time as number) * 1000).toLocaleString(),
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: 0,
            });
          }
        });

        chart.timeScale().fitContent();

        const handleResize = () => {
          if (chartContainerRef.current && chartInstanceRef.current) {
            chartInstanceRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      } catch (err: any) {
        console.error('Error creating chart:', err);
        setError(`${t('chart.create_failed')}: ${err?.message || 'Unknown error'}`);
      }
    };
    initChart();
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [ohlcvData, height, selectedTimeframe, t]);

  const toggleFullscreen = () => {
    if (!chartContainerRef.current?.parentElement) return;
    if (!document.fullscreenElement) {
      chartContainerRef.current.parentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (error && !isLoading) {
    return (
      <div style={{ height: `${height}px`, width }} className="bg-[#0A0A0A] border border-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">⚠️ {error}</p>
          <button onClick={() => window.location.reload()} className="text-blue-400 hover:text-blue-300 text-sm underline">{t('chart.retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="flex flex-col bg-[#0A0A0A] space-y-2">
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">{tokenSymbol}</span>
            {currentPrice !== null && (
              <>
                <span className="text-lg text-white">{currentPrice.toFixed(currentPrice < 0.001 ? 8 : 6)} SOL</span>
                <span className={`text-sm font-semibold ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
                {marketCap > 0 && (
                  <span className="text-xs sm:text-sm text-gray-400">
                    MC: {marketCap >= 1000000 ? `${(marketCap / 1000000).toFixed(2)}M` : marketCap >= 1000 ? `${(marketCap / 1000).toFixed(2)}K` : marketCap.toFixed(2)} SOL
                  </span>
                )}
              </>
            )}
          </div>
          <button onClick={toggleFullscreen} className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        {currentOHLC && (
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400 overflow-x-auto">
            <span>O <span className="text-white">{currentOHLC.open.toFixed(6)}</span></span>
            <span>H <span className="text-green-400">{currentOHLC.high.toFixed(6)}</span></span>
            <span>L <span className="text-red-400">{currentOHLC.low.toFixed(6)}</span></span>
            <span>C <span className="text-white">{currentOHLC.close.toFixed(6)}</span></span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-800 overflow-x-auto">
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${selectedTimeframe === tf ? 'bg-cathedral-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
          <TrendingUp className="w-3 h-3 text-cathedral-500/50" />
          <span>{ohlcvData.length} {t('chart.candles')}</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cathedral-500"></div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
