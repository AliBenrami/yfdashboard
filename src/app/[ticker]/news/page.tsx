"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";

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

export default function TickerNewsPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const resolved = use(params);
  const ticker = (resolved.ticker || "").toUpperCase();
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sentimentFilter, setSentimentFilter] = useState<string>("ALL");
  const pageSize = 5;

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        symbol: ticker,
        page: currentPage.toString(),
        limit: String(pageSize),
      });
      if (sentimentFilter !== "ALL")
        params.append("sentiment", sentimentFilter);
      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();
      if (!data || !Array.isArray(data.news))
        throw new Error("Invalid response format");
      setNewsData(data);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, currentPage, sentimentFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [ticker, sentimentFilter]);

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

  const getPageNumbers = () => {
    if (!newsData) return [] as (number | "ellipsis")[];
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;
    const totalPages = Math.ceil(newsData.total / pageSize);
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">{ticker} News</h1>
          <div className="flex gap-2">
            <Link href={`/${ticker}`}>
              <Button variant="outline" size="sm">
                Back to {ticker}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Home
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span>Stock News Dashboard</span>
              <div className="flex items-center gap-2">
                <Select
                  value={sentimentFilter}
                  onValueChange={setSentimentFilter}
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

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>
                News for {ticker}
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
              <div className="text-center text-muted-foreground py-8">
                Loading…
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

            {newsData && newsData.total > pageSize && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(currentPage - 1)}
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
                            onClick={() => setCurrentPage(page as number)}
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
                        onClick={() => setCurrentPage(currentPage + 1)}
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
