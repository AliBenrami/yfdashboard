import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the news data structure
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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol")?.toUpperCase();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sentiment = searchParams.get("sentiment"); // "POSITIVE", "NEGATIVE", or undefined for all

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Define the available stock symbols and their corresponding news files
    const stockNewsFiles: Record<string, string> = {
      AMZN: "AMZN_news.json",
      AVGO: "AVGO_news.json",
      COST: "COST_news.json",
      GOOG: "GOOG_news.json",
      META: "META_news.json",
      MSFT: "MSFT_news.json",
      NFLX: "NFLX_news.json",
      NVDA: "NVDA_news.json",
      ORCL: "ORCL_news.json",
      TSM: "TSM_news.json",
    };

    const newsFileName = stockNewsFiles[symbol];
    if (!newsFileName) {
      return NextResponse.json(
        { error: `No news data available for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    // Read the news data file
    const newsFilePath = path.join(process.cwd(), "src", "data", newsFileName);

    if (!fs.existsSync(newsFilePath)) {
      return NextResponse.json(
        { error: `News file not found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    const newsFileContent = fs.readFileSync(newsFilePath, "utf-8");
    const newsData: NewsItem[] = JSON.parse(newsFileContent);

    // Validate and clean the data structure
    const validatedNewsData = newsData.map((item) => ({
      link: item.link || "",
      artical_content: item.artical_content || "",
      sentiment:
        Array.isArray(item.sentiment) && item.sentiment.length > 0
          ? item.sentiment.filter(
              (s) => s && typeof s === "object" && "label" in s && "score" in s
            )
          : [{ label: "NEUTRAL", score: 0.5 }],
      summary: {
        chunks: Array.isArray(item.summary?.chunks) ? item.summary.chunks : [],
        final: Array.isArray(item.summary?.final) ? item.summary.final : [],
      },
    }));

    // Filter by sentiment if specified
    let filteredNews = validatedNewsData;
    if (sentiment && (sentiment === "POSITIVE" || sentiment === "NEGATIVE")) {
      filteredNews = validatedNewsData.filter((item) =>
        item.sentiment.some((s) => s.label === sentiment)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNews = filteredNews.slice(startIndex, endIndex);

    // Simulate API delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Log some debug info
    console.log(
      `News API: Serving ${paginatedNews.length} articles for ${symbol}, total: ${filteredNews.length}`
    );

    return NextResponse.json({
      symbol,
      news: paginatedNews,
      total: filteredNews.length,
      page,
      limit,
      hasMore: endIndex < filteredNews.length,
      sentiment: sentiment || "ALL",
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news data" },
      { status: 500 }
    );
  }
}
