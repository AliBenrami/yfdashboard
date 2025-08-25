import { NextRequest, NextResponse } from "next/server";

// Major cryptocurrencies with their Yahoo Finance symbols
// Note: Yahoo Finance uses different symbols for crypto (e.g., BTC-USD)
const ALL_CRYPTOS = [
  // Major Cryptocurrencies
  "BTC-USD",   // Bitcoin
  "ETH-USD",   // Ethereum
  "BNB-USD",   // Binance Coin
  "XRP-USD",   // Ripple
  "ADA-USD",   // Cardano
  "DOGE-USD",  // Dogecoin
  "MATIC-USD", // Polygon
  "SOL-USD",   // Solana
  "DOT-USD",   // Polkadot
  "AVAX-USD",  // Avalanche
  "SHIB-USD",  // Shiba Inu
  "TRX-USD",   // TRON
  "ETC-USD",   // Ethereum Classic
  "LTC-USD",   // Litecoin
  "ATOM-USD",  // Cosmos
  "LINK-USD",  // Chainlink
  "XLM-USD",   // Stellar
  "BCH-USD",   // Bitcoin Cash
  "ALGO-USD",  // Algorand
  "VET-USD",   // VeChain
  "FIL-USD",   // Filecoin
  "ICP-USD",   // Internet Computer
  "THETA-USD", // Theta Network
  "EOS-USD",   // EOS
  "AAVE-USD",  // Aave
  "MKR-USD",   // Maker
  "GRT-USD",   // The Graph
  "SNX-USD",   // Synthetix
  "COMP-USD",  // Compound
  "SUSHI-USD", // SushiSwap
  "YFI-USD",   // yearn.finance
  "UNI-USD",   // Uniswap
  "CRV-USD",   // Curve DAO Token
  "1INCH-USD", // 1inch
  "ZRX-USD",   // 0x
  "BAT-USD",   // Basic Attention Token
  "ENJ-USD",   // Enjin Coin
  "MANA-USD",  // Decentraland
  "SAND-USD",  // The Sandbox
  "AXS-USD",   // Axie Infinity
  "CHZ-USD",   // Chiliz
  "HOT-USD",   // Holo
  "HBAR-USD",  // Hedera
  "NEAR-USD",  // NEAR Protocol
  "FTM-USD",   // Fantom
  "ONE-USD",   // Harmony
  "EGLD-USD",  // MultiversX
  "FLOW-USD",  // Flow
  "XTZ-USD",   // Tezos
  "KSM-USD",   // Kusama
  "WAVES-USD", // Waves
  "ZEC-USD",   // Zcash
  "DASH-USD",  // Dash
  "DCR-USD",   // Decred
  "SC-USD",    // Siacoin
  "ZEN-USD",   // Horizen
  "DGB-USD",   // DigiByte
  "RVN-USD",   // Ravencoin
  "BTG-USD",   // Bitcoin Gold
  "QTUM-USD",  // Qtum
  "XEM-USD",   // NEM
  "STEEM-USD", // Steem
  "LSK-USD",   // Lisk
  "ARDR-USD",  // Ardor
  "KNC-USD",   // Kyber Network
  "LRC-USD",   // Loopring
  "STORJ-USD", // Storj
  "REP-USD",   // Augur
  "DNT-USD",   // district0x
  "CVC-USD",   // Civic
  "GNT-USD",   // Golem
  "ANT-USD",   // Aragon
  "MLN-USD",   // Melon
  "NMR-USD",   // Numeraire
  "OCEAN-USD", // Ocean Protocol
  "REN-USD",   // Ren
  "LPT-USD",   // Livepeer
  "MIR-USD",   // Mirror Protocol
  "ALPHA-USD", // Alpha Finance Lab
  "RUNE-USD",  // THORChain
  "PERP-USD",  // Perpetual Protocol
  "INJ-USD",   // Injective Protocol
  "SRM-USD",   // Serum
  "RAY-USD",   // Raydium
];

// Company/Project names for cryptocurrencies
const CRYPTO_NAMES: { [key: string]: string } = {
  "BTC-USD": "Bitcoin",
  "ETH-USD": "Ethereum",
  "BNB-USD": "Binance Coin",
  "XRP-USD": "XRP (Ripple)",
  "ADA-USD": "Cardano",
  "DOGE-USD": "Dogecoin",
  "MATIC-USD": "Polygon",
  "SOL-USD": "Solana",
  "DOT-USD": "Polkadot",
  "AVAX-USD": "Avalanche",
  "SHIB-USD": "Shiba Inu",
  "TRX-USD": "TRON",
  "ETC-USD": "Ethereum Classic",
  "LTC-USD": "Litecoin",
  "ATOM-USD": "Cosmos",
  "LINK-USD": "Chainlink",
  "XLM-USD": "Stellar Lumens",
  "BCH-USD": "Bitcoin Cash",
  "ALGO-USD": "Algorand",
  "VET-USD": "VeChain",
  "FIL-USD": "Filecoin",
  "ICP-USD": "Internet Computer",
  "THETA-USD": "Theta Network",
  "EOS-USD": "EOS",
  "AAVE-USD": "Aave",
  "MKR-USD": "Maker",
  "GRT-USD": "The Graph",
  "SNX-USD": "Synthetix",
  "COMP-USD": "Compound",
  "SUSHI-USD": "SushiSwap",
  "YFI-USD": "yearn.finance",
  "UNI-USD": "Uniswap",
  "CRV-USD": "Curve DAO Token",
  "1INCH-USD": "1inch",
  "ZRX-USD": "0x Protocol",
  "BAT-USD": "Basic Attention Token",
  "ENJ-USD": "Enjin Coin",
  "MANA-USD": "Decentraland",
  "SAND-USD": "The Sandbox",
  "AXS-USD": "Axie Infinity",
  "CHZ-USD": "Chiliz",
  "HOT-USD": "Holo",
  "HBAR-USD": "Hedera Hashgraph",
  "NEAR-USD": "NEAR Protocol",
  "FTM-USD": "Fantom",
  "ONE-USD": "Harmony",
  "EGLD-USD": "MultiversX",
  "FLOW-USD": "Flow",
  "XTZ-USD": "Tezos",
  "KSM-USD": "Kusama",
  "WAVES-USD": "Waves",
  "ZEC-USD": "Zcash",
  "DASH-USD": "Dash",
  "DCR-USD": "Decred",
  "SC-USD": "Siacoin",
  "ZEN-USD": "Horizen",
  "DGB-USD": "DigiByte",
  "RVN-USD": "Ravencoin",
  "BTG-USD": "Bitcoin Gold",
  "QTUM-USD": "Qtum",
  "XEM-USD": "NEM",
  "STEEM-USD": "Steem",
  "LSK-USD": "Lisk",
  "ARDR-USD": "Ardor",
  "KNC-USD": "Kyber Network",
  "LRC-USD": "Loopring",
  "STORJ-USD": "Storj",
  "REP-USD": "Augur",
  "DNT-USD": "district0x",
  "CVC-USD": "Civic",
  "GNT-USD": "Golem",
  "ANT-USD": "Aragon",
  "MLN-USD": "Melon",
  "NMR-USD": "Numeraire",
  "OCEAN-USD": "Ocean Protocol",
  "REN-USD": "Ren",
  "LPT-USD": "Livepeer",
  "MIR-USD": "Mirror Protocol",
  "ALPHA-USD": "Alpha Finance Lab",
  "RUNE-USD": "THORChain",
  "PERP-USD": "Perpetual Protocol",
  "INJ-USD": "Injective Protocol",
  "SRM-USD": "Serum",
  "RAY-USD": "Raydium",
};

// Ensure no duplicates in the crypto list
const UNIQUE_CRYPTOS = [...new Set(ALL_CRYPTOS)];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Filter cryptos based on search query
    let filteredCryptos = UNIQUE_CRYPTOS;
    if (search) {
      filteredCryptos = UNIQUE_CRYPTOS.filter((crypto) =>
        crypto.toLowerCase().includes(search.toLowerCase()) ||
        (CRYPTO_NAMES[crypto] && CRYPTO_NAMES[crypto].toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCryptos = filteredCryptos.slice(startIndex, endIndex);

    // Add crypto names to the response
    const cryptosWithNames = paginatedCryptos.map((symbol) => ({
      symbol,
      companyName: CRYPTO_NAMES[symbol] || symbol.replace("-USD", ""),
    }));

    // Simulate API delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 100));

    return NextResponse.json({
      cryptos: cryptosWithNames,
      total: filteredCryptos.length,
      page,
      limit,
      hasMore: endIndex < filteredCryptos.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cryptocurrencies" },
      { status: 500 }
    );
  }
}
