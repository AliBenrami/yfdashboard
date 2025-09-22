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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import FastChart from "@/components/FastChart";
import RechartsStock from "@/components/RechartsStock";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ChartData {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

interface NewsItem {
  link: string;
  artical_content: string;
  sentiment: Array<{ label: string; score: number }>;
  summary: {
    chunks: Array<Array<{ summary_text: string }>>;
    final: Array<{ summary_text: string }>;
  };
}

interface NewsResponse {
  symbol: string;
  news: NewsItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  sentiment: string;
}

export default function TickerPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const resolved = use(params);
  const ticker = (resolved?.ticker || "").toUpperCase();
  if (!ticker) notFound();

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
    queryKey: ["stock", ticker, timeFrame],
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
        `/api/stock?symbol=${ticker}&days=${days}${sampleParam}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const stockData = data?.quote || null;
  const rawChartData = data?.history || [];
  const chartData = rawChartData as ChartData[];

  // News state and query
  const [newsPage, setNewsPage] = useState<number>(1);
  const [newsSentiment, setNewsSentiment] = useState<string>("ALL");
  const newsPageSize = 5;

  const {
    data: newsData,
    isLoading: newsLoading,
    error: newsError,
    refetch: refetchNews,
  } = useQuery<{
    symbol: string;
    news: NewsItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    sentiment: string;
  }>({
    queryKey: ["news", ticker, newsPage, newsSentiment],
    queryFn: async () => {
      const params = new URLSearchParams({
        symbol: ticker,
        page: String(newsPage),
        limit: String(newsPageSize),
      });
      if (newsSentiment !== "ALL") params.append("sentiment", newsSentiment);
      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 1000 * 60 * 5,
  });

  const getNewsPageNumbers = (total: number) => {
    const pages: (number | "ellipsis")[] = [];
    const totalPages = Math.ceil(total / newsPageSize);
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (newsPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("ellipsis", totalPages);
    } else if (newsPage >= totalPages - 2) {
      pages.push(1, "ellipsis");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(
        1,
        "ellipsis",
        newsPage - 1,
        newsPage,
        newsPage + 1,
        "ellipsis",
        totalPages
      );
    }
    return pages;
  };

  const getSentimentDisplay = (sentiment: string, score: number) => {
    if (sentiment === "POSITIVE") {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        label: "Positive",
      };
    }
    if (sentiment === "NEGATIVE") {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        label: "Negative",
      };
    }
    return {
      icon: <Minus className="h-4 w-4" />,
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      label: "Neutral",
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">
            {ticker} Dashboard
          </h1>
          <div className="flex gap-2">
            {/* <Link href={`/${ticker}/news`} className="text-sm">
              <Button variant="outline" size="sm">
                View News
              </Button>
            </Link> */}
            <Link href="/" className="text-sm">
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <span>{ticker} Stock Performance</span>
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
                {stockData && !isLoading && (
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold">
                      ${stockData.price?.toFixed(2)}
                    </div>
                    <div
                      className={`text-sm ${
                        stockData.change >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stockData.change >= 0 ? "+" : ""}
                      {stockData.change?.toFixed(2)} (
                      {stockData.changePercent?.toFixed(2)}%)
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
                    Failed to fetch stock data. Please try again.
                  </div>
                  <Button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="mt-4 bg-red-600 text-white hover:bg-red-700"
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
                    Stock Performance
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

        {stockData && (
          <Card>
            <CardHeader>
              <CardTitle>
                Stock Details - {stockData.shortName || ticker}
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
                        ${stockData.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Previous Close:
                      </span>
                      <span className="font-medium">
                        ${stockData.previousClose.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open:</span>
                      <span className="font-medium">
                        ${stockData.open.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Day High:</span>
                      <span className="font-medium">
                        ${stockData.high.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Day Low:</span>
                      <span className="font-medium">
                        ${stockData.low.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change:</span>
                      <Badge
                        variant={
                          stockData.change >= 0 ? "default" : "destructive"
                        }
                        className="font-medium"
                      >
                        {stockData.change >= 0 ? "+" : ""}
                        {stockData.change.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change %:</span>
                      <Badge
                        variant={
                          stockData.changePercent >= 0
                            ? "default"
                            : "destructive"
                        }
                        className="font-medium"
                      >
                        {stockData.changePercent >= 0 ? "+" : ""}
                        {stockData.changePercent.toFixed(2)}%
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
                        {stockData.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Volume:</span>
                      <span className="font-medium">
                        {stockData.averageVolume.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap:</span>
                      <span className="font-medium">
                        {stockData.marketCap > 0
                          ? `$${(stockData.marketCap / 1e9).toFixed(2)}B`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exchange:</span>
                      <Badge variant="secondary">{stockData.exchange}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency:</span>
                      <Badge variant="outline">{stockData.currency}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Badge variant="outline">📈</Badge>
                    <h3 className="font-semibold text-lg">
                      Technical Indicators
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P/E Ratio:</span>
                      <span className="font-medium">
                        {stockData.peRatio > 0
                          ? stockData.peRatio.toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price/Book:</span>
                      <span className="font-medium">
                        {stockData.priceToBook > 0
                          ? stockData.priceToBook.toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beta:</span>
                      <span className="font-medium">
                        {stockData.beta > 0 ? stockData.beta.toFixed(2) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Dividend Yield:
                      </span>
                      <span className="font-medium">
                        {stockData.dividendYield > 0
                          ? `${(stockData.dividendYield * 100).toFixed(2)}%`
                          : "N/A"}
                      </span>
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
                        ${stockData.fiftyTwoWeekHigh.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">52W Low:</span>
                      <span className="font-medium">
                        ${stockData.fiftyTwoWeekLow.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Data Points:
                      </span>
                      <Badge variant="secondary">{chartData.length}</Badge>
                    </div>
                    {timeFrame === "MAX" && chartData.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          MAX Status:
                        </span>
                        <Badge
                          variant={isLoading ? "secondary" : "default"}
                          className="font-medium text-sm"
                        >
                          {isLoading ? "Fetching..." : "Loaded"}
                        </Badge>
                      </div>
                    )}
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

        {/* News Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span>Latest News for {ticker}</span>
              <div className="flex items-center gap-2">
                <Select value={newsSentiment} onValueChange={setNewsSentiment}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="POSITIVE">Positive</SelectItem>
                    <SelectItem value="NEGATIVE">Negative</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchNews()}
                  disabled={newsLoading}
                >
                  Refresh
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newsError ? (
              <div className="text-center text-red-600 py-8">
                <div className="text-lg font-medium mb-2">Error</div>
                <div className="text-sm">Failed to fetch news data.</div>
                <Button
                  onClick={() => refetchNews()}
                  disabled={newsLoading}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : newsLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading…
              </div>
            ) : newsData?.news && newsData.news.length > 0 ? (
              <div className="space-y-6">
                {newsData.news.map((item, index) => {
                  const primary =
                    item.sentiment && item.sentiment.length > 0
                      ? item.sentiment[0]
                      : null;
                  const disp = getSentimentDisplay(
                    primary?.label || "NEUTRAL",
                    primary?.score || 0
                  );
                  return (
                    <div key={index} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                            {item.summary?.final &&
                            item.summary.final.length > 0
                              ? item.summary.final[0]?.summary_text ||
                                "No title available"
                              : "No title available"}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={disp.color}>
                              {disp.icon}
                              <span className="ml-1">{disp.label}</span>
                            </Badge>
                            <Badge variant="secondary">
                              {primary ? (primary.score * 100).toFixed(0) : "0"}
                              %
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            item.link ? window.open(item.link, "_blank") : null
                          }
                          className="flex-shrink-0"
                          disabled={!item.link}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Read
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {item.summary?.chunks &&
                        item.summary.chunks.length > 0 ? (
                          item.summary.chunks.map((chunk, i) => (
                            <p
                              key={i}
                              className="text-sm text-muted-foreground leading-relaxed"
                            >
                              {chunk && chunk.length > 0
                                ? chunk[0]?.summary_text ||
                                  "No summary available"
                                : "No summary available"}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            No summary available
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No news data available
              </div>
            )}

            {newsData && newsData.total > newsPageSize && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setNewsPage(newsPage - 1)}
                        className={
                          newsPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {getNewsPageNumbers(newsData.total).map((page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setNewsPage(page as number)}
                            isActive={newsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setNewsPage(newsPage + 1)}
                        className={
                          newsData &&
                          newsPage >= Math.ceil(newsData.total / newsPageSize)
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
