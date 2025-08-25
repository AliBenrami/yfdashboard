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

    // Fetch quote data for cryptocurrency
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
          `Fetching crypto chart data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`
        );
        const chart = await yahooFinance.chart(symbol, {
          period1: startDate,
          period2: endDate,
          interval: "1d",
        });
        console.log("Crypto Chart API response:", chart);
        history = transformChartToHistory(chart);
        console.log(`Transformed crypto history length: ${history.length}`);
      } catch (chartError) {
        console.error("Crypto Chart API error:", chartError);
        // Fallback to empty history if chart fails
        history = [];
      }
    } else {
      // For MAX (days = 0), get maximum available historical data
      const startTime = performance.now();

      try {
        // Prefer very early start with period1 to approximate MAX
        const earliest = new Date(2010, 0, 1); // Crypto started around 2009-2010
        const chartMax = await yahooFinance.chart(symbol, {
          period1: earliest,
          period2: endDate,
          interval: "1d",
        });
        history = transformChartToHistory(chartMax);

        const fetchTime = performance.now() - startTime;

        // If we get very little data, try one simple fallback to 5 years
        if (!history || history.length < 100) {
          const fallbackDate = new Date();
          fallbackDate.setFullYear(fallbackDate.getFullYear() - 5);

          const chart5y = await yahooFinance.chart(symbol, {
            period1: fallbackDate,
            period2: endDate,
            interval: "1d",
          });
          history = transformChartToHistory(chart5y);
        }
      } catch (maxError) {
        // Single fallback: 2 years
        const emergencyDate = new Date();
        emergencyDate.setFullYear(emergencyDate.getFullYear() - 2);

        try {
          const emergencyChart = await yahooFinance.chart(symbol, {
            period1: emergencyDate,
            period2: endDate,
            interval: "1d",
          });
          history = transformChartToHistory(emergencyChart);
        } catch (finalError) {
          console.error("All crypto chart attempts failed:", finalError);
          history = [];
        }
      }
    }

    // Sample the data if requested for performance
    if (maxPoints && history && history.length > maxPoints) {
      const step = Math.ceil(history.length / maxPoints);
      history = history.filter((_: any, index: number) => index % step === 0);
    }

    // Ensure history is properly sorted chronologically
    if (history && history.length > 0) {
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

    // Format quote data with comprehensive information for cryptocurrencies
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
      // Crypto-specific adaptations (using available stock fields)
      circulatingSupply: quote.sharesOutstanding || 0, // Using shares as supply
      totalSupply: quote.sharesOutstanding || 0, // Same as circulating for most cryptos
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      averageVolume: quote.averageDailyVolume3Month || 0,
      
      // Technical indicators (may be limited for crypto)
      peRatio: quote.trailingPE || 0, // May not be applicable for crypto
      bookValue: quote.bookValue || 0, // May not be applicable for crypto
      priceToBook: quote.priceToBook || 0, // May not be applicable for crypto
      
      beta: quote.beta || 0,
      exchange: quote.fullExchangeName || "Crypto Exchange",
      currency: quote.currency || "USD",
      shortName: quote.shortName || quote.longName || quote.symbol,
      longName: quote.longName || quote.shortName || quote.symbol,
      
      // Additional crypto-friendly fields
      quoteType: quote.quoteType || "CRYPTOCURRENCY",
      marketState: quote.marketState || "REGULAR",
    };

    return NextResponse.json({
      quote: quoteData,
      history: chartData,
    });
  } catch (error) {
    console.error("Crypto API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cryptocurrency data" },
      { status: 500 }
    );
  }
}

function transformChartToHistory(chart: any) {
  if (!chart || !chart.quotes) {
    return [];
  }

  return chart.quotes
    .map((quote: any) => ({
      date: quote.date,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      volume: quote.volume,
    }))
    .filter((item: any) => item.close !== null && item.close !== undefined);
}
