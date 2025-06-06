# Web3FyGo Postman Collection

A comprehensive Postman collection for testing the Web3FyGo TypeScript API with **PostgreSQL database integration**, product scraping, authentication, and error handling.

## 🚀 New: Database Integration Features

### **Intelligent Caching System**
- **Cache-First Strategy**: PostgreSQL database caching for 10-100x faster responses
- **Automatic Fallback**: Graceful degradation from cache → scraping → static data
- **Separate Categories**: Regular and enhanced endpoints use independent caches
- **Force Refresh**: Bypass cache with `force=true` parameter

### **Database Management**
- **Real-time Statistics**: Monitor database health and usage metrics
- **Session Tracking**: UUID-based scraping session monitoring  
- **Data Cleanup**: Automated old data removal with configurable retention
- **Connection Pooling**: Efficient PostgreSQL connection management

## 📚 Quick Start

### Prerequisites
```bash
# Clone and setup the project
git clone <repository-url>
cd web3fygo

# Start PostgreSQL database
npm run db:up

# Start the API server
npm run dev
```

### Database Access
- **API Server**: http://localhost:3000
- **pgAdmin**: http://localhost:8080
  - Email: `admin@web3fygo.com`
  - Password: `admin123`

## 📂 Collection Structure

### **1. Core Endpoints**
- **GET** `/` - Welcome message and API info
- **GET** `/health` - System health check with metrics
- **GET** `/api/status` - API operational status

### **2. Product Scraping** (🆕 With Database Caching)
- **GET** `/api/products` - Standard Amazon product scraping (up to 20 products)
  - **Cache Behavior**: Uses `electronics` category cache
  - **Force Refresh**: Add `?force=true` to bypass cache
- **GET** `/api/products-enhanced` - Advanced scraping with scrolling (up to 50 products)
  - **Cache Behavior**: Uses `electronics-enhanced` category cache
  - **Enhanced Features**: Browser scrolling, better selectors, more products

### **3. 🆕 Individual Product Details** (With Database Caching)
- **GET** `/api/product/details?url={amazonUrl}` - Scrape specific Amazon product by URL
  - **Cache Behavior**: Uses `product-details` category cache
  - **Enhanced Features**: ASIN extraction, availability, brand, features list
  - **Parameters**: `url` (required Amazon product URL)
  - **Response Time**: ~10-30s for fresh scraping, ~100-500ms for cached data
  - **Additional Data**: Brand, availability status, review count, product features

### **4. 🆕 Database Endpoints**
- **GET** `/api/database/stats` - Comprehensive database statistics
  - Database connection status and pool metrics
  - Product counts by category and recency
  - Scraping session success rates
- **DELETE** `/api/database/cleanup?days={cleanupDays}` - Clean old database records
  - Remove products older than specified days
  - Clean old scraping session logs
- **POST** `/api/products/refresh` - Force refresh product data
  - Bypass cache and scrape fresh data
  - Returns session ID for tracking

### **4. Authentication**
- **GET** `/api/protected` - Token-based authentication test
- **GET** `/api/admin` - Admin-level authentication test

### **5. Error Handling**
- Various error scenarios for testing robustness
- Parameter validation and error response testing

## 🔧 Environment Variables

### **Development Environment**
| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | Local API server |
| `productLimit` | `10` | Standard product limit |
| `enhancedProductLimit` | `30` | Enhanced scraping limit |
| `cleanupDays` | `7` | Database cleanup retention |
| `dbHost` | `localhost` | PostgreSQL host |
| `dbPort` | `5432` | PostgreSQL port |
| `pgAdminUrl` | `http://localhost:8080` | pgAdmin interface |
| `sampleAmazonUrl` | `https://www.amazon.com/dp/B08N5WRWNW` | Sample Amazon product URL for testing |

### **Production Environment**  
| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `https://api.web3fygo.com` | Production API |
| `enhancedProductLimit` | `50` | Higher production limit |
| `cleanupDays` | `30` | Longer retention period |
| `dbHost` | `{{PRODUCTION_DB_HOST}}` | Secured database host |

## 🧪 Testing Scenarios

### **Database Caching Flow**
1. **First Request**: `GET /api/products?trending=amazon&limit=10`
   - Response: "Live Scraping - Just scraped from Amazon"
   - Duration: ~10-30 seconds
   - Data: Saved to PostgreSQL database

2. **Second Request**: Same endpoint
   - Response: "Database Cache - X hours old"  
   - Duration: ~100-500ms (10-100x faster!)
   - Data: Retrieved from PostgreSQL cache

3. **Force Refresh**: `GET /api/products?trending=amazon&limit=10&force=true`
   - Response: "Force refresh - Just scraped fresh data"
   - Duration: ~10-30 seconds
   - Data: Bypassed cache, scraped fresh, updated database

### **Individual Product Details Flow**
1. **First Request**: `GET /api/product/details?url=https://www.amazon.com/dp/B08N5WRWNW`
   - Response: "Successfully retrieved product details via live scraping"
   - Duration: ~10-30 seconds
   - Data: Comprehensive product details saved to database

2. **Second Request**: Same URL
   - Response: "Successfully retrieved product details from database cache"
   - Duration: ~100-500ms (10-100x faster!)
   - Data: Retrieved from PostgreSQL cache with all details

### **Database Management**
```bash
# Get database statistics
GET /api/database/stats
# Returns: connection status, product counts, session metrics

# Clean old data (older than 7 days)
DELETE /api/database/cleanup?days=7
# Returns: number of products and sessions cleaned

# Force refresh all products
POST /api/products/refresh  
# Returns: fresh product data with session ID
```

## 📊 Response Examples

### **Database Statistics**
```json
{
  "success": true,
  "data": {
    "database": {
      "connected": true,
      "status": "healthy",
      "connectionPool": { "total": 20, "idle": 18, "waiting": 0 }
    },
    "products": {
      "total": 25,
      "categories": { "electronics": 15, "electronics-enhanced": 10 },
      "recent": { "last24Hours": 25, "lastWeek": 25 }
    },
    "sessions": {
      "total": 12,
      "successful": 10,
      "failed": 2,
      "successRate": "83.33%"
    }
  }
}
```

### **Cached Product Response**
```json
{
  "success": true,
  "message": "Database Cache (electronics) - 2 hours old",
  "data": {
    "products": [
      {
        "rank": "1",
        "title": "Product Title",
        "price": "$29.99",
        "rating": "4.5 out of 5 stars",
        "image": "https://...",
        "link": "https://amazon.com/...",
        "source": "Amazon Best Sellers (Electronics) - ASIN: B123456789",
        "scrapedAt": "2024-06-06T10:00:00.000Z"
      }
    ],
    "totalFound": 10,
    "source": "PostgreSQL Database Cache",
    "cacheAge": "2 hours",
    "sessionId": "uuid-session-id"
  }
}
```

### **Individual Product Details Response**
```json
{
  "success": true,
  "message": "Successfully retrieved product details via live scraping",
  "data": {
    "product": {
      "rank": "1",
      "title": "Echo Dot (5th Gen) | Smart speaker with bigger vibrant sound and Alexa",
      "price": "$49.99",
      "rating": "4.7 out of 5 stars",
      "image": "https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1500_.jpg",
      "link": "https://www.amazon.com/dp/B08N5WRWNW",
      "source": "Amazon Product Detail - ASIN: B08N5WRWNW",
      "scrapedAt": "2024-06-06T12:00:00.000Z",
      "asin": "B08N5WRWNW",
      "availability": "In Stock",
      "reviewCount": "50,000+ reviews",
      "brand": "Amazon",
      "features": [
        "Bigger vibrant sound – In a compact design, Echo Dot delivers crisp vocals and balanced bass for full sound.",
        "Your favorite music and content – Play music, audiobooks, and podcasts from Amazon Music, Apple Music, Spotify, and others.",
        "Alexa is happy to help – Ask Alexa for weather updates, set timers, answer questions, tell jokes, and more."
      ]
    },
    "source": "Live Scraping - Just scraped product details",
    "parameters": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW",
      "maxAgeHours": 24
    },
    "sessionId": "uuid-session-id"
  }
}
```

## 🛠️ Database Management Commands

```bash
# Database lifecycle
npm run db:up        # Start PostgreSQL + pgAdmin
npm run db:down      # Stop database services  
npm run db:reset     # Reset with fresh schema
npm run db:logs      # View database logs

# Development workflow
npm run dev          # Start API server (auto-connects to DB)
npm test             # Run tests (includes database tests)
```

## 🔍 Monitoring & Debugging

### **Performance Monitoring**
- **Cache Hit Rate**: Monitor via `/api/database/stats`
- **Response Times**: Compare cached vs fresh scraping
- **Success Rate**: Track scraping session success/failure

### **pgAdmin Database Browser**
- **Tables**: `products`, `scraping_sessions`
- **Indexes**: Optimized for ASIN, category, scraped_at
- **Views**: Real-time data exploration and analysis

### **Logging & Debugging**
```bash
# View API logs
npm run dev

# View database logs  
npm run db:logs

# Test specific endpoint
curl "http://localhost:3000/api/database/stats"
```

## 🚨 Important Notes

### **Cache Behavior**
- **TTL**: 24 hours default (configurable via `CACHE_MAX_AGE_HOURS`)
- **Categories**: `electronics` vs `electronics-enhanced` vs `product-details` are separate
- **Force Refresh**: Available for list endpoints with `?force=true` parameter
- **URL-Based Caching**: Individual product details are cached by specific URL
- **Fallback**: Database → HTTP Scraping → Static fallback data

### **Rate Limiting**
- **Amazon Scraping**: Respects rate limits to avoid blocking
- **Database Queries**: No rate limiting (local PostgreSQL)
- **Concurrent Requests**: Database handles multiple simultaneous requests

### **Production Considerations**
- **Environment Variables**: Use secure environment variables in production
- **Database Security**: Configure PostgreSQL authentication and SSL
- **Monitoring**: Set up database connection monitoring and alerting

## 📋 Import Instructions

### **Postman Collection**
1. Download `Web3FyGo-API.postman_collection.json`
2. Import into Postman: **File → Import → Upload Files**
3. Select appropriate environment (Development/Production)

### **Environment Setup**
1. Import `Web3FyGo-Development.postman_environment.json` for local testing
2. Import `Web3FyGo-Production.postman_environment.json` for production
3. Set environment variables for database credentials

## 🎯 Best Practices

### **Testing Strategy**
1. **Start with Health Check**: Verify API is running
2. **Test Database Stats**: Confirm database connection
3. **First Product Request**: Trigger fresh scraping
4. **Second Product Request**: Verify caching works
5. **Force Refresh**: Test cache bypass functionality

### **Development Workflow**
1. **Database First**: Always start database with `npm run db:up`
2. **Environment Selection**: Use Development environment for local testing
3. **Monitor Logs**: Watch console for cache hits/misses
4. **pgAdmin Review**: Use web interface to inspect saved data

---

## 📞 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check `DATABASE-SETUP.md` for detailed database configuration
- **Postman Updates**: See `POSTMAN-UPDATES.md` for latest changes

---

*Collection maintained by Web3FyGo Development Team*  
*Last updated: June 6, 2024 - PostgreSQL Integration Release* 