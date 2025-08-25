# 📈 YFin Dashboard

A modern, high-performance stock market dashboard built with Next.js, featuring real-time stock data visualization and comprehensive market analytics.

## 🌟 Features

- **Real-Time Stock Data**: Live stock quotes and historical data powered by Yahoo Finance
- **Interactive Charts**: High-performance canvas-based charts with hover interactions and tooltips
- **Comprehensive Stock Details**: View price information, volume data, technical indicators, and 52-week ranges
- **Multiple Time Frames**: 1 week to maximum historical data (1W, 1M, 3M, 6M, 1Y, 2Y, 5Y, MAX)
- **Stock Search & Discovery**: Browse and search through 200+ major stocks across various sectors
- **Popular Stocks**: Quick access to trending stocks (AAPL, MSFT, GOOGL, AMZN, TSLA, etc.)
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Optimized for desktop and mobile devices
- **Performance Optimized**: Server-side data sampling for large datasets and efficient caching

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with custom components
- **Data Fetching**: TanStack Query (React Query) for caching and state management
- **Charts**: Custom Canvas-based chart component for optimal performance
- **Stock Data**: Yahoo Finance API via `yahoo-finance2`
- **Notifications**: Sonner for toast notifications

## 📦 Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd yfindashboard
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🎯 Usage

### Dashboard Overview

- **Chart Visualization**: Select any stock and choose a time frame to view interactive price charts
- **Real-Time Data**: Stock prices update automatically with live market data
- **Detailed Analytics**: View comprehensive stock information including P/E ratio, market cap, volume, and more

### Navigation

- **Popular Stocks**: Click on any of the popular stock buttons to quickly switch between major stocks
- **Stock Search**: Use the search functionality to find specific stocks from our database of 200+ stocks
- **Time Frame Selection**: Choose from multiple time frames to analyze short-term or long-term trends

### Features

- **Interactive Charts**: Hover over chart points to see detailed price information
- **Theme Toggle**: Switch between light and dark themes using the theme toggle button
- **Data Refresh**: Use the refresh button to get the latest stock data
- **Pagination**: Navigate through the complete stock list with built-in pagination

## 🏗️ Project Structure

```
yfindashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── stock/         # Individual stock data endpoint
│   │   │   └── stocks/        # Stock list endpoint with pagination
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

## 🔧 API Endpoints

### Stock Data (`/api/stock`)

- **GET** `/api/stock?symbol=AAPL&days=30&sample=200`
- Fetches individual stock quote and historical data
- Parameters:
  - `symbol`: Stock symbol (required)
  - `days`: Number of days for historical data (default: 30, use 0 for MAX)
  - `sample`: Optional data sampling for performance optimization

### Stock List (`/api/stocks`)

- **GET** `/api/stocks?page=1&search=apple&limit=20`
- Fetches paginated list of available stocks
- Parameters:
  - `page`: Page number (default: 1)
  - `search`: Search query for filtering stocks
  - `limit`: Number of stocks per page (default: 20)

## ⚡ Performance Features

- **Data Sampling**: Large datasets are automatically sampled server-side for optimal chart performance
- **Smart Caching**: TanStack Query provides intelligent caching with 5-minute stale time
- **Canvas Rendering**: Charts use HTML5 Canvas for smooth 60fps interactions
- **Code Splitting**: Next.js automatically splits code for optimal loading
- **Image Optimization**: Next.js Image component for optimized asset loading

## 🎨 Customization

### Adding New Stock Sectors

Edit `/src/app/api/stocks/route.ts` to add new stock symbols to the `ALL_STOCKS` array.

### Modifying Chart Appearance

Customize the chart styling in `/src/components/FastChart.tsx`:

- Colors and gradients
- Grid line styles
- Tooltip appearance
- Hover interactions

### Theme Customization

Update Tailwind configuration in `tailwind.config.js` and CSS variables in `src/app/globals.css`.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to [Vercel](https://vercel.com)
2. Deploy automatically with zero configuration

### Other Platforms

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Main Contributer: Ali Benrami, Minhnimum

## 📞 Support

If you have any questions or need help with the project, please open an issue in the repository.
