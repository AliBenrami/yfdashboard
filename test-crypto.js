// Test script to check what crypto symbols work with Yahoo Finance
import yahooFinance from "yahoo-finance2";

async function testCryptoSymbols() {
  const testSymbols = [
    'BTC-USD',
    'ETH-USD', 
    'DOGE-USD',
    'ADA-USD',
    'BNB-USD'
  ];
  
  for (const symbol of testSymbols) {
    try {
      const quote = await yahooFinance.quote(symbol);
      console.log(`✅ ${symbol}: ${quote.regularMarketPrice} (${quote.shortName})`);
    } catch (error) {
      console.log(`❌ ${symbol}: Failed - ${error.message}`);
    }
  }
}

testCryptoSymbols();
