"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChangeTheme from "@/components/changeTheme";
import NavigationHeader from "@/components/NavigationHeader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import FastChart from "@/components/FastChart";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectItem as UiSelectItem,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue,
} from "@/components/ui/select";
import RechartsStock from "@/components/RechartsStock";
import NewsDashboard from "@/components/NewsDashboard";

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  // Additional comprehensive data
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  averageVolume: number;
  priceToBook: number;
  beta: number;
  exchange: string;
  currency: string;
  shortName: string;
  longName: string;
}

interface ChartData {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

export default function Home() {
  const queryClient = useQueryClient();

  // Navigation state for switching between Stock, Crypto, and News
  const [activeTab, setActiveTab] = useState<"stock" | "crypto" | "news">(
    "stock"
  );

  const [selectedStock, setSelectedStock] = useState<string>("AAPL");
  const [timeFrame, setTimeFrame] = useState<string>("1M");
  const [popularStocks] = useState<string[]>([
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "TSLA",
    "META",
    "NVDA",
    "NFLX",
    "AMD",
    "INTC",
  ]);

  // Cryptocurrency state
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC-USD");
  const [popularCryptos] = useState<string[]>([
    "BTC-USD", // Bitcoin
    "ETH-USD", // Ethereum
    "BNB-USD", // Binance Coin
    "XRP-USD", // Ripple
    "ADA-USD", // Cardano
    "DOGE-USD", // Dogecoin
    "MATIC-USD", // Polygon
    "SOL-USD", // Solana
    "LINK-USD", // Chainlink
    "LTC-USD", // Litecoin
  ]);

  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 260 : 400;
  const [chartType, setChartType] = useState<"line" | "area" | "candlestick">(
    "line"
  );
  const [chartLibrary, setChartLibrary] = useState<"canvas" | "recharts">(
    "canvas"
  );

  // Time frame options
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

  // All stocks state for infinite scroll
  const [allStocksSearchQuery, setAllStocksSearchQuery] = useState<string>("");

  // All cryptos state for infinite scroll
  const [allCryptosSearchQuery, setAllCryptosSearchQuery] =
    useState<string>("");

  // TanStack Query for stock data
  const {
    data: stockQueryData,
    isLoading: stockDataLoading,
    error: stockDataError,
    refetch: refetchStockData,
  } = useQuery({
    queryKey: ["stock", selectedStock, timeFrame], // Use timeFrame to ensure unique cache keys
    queryFn: async () => {
      // No delay needed - removed for performance

      // Calculate days inside queryFn to get the current timeFrame value
      const selectedTimeFrame = timeFrameOptions.find(
        (tf) => tf.value === timeFrame
      );
      const days = selectedTimeFrame?.days ?? 30; // Use nullish coalescing to handle 0 properly

      // Determine if we need server-side sampling for performance
      // Custom canvas chart optimized for fewer data points
      let sampleParam = "";
      if (timeFrame === "MAX") {
        sampleParam = "&sample=800"; // MAX timeframe: 800 points for detailed historical view
      } else if (days > 730) {
        sampleParam = "&sample=300"; // Very long periods: 300 points
      } else if (days > 365) {
        sampleParam = "&sample=250"; // Long periods: 250 points
      }

      const response = await fetch(
        `/api/stock?symbol=${selectedStock}&days=${days}${sampleParam}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      return result;
    },
    enabled: !!selectedStock,
    staleTime: 1000 * 60 * 5, // 5 minutes for all timeframes - MAX can be cached too
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Extract stock data from query
  const stockData = stockQueryData?.quote || null;
  const rawChartData = stockQueryData?.history || [];

  // TanStack Query for crypto data
  const {
    data: cryptoQueryData,
    isLoading: cryptoDataLoading,
    error: cryptoDataError,
    refetch: refetchCryptoData,
  } = useQuery({
    queryKey: ["crypto", selectedCrypto, timeFrame], // Use timeFrame to ensure unique cache keys
    queryFn: async () => {
      // Calculate days inside queryFn to get the current timeFrame value
      const selectedTimeFrame = timeFrameOptions.find(
        (tf) => tf.value === timeFrame
      );
      const days = selectedTimeFrame?.days ?? 30; // Use nullish coalescing to handle 0 properly

      // Determine if we need server-side sampling for performance
      let sampleParam = "";
      if (timeFrame === "MAX") {
        sampleParam = "&sample=800"; // MAX timeframe: 800 points for detailed historical view
      } else if (days > 730) {
        sampleParam = "&sample=300"; // Very long periods: 300 points
      } else if (days > 365) {
        sampleParam = "&sample=250"; // Long periods: 250 points
      }

      const response = await fetch(
        `/api/crypto?symbol=${selectedCrypto}&days=${days}${sampleParam}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      return result;
    },
    enabled: !!selectedCrypto && activeTab === "crypto",
    staleTime: 1000 * 60 * 5, // 5 minutes for all timeframes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Extract crypto data from query
  const cryptoData = cryptoQueryData?.quote || null;
  const rawCryptoChartData = cryptoQueryData?.history || [];

  // Combined loading and data states
  const loading = activeTab === "stock" ? stockDataLoading : cryptoDataLoading;
  const currentData = activeTab === "stock" ? stockData : cryptoData;
  const currentChartData = useMemo(() => {
    return activeTab === "stock" ? rawChartData : rawCryptoChartData;
  }, [activeTab, rawChartData, rawCryptoChartData]);

  // Chart data - server already optimizes to 200 points for MAX, just pass through
  const chartData = currentChartData;
  const error =
    activeTab === "stock"
      ? stockDataError
        ? "Failed to fetch stock data. Please try again."
        : null
      : cryptoDataError
      ? "Failed to fetch cryptocurrency data. Please try again."
      : null;

  const filteredStocks = popularStocks;
  const filteredCryptos = popularCryptos;

  // Handle stock selection
  const handleStockSelect = (stock: string) => {
    setSelectedStock(stock);
    setCurrentPage(1); // Reset to first page when changing stocks
  };

  // Handle crypto selection
  const handleCryptoSelect = (crypto: string) => {
    setSelectedCrypto(crypto);
    setCurrentPage(1); // Reset to first page when changing cryptos
  };

  // Enhanced refresh function with toast feedback
  const handleRefresh = async () => {
    try {
      if (activeTab === "stock") {
        toast.loading("Refreshing stock data...", { id: "refresh" });
        await refetchStockData();
        toast.success("Stock data refreshed successfully!", { id: "refresh" });
      } else {
        toast.loading("Refreshing cryptocurrency data...", { id: "refresh" });
        await refetchCryptoData();
        toast.success("Cryptocurrency data refreshed successfully!", {
          id: "refresh",
        });
      }
    } catch (error) {
      toast.error(`Failed to refresh ${activeTab} data. Please try again.`, {
        id: "refresh",
      });
    }
  };

  // Reset page when time frame changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFrame]);

  // Removed aggressive cache invalidation for MAX - let normal caching work for performance

  // TanStack Query for paginated stocks
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const {
    data: allStocksData,
    isLoading: allStocksLoading,
    refetch: refetchAllStocks,
  } = useQuery({
    queryKey: ["allStocks", allStocksSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/stocks?page=${currentPage}&search=${allStocksSearchQuery}&limit=${pageSize}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract stocks and pagination info
  const allStocks = allStocksData?.stocks ?? [];
  const totalStocks = allStocksData?.total ?? 0;
  const totalPages = Math.ceil(totalStocks / pageSize);

  // TanStack Query for paginated cryptos
  const {
    data: allCryptosData,
    isLoading: allCryptosLoading,
    refetch: refetchAllCryptos,
  } = useQuery({
    queryKey: ["allCryptos", allCryptosSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/cryptos?page=${currentPage}&search=${allCryptosSearchQuery}&limit=${pageSize}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: activeTab === "crypto",
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract cryptos and pagination info
  const allCryptos = allCryptosData?.cryptos ?? [];
  const totalCryptos = allCryptosData?.total ?? 0;
  const totalCryptoPages = Math.ceil(totalCryptos / pageSize);

  // Combined pagination info based on active tab
  const totalItems = activeTab === "stock" ? totalStocks : totalCryptos;
  const totalPagesCount = activeTab === "stock" ? totalPages : totalCryptoPages;
  const allItems = activeTab === "stock" ? allStocks : allCryptos;
  const isLoadingItems =
    activeTab === "stock" ? allStocksLoading : allCryptosLoading;

  // Search all stocks
  const handleAllStocksSearch = (query: string) => {
    setAllStocksSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  // Search all cryptos
  const handleAllCryptosSearch = (query: string) => {
    setAllCryptosSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  // Combined search handler
  const handleSearch = (query: string) => {
    if (activeTab === "stock") {
      handleAllStocksSearch(query);
    } else {
      handleAllCryptosSearch(query);
    }
  };

  // Get current search query
  const currentSearchQuery =
    activeTab === "stock" ? allStocksSearchQuery : allCryptosSearchQuery;

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPagesCount <= maxVisiblePages) {
      for (let i = 1; i <= totalPagesCount; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPagesCount);
      } else if (currentPage >= totalPagesCount - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPagesCount - 3; i <= totalPagesCount; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPagesCount);
      }
    }

    return pages;
  };

  return (
    <>
      {/* Navigation Header */}
      <NavigationHeader currentPage={activeTab} onPageChange={setActiveTab} />

      {/* Content Area */}
      {activeTab === "stock" ? (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stock Dashboard Content */}

            {/* Chart Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <span>{selectedStock} Stock Performance</span>
                    <Select
                      value={timeFrame}
                      onValueChange={setTimeFrame}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeFrameOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <UiSelect
                      value={chartType}
                      onValueChange={(v) => setChartType(v as any)}
                      disabled={loading}
                    >
                      <UiSelectTrigger className="w-40">
                        <UiSelectValue placeholder="Chart Type" />
                      </UiSelectTrigger>
                      <UiSelectContent>
                        <UiSelectItem value="line">Line</UiSelectItem>
                        <UiSelectItem value="area">Area</UiSelectItem>
                        {chartLibrary === "canvas" && (
                          <UiSelectItem value="candlestick">
                            Candlestick
                          </UiSelectItem>
                        )}
                      </UiSelectContent>
                    </UiSelect>
                    <UiSelect
                      value={chartLibrary}
                      onValueChange={(v) => {
                        setChartType("area");
                        setChartLibrary(v as any);
                      }}
                      disabled={loading}
                    >
                      <UiSelectTrigger className="w-40">
                        <UiSelectValue placeholder="Library" />
                      </UiSelectTrigger>
                      <UiSelectContent>
                        <UiSelectItem value="canvas">
                          Canvas (Fast)
                        </UiSelectItem>
                        <UiSelectItem value="recharts">
                          Recharts (Slow)
                        </UiSelectItem>
                      </UiSelectContent>
                    </UiSelect>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:gap-4 w-full md:w-auto">
                    {stockData && !loading && (
                      <div className="text-right">
                        <div className="text-xl md:text-2xl font-bold">
                          ${stockData.price.toFixed(2)}
                        </div>
                        <div
                          className={`text-sm ${
                            stockData.change >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stockData.change >= 0 ? "+" : ""}
                          {stockData.change.toFixed(2)} (
                          {stockData.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleRefresh}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      title="Refresh data"
                      className="min-w-[40px]"
                    >
                      {loading ? (
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
                      <div className="text-sm">{error}</div>
                      <Button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="mt-4 bg-red-600 text-white hover:bg-red-700"
                      >
                        {loading ? "Retrying..." : "Retry"}
                      </Button>
                    </div>
                  </div>
                ) : loading ? (
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
                    {/* High-Performance Chart */}
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

            {/* Stock Details Section */}
            {stockData && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Stock Details - {stockData.shortName || selectedStock}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Price Information */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">💰</Badge>
                        <h3 className="font-semibold text-lg">
                          Price Information
                        </h3>
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
                          <span className="text-muted-foreground">
                            Day High:
                          </span>
                          <span className="font-medium">
                            ${stockData.high.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Day Low:
                          </span>
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
                          <span className="text-muted-foreground">
                            Change %:
                          </span>
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

                    {/* Volume & Market Data */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">📊</Badge>
                        <h3 className="font-semibold text-lg">
                          Volume & Market
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="font-medium">
                            {stockData.volume.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Avg Volume:
                          </span>
                          <span className="font-medium">
                            {stockData.averageVolume.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Market Cap:
                          </span>
                          <span className="font-medium">
                            {stockData.marketCap > 0
                              ? `$${(stockData.marketCap / 1e9).toFixed(2)}B`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Exchange:
                          </span>
                          <Badge variant="secondary">
                            {stockData.exchange}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Currency:
                          </span>
                          <Badge variant="outline">{stockData.currency}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">📈</Badge>
                        <h3 className="font-semibold text-lg">
                          Technical Indicators
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            P/E Ratio:
                          </span>
                          <span className="font-medium">
                            {stockData.peRatio > 0
                              ? stockData.peRatio.toFixed(2)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Price/Book:
                          </span>
                          <span className="font-medium">
                            {stockData.priceToBook > 0
                              ? stockData.priceToBook.toFixed(2)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Beta:</span>
                          <span className="font-medium">
                            {stockData.beta > 0
                              ? stockData.beta.toFixed(2)
                              : "N/A"}
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

                    {/* 52-Week Range & Chart Data */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">📅</Badge>
                        <h3 className="font-semibold text-lg">52-Week Range</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            52W High:
                          </span>
                          <span className="font-medium">
                            ${stockData.fiftyTwoWeekHigh.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            52W Low:
                          </span>
                          <span className="font-medium">
                            ${stockData.fiftyTwoWeekLow.toFixed(2)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Data Points:
                          </span>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {chartData.length}
                            </Badge>
                            {rawChartData.length > chartData.length && (
                              <Badge variant="outline" className="text-xs">
                                Optimized from {rawChartData.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Date Range:
                          </span>
                          <span className="font-medium text-sm">
                            {chartData.length > 0
                              ? `${new Date(
                                  chartData[0].date
                                ).toLocaleDateString()} - ${new Date(
                                  chartData[chartData.length - 1].date
                                ).toLocaleDateString()}`
                              : "N/A"}
                          </span>
                        </div>
                        {timeFrame === "MAX" && chartData.length > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Years of Data:
                              </span>
                              <Badge
                                variant="outline"
                                className="font-medium text-sm"
                              >
                                {(
                                  (new Date(
                                    chartData[chartData.length - 1].date
                                  ).getTime() -
                                    new Date(chartData[0].date).getTime()) /
                                  (1000 * 60 * 60 * 24 * 365)
                                ).toFixed(1)}{" "}
                                years
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                MAX Status:
                              </span>
                              <Badge
                                variant={loading ? "secondary" : "default"}
                                className="font-medium text-sm"
                              >
                                {loading ? "Fetching..." : "Loaded"}
                              </Badge>
                            </div>
                          </>
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

            {/* Popular Stocks Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Popular Stocks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {filteredStocks.map((stock) => (
                    <Button
                      key={stock}
                      variant={selectedStock === stock ? "default" : "outline"}
                      onClick={() => handleStockSelect(stock)}
                      disabled={loading}
                      className="h-auto p-4 flex-col gap-2"
                    >
                      <div className="font-medium text-base">{stock}</div>
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Stocks Section - Table with Pagination */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>All Market Stocks</CardTitle>
                  <div className="flex w-full items-center gap-2 md:gap-4">
                    <Input
                      placeholder="Search all stocks..."
                      value={allStocksSearchQuery}
                      onChange={(e) => handleAllStocksSearch(e.target.value)}
                      className="w-full sm:w-64"
                    />
                    <Badge variant="secondary" className="text-sm">
                      {totalStocks} stocks
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stocks Table */}
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Symbol</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allStocksLoading ? (
                          // Loading skeletons
                          Array.from({ length: pageSize }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Skeleton className="h-6 w-16" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-20" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : allStocks.length > 0 ? (
                          allStocks.map((stock: any) => (
                            <TableRow
                              key={stock.symbol}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-mono font-medium">
                                {stock.symbol}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {stock.companyName}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStockSelect(stock.symbol)
                                  }
                                  disabled={loading}
                                  className="w-full"
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No stocks found matching your search
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, totalStocks)} of{" "}
                        {totalStocks} stocks
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(currentPage - 1)}
                              className={
                                currentPage <= 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>

                          {getPageNumbers().map((page, index) => (
                            <PaginationItem key={index}>
                              {page === "ellipsis" ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  onClick={() =>
                                    handlePageChange(page as number)
                                  }
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(currentPage + 1)}
                              className={
                                currentPage >= totalPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : activeTab === "crypto" ? (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Cryptocurrency Dashboard Content */}

            {/* Chart Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <span>{selectedCrypto} Cryptocurrency Performance</span>
                    <Select
                      value={timeFrame}
                      onValueChange={setTimeFrame}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeFrameOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <UiSelect
                      value={chartType}
                      onValueChange={(v) => setChartType(v as any)}
                      disabled={loading}
                    >
                      <UiSelectTrigger className="w-40">
                        <UiSelectValue placeholder="Chart Type" />
                      </UiSelectTrigger>
                      <UiSelectContent>
                        <UiSelectItem value="line">Line Chart</UiSelectItem>
                        <UiSelectItem value="area">Area Chart</UiSelectItem>
                        <UiSelectItem value="candlestick">
                          Candlestick
                        </UiSelectItem>
                      </UiSelectContent>
                    </UiSelect>
                    <UiSelect
                      value={chartLibrary}
                      onValueChange={(v) => setChartLibrary(v as any)}
                      disabled={loading}
                    >
                      <UiSelectTrigger className="w-32">
                        <UiSelectValue placeholder="Engine" />
                      </UiSelectTrigger>
                      <UiSelectContent>
                        <UiSelectItem value="canvas">Canvas</UiSelectItem>
                        <UiSelectItem value="recharts">Recharts</UiSelectItem>
                      </UiSelectContent>
                    </UiSelect>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:gap-4 w-full md:w-auto">
                    {cryptoData && !loading && (
                      <div className="text-right">
                        <div className="text-xl md:text-2xl font-bold">
                          ${cryptoData.price.toFixed(2)}
                        </div>
                        <div
                          className={`text-sm ${
                            cryptoData.change >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {cryptoData.change >= 0 ? "+" : ""}
                          {cryptoData.change.toFixed(2)} (
                          {cryptoData.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleRefresh}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      title="Refresh data"
                      className="min-w-[40px]"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        "↻"
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                    {error}
                  </div>
                )}
                {loading ? (
                  <div
                    className={`${
                      isMobile ? "h-64" : "h-96"
                    } flex flex-col items-center justify-center text-gray-500`}
                  >
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
                ) : chartData.length > 0 ? (
                  <div className="space-y-4">
                    {/* High-Performance Chart */}
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

            {/* Crypto Details Section */}
            {cryptoData && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Crypto Details - {cryptoData.shortName || selectedCrypto}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Price Information */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">💰</Badge>
                        <h3 className="font-semibold text-lg">
                          Price Information
                        </h3>
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
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Day High:
                          </span>
                          <span className="font-medium">
                            ${cryptoData.high.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Day Low:
                          </span>
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
                          <span className="text-muted-foreground">
                            Change %:
                          </span>
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

                    {/* Volume & Market */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">📊</Badge>
                        <h3 className="font-semibold text-lg">
                          Volume & Market
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="font-medium">
                            {cryptoData.volume.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Market Cap:
                          </span>
                          <span className="font-medium">
                            ${(cryptoData.marketCap / 1e9).toFixed(2)}B
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Circulating Supply:
                          </span>
                          <span className="font-medium">
                            {cryptoData.circulatingSupply
                              ? `${(cryptoData.circulatingSupply / 1e6).toFixed(
                                  2
                                )}M`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Total Supply:
                          </span>
                          <span className="font-medium">
                            {cryptoData.totalSupply
                              ? `${(cryptoData.totalSupply / 1e6).toFixed(2)}M`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Avg Volume:
                          </span>
                          <span className="font-medium">
                            {cryptoData.averageVolume.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">📈</Badge>
                        <h3 className="font-semibold text-lg">
                          Technical Data
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Exchange:
                          </span>
                          <span className="font-medium">
                            {cryptoData.exchange}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Currency:
                          </span>
                          <span className="font-medium">
                            {cryptoData.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">
                            {cryptoData.quoteType || "Cryptocurrency"}
                          </span>
                        </div>
                        <div className="flex justify-between">
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

                    {/* 52-Week Range */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Badge variant="outline">📅</Badge>
                        <h3 className="font-semibold text-lg">52-Week Range</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            52W High:
                          </span>
                          <span className="font-medium">
                            ${cryptoData.fiftyTwoWeekHigh.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            52W Low:
                          </span>
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

            {/* Popular Cryptocurrencies Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Popular Cryptocurrencies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {filteredCryptos.map((crypto) => (
                    <Button
                      key={crypto}
                      variant={
                        selectedCrypto === crypto ? "default" : "outline"
                      }
                      onClick={() => handleCryptoSelect(crypto)}
                      disabled={loading}
                      className="h-auto p-4 flex-col gap-2"
                    >
                      <div className="font-medium text-base">
                        {crypto.replace("-USD", "")}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Cryptos Section - Table with Pagination */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>All Market Cryptocurrencies</CardTitle>
                  <div className="flex w-full items-center gap-2 md:gap-4">
                    <Input
                      placeholder="Search all cryptocurrencies..."
                      value={currentSearchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full sm:w-64"
                    />
                    <Badge variant="secondary" className="text-sm">
                      {totalItems} cryptos
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Cryptos Table */}
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Symbol</TableHead>
                          <TableHead>Cryptocurrency</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingItems ? (
                          // Loading skeletons
                          Array.from({ length: pageSize }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Skeleton className="h-6 w-16" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-20" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : allItems.length > 0 ? (
                          allItems.map((crypto: any) => (
                            <TableRow
                              key={crypto.symbol}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-mono font-medium">
                                {crypto.symbol.replace("-USD", "")}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {crypto.companyName}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleCryptoSelect(crypto.symbol)
                                  }
                                  disabled={loading}
                                  className="w-full"
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No cryptocurrencies found matching your search
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPagesCount > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, totalItems)} of{" "}
                        {totalItems} cryptocurrencies
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(currentPage - 1)}
                              className={
                                currentPage <= 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {getPageNumbers().map((pageNumber, index) =>
                            pageNumber === "ellipsis" ? (
                              <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  onClick={() =>
                                    handlePageChange(pageNumber as number)
                                  }
                                  isActive={currentPage === pageNumber}
                                  className="cursor-pointer"
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          )}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(currentPage + 1)}
                              className={
                                currentPage >= totalPagesCount
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // News Dashboard
        <NewsDashboard />
      )}
    </>
  );
}
