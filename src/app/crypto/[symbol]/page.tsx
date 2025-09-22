"use client";

import { useMemo, useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FastChart from "@/components/FastChart";
import RechartsStock from "@/components/RechartsStock";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ChartData {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

export default function CryptoSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const resolved = use(params);
  const base = (resolved.symbol || "").toUpperCase();
  if (!base) notFound();
  const symbol = base.includes("-") ? base : `${base}-USD`;

  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 260 : 400;
  const [chartType, setChartType] = useState<"line" | "area" | "candlestick">(
    "line"
  );
  const [chartLibrary, setChartLibrary] = useState<"canvas" | "recharts">(
    "canvas"
  );
  const [timeFrame, setTimeFrame] = useState<string>("1M");

  const timeFrameOptions = [
    { value: "1W", label: "1 Week", days: 7 },
    { value: "1M", label: "1 Month", days: 30 },
    { value: "3M", label: "3 Months", days: 90 },
    { value: "6M", label: "6 Months", days: 180 },
    { value: "1Y", label: "1 Year", days: 365 },
    { value: "2Y", label: "2 Years", days: 730 },
    { value: "5Y", label: "5 Years", days: 1825 },
    { value: "MAX", label: "Max", days: 0 },
  ];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["crypto", symbol, timeFrame],
    queryFn: async () => {
      const selectedTimeFrame = timeFrameOptions.find(
        (tf) => tf.value === timeFrame
      );
      const days = selectedTimeFrame?.days ?? 30;
      let sampleParam = "";
      if (timeFrame === "MAX") sampleParam = "&sample=800";
      else if (days > 730) sampleParam = "&sample=300";
      else if (days > 365) sampleParam = "&sample=250";
      const res = await fetch(
        `/api/crypto?symbol=${symbol}&days=${days}${sampleParam}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const cryptoData = data?.quote || null;
  const rawChartData = data?.history || [];
  const chartData = rawChartData as ChartData[];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
      <div className="max-w-7xl mx_auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">
            {symbol} Dashboard
          </h1>
          <div className="flex gap-2">
            <Link href="/" className="text-sm">
              <Button variant="outline" size="sm">
                Home
              </Button>
            </Link>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items_center gap-2 md:gap-4">
                <span>{symbol} Performance</span>
                <Select
                  value={timeFrame}
                  onValueChange={setTimeFrame}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeFrameOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={chartType}
                  onValueChange={(v) => setChartType(v as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Chart Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="candlestick">Candlestick</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={chartLibrary}
                  onValueChange={(v) => {
                    setChartType("area");
                    setChartLibrary(v as any);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Library" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canvas">Canvas (Fast)</SelectItem>
                    <SelectItem value="recharts">Recharts (Slow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 md:gap-4 w-full md:w-auto">
                {cryptoData && !isLoading && (
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold">
                      ${cryptoData.price?.toFixed(2)}
                    </div>
                    <div
                      className={`text-sm ${
                        cryptoData.change >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {cryptoData.change >= 0 ? "+" : ""}
                      {cryptoData.change?.toFixed(2)} (
                      {cryptoData.changePercent?.toFixed(2)}%)
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="min-w-[40px]"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    "↻"
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div
                className={`${
                  isMobile ? "h-64" : "h-96"
                } flex items-center justify-center`}
              >
                <div className="text-center text-red-600">
                  <div className="text-lg font-medium mb-2">Error</div>
                  <div className="text-sm">
                    Failed to fetch cryptocurrency data. Please try again.
                  </div>
                  <Button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="mt-4 bg-red-600 text_white hover:bg-red-700"
                  >
                    {isLoading ? "Retrying..." : "Retry"}
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div
                className={`${
                  isMobile ? "h-64" : "h-96"
                } flex items-center justify-center text-gray-500 dark:text-white`}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  {timeFrame === "MAX"
                    ? "Loading historical data..."
                    : "Loading chart data..."}
                  {timeFrame === "MAX" && (
                    <div className="text-xs mt-2 text-gray-400">
                      Optimizing large dataset for better performance...
                    </div>
                  )}
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Cryptocurrency Performance
                  </h4>
                  {chartLibrary === "canvas" ? (
                    <FastChart
                      data={chartData}
                      height={chartHeight}
                      showVolume={!isMobile}
                      chartType={chartType}
                    />
                  ) : (
                    <RechartsStock
                      data={chartData as any}
                      height={chartHeight}
                      type={
                        chartType === "candlestick"
                          ? "line"
                          : (chartType as any)
                      }
                      showVolume={!isMobile}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`${
                  isMobile ? "h-64" : "h-96"
                } flex items-center justify-center text-gray-500 dark:text-white`}
              >
                No chart data available
              </div>
            )}
          </CardContent>
        </Card>

        {cryptoData && (
          <Card>
            <CardHeader>
              <CardTitle>
                Crypto Details - {cryptoData.shortName || symbol}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Badge variant="outline">💰</Badge>
                    <h3 className="font-semibold text-lg">Price Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Current Price:
                      </span>
                      <span className="font-medium">
                        ${cryptoData.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Previous Close:
                      </span>
                      <span className="font-medium">
                        ${cryptoData.previousClose.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open:</span>
                      <span className="font-medium">
                        ${cryptoData.open.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify_between">
                      <span className="text-muted-foreground">Day High:</span>
                      <span className="font-medium">
                        ${cryptoData.high.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Day Low:</span>
                      <span className="font-medium">
                        ${cryptoData.low.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change:</span>
                      <Badge
                        variant={
                          cryptoData.change >= 0 ? "default" : "destructive"
                        }
                        className="font-medium"
                      >
                        {cryptoData.change >= 0 ? "+" : ""}
                        {cryptoData.change.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change %:</span>
                      <Badge
                        variant={
                          cryptoData.changePercent >= 0
                            ? "default"
                            : "destructive"
                        }
                        className="font-medium"
                      >
                        {cryptoData.changePercent >= 0 ? "+" : ""}
                        {cryptoData.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Badge variant="outline">📊</Badge>
                    <h3 className="font-semibold text-lg">Volume & Market</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-medium">
                        {cryptoData.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Volume:</span>
                      <span className="font-medium">
                        {cryptoData.averageVolume.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap:</span>
                      <span className="font-medium">
                        ${(cryptoData.marketCap / 1e9).toFixed(2)}B
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exchange:</span>
                      <Badge variant="secondary">{cryptoData.exchange}</Badge>
                    </div>
                    <div className="flex justify_between">
                      <span className="text-muted-foreground">Currency:</span>
                      <Badge variant="outline">{cryptoData.currency}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Badge variant="outline">📈</Badge>
                    <h3 className="font-semibold text-lg">Technical Data</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">
                        {cryptoData.quoteType || "Cryptocurrency"}
                      </span>
                    </div>
                    <div className="flex justify_between">
                      <span className="text-muted-foreground">
                        Market State:
                      </span>
                      <Badge
                        variant={
                          cryptoData.marketState === "REGULAR"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {cryptoData.marketState || "24/7"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Badge variant="outline">📅</Badge>
                    <h3 className="font-semibold text-lg">52-Week Range</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52W High:</span>
                      <span className="font-medium">
                        ${cryptoData.fiftyTwoWeekHigh.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52W Low:</span>
                      <span className="font-medium">
                        ${cryptoData.fiftyTwoWeekLow.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Lowest Price:
                      </span>
                      <span className="font-medium">
                        $
                        {chartData.length > 0
                          ? Math.min(
                              ...chartData.map((d: ChartData) => d.price)
                            ).toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Highest Price:
                      </span>
                      <span className="font-medium">
                        $
                        {chartData.length > 0
                          ? Math.max(
                              ...chartData.map((d: ChartData) => d.price)
                            ).toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
