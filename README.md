# 📈 YFin Dashboard

A modern, high-performance stock and cryptocurrency market dashboard built with Next.js, featuring real-time data visualization and comprehensive market analytics.

-----

### 🌟 Features

  * **Real-Time Stock & Crypto Data**: Live quotes and historical data powered by Yahoo Finance for both traditional stocks and cryptocurrencies.
  * **Interactive Charts**: High-performance canvas-based charts with hover interactions and tooltips.
  * **Comprehensive Details**: View price information, volume data, technical indicators, and 52-week ranges for both stocks and crypto assets.
  * **Multiple Time Frames**: 1 week to maximum historical data (1W, 1M, 3M, 6M, 1Y, 2Y, 5Y, MAX).
  * **Search & Discovery**: Browse and search through 200+ major stocks and popular cryptocurrencies across various sectors.
  * **Popular Assets**: Quick access to trending assets (AAPL, MSFT, GOOGL, AMZN, TSLA, BTC-USD, ETH-USD, etc.).
  * **Dark/Light Theme**: Toggle between dark and light modes.
  * **Responsive Design**: Optimized for desktop and mobile devices.
  * **Performance Optimized**: Server-side data sampling for large datasets and efficient caching.

-----

### 🚀 Tech Stack

  * **Framework**: `Next.js 15` with App Router
  * **Language**: `TypeScript`
  * **Styling**: `Tailwind CSS`
  * **UI Components**: `Radix UI` primitives with custom components
  * **Data Fetching**: `TanStack Query` (React Query) for caching and state management
  * **Charts**: Custom Canvas-based chart component for optimal performance
  * **Stock & Crypto Data**: Yahoo Finance API via `yahoo-finance2`
  * **Notifications**: `Sonner` for toast notifications

-----

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Ali-Ben-r/yfdashboard.git
cd yfindashboard

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open your browser: Navigate to http://localhost:3000 to see the application.

-----

### 🎯 Usage

#### Dashboard Overview

  * **Chart Visualization**: Select any stock or cryptocurrency and choose a time frame to view interactive price charts.
  * **Real-Time Data**: Asset prices update automatically with live market data.
  * **Detailed Analytics**: View comprehensive information including P/E ratio, market cap, volume, and more for stocks, and relevant metrics for cryptocurrencies.

#### Navigation

  * **Popular Assets**: Click on any of the popular stock or cryptocurrency buttons to quickly switch between major assets.
  * **Asset Search**: Use the search functionality to find specific stocks or cryptos from the database.
  * **Time Frame Selection**: Choose from multiple time frames to analyze short-term or long-term trends.

-----

### 🏗️ Project Structure

```bash
yfindashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── stock/         # Individual stock data endpoint
│   │   │   └── stocks/        # Stock list endpoint with pagination
│   │   │   ├── crypto/        # Individual crypto data endpoint
│   │   │   └── cryptos/       # Crypto list endpoint with pagination
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Main dashboard page
│   │   └── providers.tsx      # React Query provider setup
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components (Radix-based)
│   │   ├── FastChart.tsx     # High-performance canvas chart
│   │   └── changeTheme.tsx   # Theme toggle component
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions
├── public/                   # Static assets
└── configuration files
```

-----

### 🔧 API Endpoints

#### Asset Data (`/api/asset`)

  * `GET /api/asset?symbol=AAPL&days=30&sample=200`
  * `GET /api/asset?symbol=BTC-USD&days=30&sample=200`
      * Fetches individual stock or crypto quote and historical data.
      * **Parameters**: `symbol` (required), `days` (default: 30, use 0 for MAX), `sample` (optional).

#### Asset List (`/api/assets`)

  * `GET /api/assets?page=1&search=apple&limit=20`
  * `GET /api/assets?page=1&search=bitcoin&limit=20`
      * Fetches paginated list of available assets.
      * **Parameters**: `page` (default: 1), `search`, `limit` (default: 20).

-----

### ⚡ Performance Features

  * **Data Sampling**: Large datasets are automatically sampled server-side for optimal chart performance.
  * **Smart Caching**: TanStack Query provides intelligent caching with a 5-minute stale time.
  * **Canvas Rendering**: Charts use HTML5 Canvas for smooth 60fps interactions.
  * **Code Splitting**: Next.js automatically splits code for optimal loading.
  * **Image Optimization**: Next.js Image component for optimized asset loading.

-----

### 🎨 Customization

#### Adding New Assets

The existing `yahoo-finance2` package can fetch crypto data using symbols like `BTC-USD`. You will need to update the logic in `/src/app/api/assets/route.ts` to include a list of cryptocurrencies and handle their specific ticker symbols.

#### Modifying Chart Appearance

Customize the chart styling in `/src/components/FastChart.tsx`:

  * Colors and gradients
  * Grid line styles
  * Tooltip appearance
  * Hover interactions

#### Theme Customization

Update Tailwind configuration in `tailwind.config.js` and CSS variables in `src/app/globals.css`.

-----

### 🚀 Deployment

#### Vercel (Recommended)

  * Connect your repository to Vercel
  * Deploy automatically with zero configuration

#### Other Platforms

```bash
# Build the application
npm run build

# Start the production server
npm start
```

-----

### 📄 License

This project is open source and available under the MIT License.

-----

### 🤝 Contributing

Contributions are welcome\! Please feel free to submit a Pull Request.

Main Contributor: Ali Benrami, Minhnimum

-----

### 📞 Support

If you have any questions or need help with the project, please open an issue in the repository.
