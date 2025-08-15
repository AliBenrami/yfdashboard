import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Fetch quote data
    const quote = await yahooFinance.quote(symbol);

    // Get days parameter or default to 30 days
    const days = parseInt(searchParams.get("days") || "30");
    // Get optional sample parameter for performance optimization
    const sample = searchParams.get("sample");
    const maxPoints = sample ? parseInt(sample) : null;

    // Fetch historical data based on days parameter
    const endDate = new Date();
    let history: any;

    if (days > 0) {
      // For specific time periods, calculate the start date
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      history = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: "1d",
      });
    } else {
      // For MAX (days = 0), get maximum available historical data

      // Skip test call for performance - go straight to MAX data

      // Simplified MAX strategy: make only 1-2 API calls maximum
      const startTime = performance.now();

      try {
        // Single attempt: Start with 25 years and let Yahoo Finance return what's available
        const maxStartDate = new Date();
        maxStartDate.setFullYear(maxStartDate.getFullYear() - 25);

        history = await yahooFinance.historical(symbol, {
          period1: maxStartDate,
          period2: endDate,
          interval: "1d",
        });

        const fetchTime = performance.now() - startTime;

        // If we get very little data, try one simple fallback to 10 years
        if (!history || history.length < 100) {
          const fallbackDate = new Date();
          fallbackDate.setFullYear(fallbackDate.getFullYear() - 10);

          history = await yahooFinance.historical(symbol, {
            period1: fallbackDate,
            period2: endDate,
            interval: "1d",
          });

          const totalTime = performance.now() - startTime;
        }
      } catch (maxError) {
        // Single fallback: 5 years
        const emergencyDate = new Date();
        emergencyDate.setFullYear(emergencyDate.getFullYear() - 5);

        try {
          history = await yahooFinance.historical(symbol, {
            period1: emergencyDate,
            period2: endDate,
            interval: "1d",
          });

          const totalTime = performance.now() - startTime;
        } catch (emergencyError) {
          // Will be handled by the existing fallback code below
        }
      }
    }

    // Server-side sampling for performance optimization
    if (maxPoints && history.length > maxPoints) {
      const originalLength = history.length;
      const sampledHistory = [];

      // For optimal distribution, use a smarter sampling strategy
      if (maxPoints >= 3) {
        // Always keep first point
        sampledHistory.push(history[0]);

        // Calculate how many intermediate points we need
        const intermediatePoints = maxPoints - 2; // Subtract first and last

        // Use floating-point step to get better distribution
        const step = (originalLength - 1) / (intermediatePoints + 1);

        // Sample intermediate points with better distribution
        for (let i = 1; i <= intermediatePoints; i++) {
          const index = Math.round(step * i);
          if (index > 0 && index < originalLength - 1) {
            sampledHistory.push(history[index]);
          }
        }

        // Always keep last point
        if (originalLength > 1) {
          sampledHistory.push(history[originalLength - 1]);
        }
      } else {
        // Fallback for very small maxPoints
        sampledHistory.push(history[0]);
        if (maxPoints > 1 && originalLength > 1) {
          sampledHistory.push(history[originalLength - 1]);
        }
      }

      history = sampledHistory;
    }

    // Check if data needs sorting for MAX timeframe
    if (days === 0) {
      // Check if data needs sorting
      const isChronological = history.every((item: any, index: number) => {
        if (index === 0) return true;
        return new Date(item.date) >= new Date(history[index - 1].date);
      });

      // If not sorted, let's sort it
      if (!isChronological) {
        history.sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }
    }

    // Format the data for the chart
    const chartData = history.map((item: any, index: number) => {
      return {
        date: item.date.toISOString(),
        price: item.close,
        volume: item.volume || 0,
        high: item.high || 0,
        low: item.low || 0,
        open: item.open || 0,
      };
    });

    // Format quote data with comprehensive information
    const quoteData = {
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 0,
      change:
        (quote.regularMarketPrice || 0) -
        (quote.regularMarketPreviousClose || 0),
      changePercent: quote.regularMarketChangePercent || 0,
      // Additional comprehensive data
      previousClose: quote.regularMarketPreviousClose || 0,
      open: quote.regularMarketOpen || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap || 0,
      peRatio: quote.trailingPE || 0,
      dividendYield: quote.trailingAnnualDividendYield || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      averageVolume: quote.averageDailyVolume3Month || 0,
      priceToBook: quote.priceToBook || 0,

      beta: quote.beta || 0,
      exchange: quote.fullExchangeName || "N/A",
      currency: quote.currency || "USD",
      shortName: quote.shortName || quote.longName || quote.symbol,
      longName: quote.longName || quote.shortName || quote.symbol,
    };

    return NextResponse.json({
      quote: quoteData,
      history: chartData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
