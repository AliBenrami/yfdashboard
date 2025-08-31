"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsItem {
  link: string;
  artical_content: string;
  sentiment: Array<{
    label: string;
    score: number;
  }>;
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

const AVAILABLE_STOCKS = [
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "COST", name: "Costco" },
  { symbol: "GOOG", name: "Alphabet" },
  { symbol: "META", name: "Meta" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "ORCL", name: "Oracle" },
  { symbol: "TSM", name: "TSMC" },
];

export default function NewsDashboard() {
  const [selectedStock, setSelectedStock] = useState<string>("AMZN");
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sentimentFilter, setSentimentFilter] = useState<string>("ALL");
  const [pageSize] = useState<number>(5);

  // Fetch news data
  const fetchNews = async () => {
    if (!selectedStock) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        symbol: selectedStock,
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (sentimentFilter !== "ALL") {
        params.append("sentiment", sentimentFilter);
      }

      const response = await fetch(`/api/news?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NewsResponse = await response.json();

      // Additional validation of the response data
      if (!data || !Array.isArray(data.news)) {
        throw new Error("Invalid response format from API");
      }

      setNewsData(data);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  // Fetch news when dependencies change
  useEffect(() => {
    fetchNews();
  }, [selectedStock, currentPage, sentimentFilter]);

  // Reset to first page when stock or sentiment changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStock, sentimentFilter]);

  // Handle stock selection
  const handleStockSelect = (stock: string) => {
    setSelectedStock(stock);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle sentiment filter change
  const handleSentimentFilterChange = (sentiment: string) => {
    setSentimentFilter(sentiment);
  };

  // Get sentiment icon and color
  const getSentimentDisplay = (sentiment: string, score: number) => {
    if (sentiment === "POSITIVE") {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        label: "Positive",
      };
    } else if (sentiment === "NEGATIVE") {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        label: "Negative",
      };
    } else {
      // Handle NEUTRAL, undefined, or any other sentiment
      return {
        icon: <Minus className="h-4 w-4" />,
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        label: "Neutral",
      };
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!newsData) return [];

    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = Math.ceil(newsData.total / pageSize);

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
      <div className="max-w-7xl mx-auto space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          This dashboard showcases static news data as a proof of concept. In a
          production environment, it would connect with real-time news APIs.
        </p>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span>Stock News Dashboard</span>
              <div className="flex items-center gap-2">
                <Select
                  value={sentimentFilter}
                  onValueChange={handleSentimentFilterChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All News</SelectItem>
                    <SelectItem value="POSITIVE">Positive</SelectItem>
                    <SelectItem value="NEGATIVE">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Stock Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AVAILABLE_STOCKS.map((stock) => (
                <Button
                  key={stock.symbol}
                  variant={
                    selectedStock === stock.symbol ? "default" : "outline"
                  }
                  onClick={() => handleStockSelect(stock.symbol)}
                  disabled={loading}
                  className="h-auto p-4 flex-col gap-2"
                >
                  <div className="font-medium text-base">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {stock.name}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* News Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>
                News for {selectedStock}
                {newsData && (
                  <Badge variant="secondary" className="ml-2">
                    {newsData.total} articles
                  </Badge>
                )}
              </CardTitle>
              {newsData && (
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, newsData.total)} of{" "}
                  {newsData.total} articles
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              // Loading skeletons
              <div className="space-y-6">
                {Array.from({ length: pageSize }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">
                <div className="text-lg font-medium mb-2">Error</div>
                <div className="text-sm">{error}</div>
                <Button onClick={fetchNews} disabled={loading} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : newsData?.news && newsData.news.length > 0 ? (
              <div className="space-y-6">
                {newsData.news.map((item, index) => {
                  // Safely get the primary sentiment, defaulting to neutral if none exists
                  const primarySentiment =
                    item.sentiment && item.sentiment.length > 0
                      ? item.sentiment[0]
                      : null;
                  const sentimentDisplay = getSentimentDisplay(
                    primarySentiment?.label || "NEUTRAL",
                    primarySentiment?.score || 0
                  );

                  return (
                    <div key={index} className="border-b pb-6 last:border-b-0">
                      {/* Article Header */}
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
                            <Badge
                              variant="outline"
                              className={sentimentDisplay.color}
                            >
                              {sentimentDisplay.icon}
                              <span className="ml-1">
                                {sentimentDisplay.label}
                              </span>
                            </Badge>
                            <Badge variant="secondary">
                              {primarySentiment
                                ? (primarySentiment.score * 100).toFixed(0)
                                : "0"}
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

                      {/* Article Summary */}
                      <div className="space-y-2">
                        {item.summary?.chunks &&
                        item.summary.chunks.length > 0 ? (
                          item.summary.chunks.map((chunk, chunkIndex) => (
                            <p
                              key={chunkIndex}
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

                      {/* Article Link */}
                      {item.link && (
                        <div className="mt-3">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                          >
                            {item.link}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : newsData?.news && newsData.news.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No news articles found for {selectedStock}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No news data available
              </div>
            )}

            {/* Pagination */}
            {newsData && newsData.total > pageSize && (
              <div className="mt-8">
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
                            onClick={() => handlePageChange(page as number)}
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
                          currentPage >= Math.ceil(newsData.total / pageSize)
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
