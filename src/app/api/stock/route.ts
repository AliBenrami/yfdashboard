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

    // Fetch historical data based on days parameter using chart() API
    const endDate = new Date();
    let history: any;

    if (days > 0) {
      // For specific time periods, calculate the start date
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      try {
        console.log(
          `Fetching chart data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`
        );
        const chart = await yahooFinance.chart(symbol, {
          period1: startDate,
          period2: endDate,
          interval: "1d",
        });
        console.log("Chart API response:", chart);
        history = transformChartToHistory(chart);
        console.log(`Transformed history length: ${history.length}`);
      } catch (chartError) {
        console.error("Chart API error:", chartError);
        // Fallback to empty history if chart fails
        history = [];
      }
    } else {
      // For MAX (days = 0), get maximum available historical data

      // Skip test call for performance - go straight to MAX data

      // Simplified MAX strategy: make only 1-2 API calls maximum
      const startTime = performance.now();

      try {
        // Prefer very early start with period1 to approximate MAX
        const earliest = new Date(1900, 0, 1);
        const chartMax = await yahooFinance.chart(symbol, {
          period1: earliest,
          period2: endDate,
          interval: "1d",
        });
        history = transformChartToHistory(chartMax);

        const fetchTime = performance.now() - startTime;

        // If we get very little data, try one simple fallback to 10 years
        if (!history || history.length < 100) {
          const fallbackDate = new Date();
          fallbackDate.setFullYear(fallbackDate.getFullYear() - 10);

          const chart10y = await yahooFinance.chart(symbol, {
            period1: fallbackDate,
            period2: endDate,
            interval: "1d",
          });
          history = transformChartToHistory(chart10y);

          const totalTime = performance.now() - startTime;
        }
      } catch (maxError) {
        // Single fallback: 5 years
        const emergencyDate = new Date();
        emergencyDate.setFullYear(emergencyDate.getFullYear() - 5);

        try {
          const chart5y = await yahooFinance.chart(symbol, {
            period1: emergencyDate,
            period2: endDate,
            interval: "1d",
          });
          history = transformChartToHistory(chart5y);

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
    const chartData = history.map((item: any) => ({
      date: new Date(item.date).toISOString(),
      price: item.close,
      volume: item.volume || 0,
      high: item.high || 0,
      low: item.low || 0,
      open: item.open || 0,
    }));

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

function transformChartToHistory(chart: any) {
  if (!chart) {
    console.log("No chart data received");
    return [];
  }

  console.log("Chart structure keys:", Object.keys(chart));

  // Check if it's already an array (historical-like format)
  if (Array.isArray(chart)) {
    console.log("Chart is an array with length:", chart.length);
    return chart
      .filter((item) => item && item.date && item.close != null)
      .map((item: any) => ({
        date: new Date(item.date),
        open: Number(item.open) || 0,
        high: Number(item.high) || 0,
        low: Number(item.low) || 0,
        close: Number(item.close),
        volume: Number(item.volume) || 0,
      }));
  }

  // Check for chart response with meta and timestamps
  if (chart.meta && chart.timestamp && chart.indicators) {
    console.log("Using standard chart response structure");
    const timestamps = chart.timestamp || [];
    const quote = chart.indicators?.quote?.[0] || {};
    const adjclose = chart.indicators?.adjclose?.[0] || {};

    const result = [];
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const close = quote.close?.[i] || adjclose.adjclose?.[i];

      if (timestamp && close != null) {
        result.push({
          date: new Date(timestamp * 1000),
          open: Number(quote.open?.[i]) || 0,
          high: Number(quote.high?.[i]) || 0,
          low: Number(quote.low?.[i]) || 0,
          close: Number(close),
          volume: Number(quote.volume?.[i]) || 0,
        });
      }
    }
    console.log("Transformed result length:", result.length);
    return result;
  }

  // Fallback for quotes array structure
  if (chart.quotes && Array.isArray(chart.quotes)) {
    console.log("Using quotes array structure");
    return chart.quotes
      .filter((q: any) => q && q.date && q.close != null)
      .map((quote: any) => ({
        date: new Date(quote.date),
        open: Number(quote.open) || 0,
        high: Number(quote.high) || 0,
        low: Number(quote.low) || 0,
        close: Number(quote.close),
        volume: Number(quote.volume) || 0,
      }));
  }

  console.log("Unknown chart structure - available keys:", Object.keys(chart));
  console.log("Chart sample:", JSON.stringify(chart).substring(0, 500));
  return [];
}
