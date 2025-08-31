# Stock News Dashboard

This project now includes a comprehensive stock news dashboard that displays news articles for various stocks with sentiment analysis and filtering capabilities.

## Features

### News API Endpoint

- **Endpoint**: `/api/news`
- **Method**: GET
- **Parameters**:
  - `symbol` (required): Stock symbol (e.g., AMZN, MSFT, NVDA)
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of articles per page (default: 10)
  - `sentiment` (optional): Filter by sentiment ("POSITIVE", "NEGATIVE", or omit for all)

### Available Stocks

The news dashboard supports the following stocks:

- **AMZN** - Amazon
- **AVGO** - Broadcom
- **COST** - Costco
- **GOOG** - Alphabet (Google)
- **META** - Meta Platforms
- **MSFT** - Microsoft
- **NFLX** - Netflix
- **NVDA** - NVIDIA
- **ORCL** - Oracle
- **TSM** - Taiwan Semiconductor Manufacturing

### News Dashboard Features

1. **Stock Selection**: Click on any available stock to view its news
2. **Sentiment Filtering**: Filter news by positive, negative, or view all articles
3. **Pagination**: Navigate through multiple pages of news articles
4. **Article Display**: Each article shows:
   - Summary text
   - Sentiment analysis with confidence score
   - Direct link to the full article
   - Sentiment indicators (trending up/down icons)

### API Response Structure

```json
{
  "symbol": "AMZN",
  "news": [
    {
      "link": "https://...",
      "artical_content": "Full article content...",
      "sentiment": [
        {
          "label": "POSITIVE",
          "score": 0.9767
        }
      ],
      "summary": {
        "chunks": [...],
        "final": [...]
      }
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 10,
  "hasMore": false,
  "sentiment": "ALL"
}
```

## Usage

### Frontend Integration

The news dashboard is integrated into the main application with a new "Market News" tab. Users can:

1. Navigate to the "Market News" tab from the main navigation
2. Select a stock from the available options
3. Filter news by sentiment if desired
4. Browse through paginated news articles
5. Click on article links to read full content

### API Usage Examples

#### Get all news for Amazon

```bash
GET /api/news?symbol=AMZN
```

#### Get positive news for NVIDIA

```bash
GET /api/news?symbol=NVDA&sentiment=POSITIVE
```

#### Get first 5 articles for Microsoft

```bash
GET /api/news?symbol=MSFT&page=1&limit=5
```

## Data Source

News data is stored in JSON files located in `src/data/` directory. Each stock has its own file:

- `AMZN_news.json`
- `AVGO_news.json`
- `COST_news.json`
- `GOOG_news.json`
- `META_news.json`
- `MSFT_news.json`
- `NFLX_news.json`
- `NVDA_news.json`
- `ORCL_news.json`
- `TSM_news.json`

## Technical Implementation

### Components

- **NewsDashboard**: Main news display component
- **NavigationHeader**: Updated to include news tab
- **Main Page**: Updated to handle news tab state

### API Implementation

- **File System Reading**: Uses Node.js `fs` module to read JSON files
- **Pagination**: Server-side pagination for performance
- **Sentiment Filtering**: Client-side filtering based on sentiment labels
- **Error Handling**: Comprehensive error handling for missing files and invalid requests

### State Management

- Stock selection state
- Pagination state
- Sentiment filter state
- Loading and error states

## Future Enhancements

1. **Real-time Updates**: Integrate with live news APIs
2. **Search Functionality**: Add text search within news articles
3. **Date Filtering**: Filter news by publication date
4. **News Categories**: Categorize news by type (earnings, product launches, etc.)
5. **User Preferences**: Save user's preferred stocks and settings
6. **News Alerts**: Push notifications for important news

## Getting Started

1. Ensure all news JSON files are present in `src/data/`
2. Start the development server: `npm run dev`
3. Navigate to the application and click on the "Market News" tab
4. Select a stock to view its news articles
5. Use sentiment filters and pagination to navigate through articles

## API Testing

Test the news API endpoints:

```bash
# Test basic functionality
curl "http://localhost:3000/api/news?symbol=AMZN"

# Test with pagination
curl "http://localhost:3000/api/news?symbol=MSFT&page=1&limit=3"

# Test sentiment filtering
curl "http://localhost:3000/api/news?symbol=NVDA&sentiment=POSITIVE"
```

The news dashboard provides a comprehensive view of market sentiment and news for major stocks, helping users make informed investment decisions based on current market news and sentiment analysis.
