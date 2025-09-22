"use client";

import { useEffect, useRef, useState } from "react";
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
import NavigationHeader from "@/components/NavigationHeader";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, X, Star, Flame, TrendingUp } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"stock" | "crypto" | "news">(
    "stock"
  );

  const [allStocksSearchQuery, setAllStocksSearchQuery] = useState<string>("");
  const [allCryptosSearchQuery, setAllCryptosSearchQuery] =
    useState<string>("");
  const [debouncedStocksQuery, setDebouncedStocksQuery] = useState<string>("");
  const [debouncedCryptosQuery, setDebouncedCryptosQuery] =
    useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const stockSearchRef = useRef<HTMLInputElement | null>(null);
  const cryptoSearchRef = useRef<HTMLInputElement | null>(null);

  // Debounce searches
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedStocksQuery(allStocksSearchQuery),
      300
    );
    return () => clearTimeout(t);
  }, [allStocksSearchQuery]);
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedCryptosQuery(allCryptosSearchQuery),
      300
    );
    return () => clearTimeout(t);
  }, [allCryptosSearchQuery]);

  // Keyboard shortcut to focus search: '/'
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        if (activeTab === "stock") stockSearchRef.current?.focus();
        else if (activeTab === "crypto") cryptoSearchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab]);

  const { data: allStocksData, isLoading: allStocksLoading } = useQuery({
    queryKey: ["allStocks", debouncedStocksQuery, currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/stocks?page=${currentPage}&search=${debouncedStocksQuery}&limit=${pageSize}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: allCryptosData, isLoading: allCryptosLoading } = useQuery({
    queryKey: ["allCryptos", debouncedCryptosQuery, currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/cryptos?page=${currentPage}&search=${debouncedCryptosQuery}&limit=${pageSize}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled: activeTab === "crypto",
    staleTime: 1000 * 60 * 5,
  });

  const allStocks = allStocksData?.stocks ?? [];
  const totalStocks = allStocksData?.total ?? 0;
  const totalPagesStocks = Math.ceil(totalStocks / pageSize);

  const allCryptos = allCryptosData?.cryptos ?? [];
  const totalCryptos = allCryptosData?.total ?? 0;
  const totalPagesCryptos = Math.ceil(totalCryptos / pageSize);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const getPageNumbers = (totalPages: number) => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;
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

  const popularStocks = [
    "AAPL",
    "MSFT",
    "NVDA",
    "TSLA",
    "AMZN",
    "META",
    "GOOGL",
    "AVGO",
    "AMD",
    "NFLX",
  ];
  const popularCryptos = [
    "BTC",
    "ETH",
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "DOGE",
    "LINK",
    "MATIC",
    "LTC",
  ];

  return (
    <>
      <NavigationHeader currentPage={activeTab} onPageChange={setActiveTab} />
      {activeTab === "stock" ? (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">
                  Search Stocks
                </h2>
                <p className="text-sm text-muted-foreground">
                  Type to filter. Press '/' to focus search.
                </p>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {totalStocks} results
              </Badge>
            </div>
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full sm:w-96">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Search className="h-4 w-4" />
                    </span>
                    <Input
                      ref={stockSearchRef}
                      placeholder="Ticker or company (e.g., NVDA, Apple)"
                      value={allStocksSearchQuery}
                      onChange={(e) => {
                        setAllStocksSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-8"
                    />
                    {allStocksSearchQuery && (
                      <button
                        onClick={() => {
                          setAllStocksSearchQuery("");
                          setCurrentPage(1);
                          stockSearchRef.current?.focus();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Badge variant="secondary" className="sm:hidden inline-flex">
                    {totalStocks} results
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Popular quick picks */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {popularStocks.map((sym) => (
                    <Link key={sym} href={`/${sym}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Star className="h-3.5 w-3.5" /> {sym}
                      </Button>
                    </Link>
                  ))}
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Symbol</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="w-28 text-right">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStocksLoading ? (
                        Array.from({ length: pageSize }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Skeleton className="h-6 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-32" />
                            </TableCell>
                            <TableCell className="text-right">
                              <Skeleton className="h-6 w-14 ml-auto" />
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
                              <Link
                                href={`/${stock.symbol}`}
                                className="underline-offset-4 hover:underline"
                              >
                                {stock.symbol}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {stock.companyName}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/${stock.symbol}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <TrendingUp className="h-3.5 w-3.5" /> Open
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No results. Try a different term or pick a popular
                            ticker above.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPagesStocks > 1 && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
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
                        {getPageNumbers(totalPagesStocks).map((page, index) => (
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
                              currentPage >= totalPagesStocks
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
      ) : activeTab === "crypto" ? (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">
                  Search Cryptocurrencies
                </h2>
                <p className="text-sm text-muted-foreground">
                  Type to filter. Press '/' to focus search.
                </p>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {totalCryptos} results
              </Badge>
            </div>
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full sm:w-96">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Search className="h-4 w-4" />
                    </span>
                    <Input
                      ref={cryptoSearchRef}
                      placeholder="Symbol or name (e.g., BTC, Ethereum)"
                      value={allCryptosSearchQuery}
                      onChange={(e) => {
                        setAllCryptosSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-8"
                    />
                    {allCryptosSearchQuery && (
                      <button
                        onClick={() => {
                          setAllCryptosSearchQuery("");
                          setCurrentPage(1);
                          cryptoSearchRef.current?.focus();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Badge variant="secondary" className="sm:hidden inline-flex">
                    {totalCryptos} results
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Popular quick picks */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {popularCryptos.map((sym) => (
                    <Link key={sym} href={`/crypto/${sym}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Flame className="h-3.5 w-3.5" /> {sym}
                      </Button>
                    </Link>
                  ))}
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-28 text-right">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCryptosLoading ? (
                        Array.from({ length: pageSize }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Skeleton className="h-6 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-32" />
                            </TableCell>
                            <TableCell className="text-right">
                              <Skeleton className="h-6 w-14 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : allCryptos.length > 0 ? (
                        allCryptos.map((crypto: any) => (
                          <TableRow
                            key={crypto.symbol}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-mono font-medium">
                              <Link
                                href={`/crypto/${crypto.symbol.replace(
                                  "-USD",
                                  ""
                                )}`}
                                className="underline-offset-4 hover:underline"
                              >
                                {crypto.symbol.replace("-USD", "")}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {crypto.companyName}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/crypto/${crypto.symbol.replace(
                                  "-USD",
                                  ""
                                )}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <TrendingUp className="h-3.5 w-3.5" /> Open
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No results. Try a different term or pick a popular
                            coin above.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPagesCryptos > 1 && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(currentPage * pageSize, totalCryptos)} of{" "}
                      {totalCryptos} cryptocurrencies
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
                        {getPageNumbers(totalPagesCryptos).map(
                          (page, index) => (
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
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={
                              currentPage >= totalPagesCryptos
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
      ) : (
        <></>
      )}
    </>
  );
}
