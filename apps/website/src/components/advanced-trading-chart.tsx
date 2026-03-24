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

        const chartChromeHeight = 104;
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { color: '#0B0B0B' },
            textColor: '#D9D9D9',
          },
          grid: {
            vertLines: { color: 'rgba(255,255,255,0.04)', style: 1 },
            horzLines: { color: 'rgba(255,255,255,0.04)', style: 1 },
          },
          width: containerWidth,
          height: Math.max(height - chartChromeHeight, 280),
          timeScale: {
            timeVisible: true,
            secondsVisible: ['1s', '5s', '30s'].includes(selectedTimeframe),
            borderColor: 'rgba(255,255,255,0.08)',
          },
          rightPriceScale: {
            borderColor: 'rgba(255,255,255,0.08)',
            scaleMargins: { top: 0.1, bottom: 0.1 },
          },
          crosshair: {
            mode: 1,
            vertLine: { width: 1, color: 'rgba(255,255,255,0.14)', style: 3 },
            horzLine: { width: 1, color: 'rgba(255,255,255,0.14)', style: 3 },
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
      <div style={{ height: `${height}px`, width }} className="flex items-center justify-center border border-border bg-[color:var(--bg-surface)]">
        <div className="text-center">
          <p className="mb-2 text-[color:var(--danger)]">⚠️ {error}</p>
          <button onClick={() => window.location.reload()} className="text-sm underline underline-offset-4 text-[color:var(--fg-strong)] hover:text-[color:var(--fg-muted)]">{t('chart.retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="flex flex-col bg-[color:var(--bg-surface)]">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-end gap-3">
            <span className="cathedral-h2 text-[24px]">{tokenSymbol}</span>
            {currentPrice !== null && (
              <>
                <span className="font-mono text-[14px] text-[color:var(--fg-strong)]">{currentPrice.toFixed(currentPrice < 0.001 ? 8 : 6)} SOL</span>
                <span className={`text-sm font-mono ${priceChange24h >= 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
              </>
            )}
          </div>
          <button onClick={toggleFullscreen} className="border border-border bg-[color:var(--bg-page)] p-1.5 text-[color:var(--fg-muted)] hover:text-[color:var(--fg-strong)]">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        {currentOHLC && (
          <div className="flex items-center gap-4 overflow-x-auto text-[11px] font-mono text-[color:var(--fg-muted)]">
            {marketCap > 0 && (
              <span>MC <span className="text-[color:var(--fg-strong)]">{marketCap >= 1000000 ? `${(marketCap / 1000000).toFixed(2)}M` : marketCap >= 1000 ? `${(marketCap / 1000).toFixed(2)}K` : marketCap.toFixed(2)} SOL</span></span>
            )}
            <span>O <span className="text-[color:var(--fg-strong)]">{currentOHLC.open.toFixed(6)}</span></span>
            <span>H <span className="text-[color:var(--fg-strong)]">{currentOHLC.high.toFixed(6)}</span></span>
            <span>L <span className="text-[color:var(--danger)]">{currentOHLC.low.toFixed(6)}</span></span>
            <span>C <span className="text-[color:var(--fg-strong)]">{currentOHLC.close.toFixed(6)}</span></span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between overflow-x-auto border-b border-border px-4 py-2">
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`border px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors ${selectedTimeframe === tf ? 'border-border bg-[color:var(--bg-page)] text-[color:var(--fg-strong)]' : 'border-transparent text-[color:var(--fg-muted)] hover:text-[color:var(--fg-strong)]'}`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">
          <TrendingUp className="w-3 h-3 text-[color:var(--fg-muted)]" />
          <span>{ohlcvData.length} {t('chart.candles')}</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[color:var(--bg-surface)]/90">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--fg-strong)]"></div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
