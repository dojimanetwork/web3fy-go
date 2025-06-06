# Web3FyGo Postman Collection Updates

## Latest Update: June 6, 2024 - Individual Product Details + PostgreSQL Integration 🚀

### 🗄️ **NEW: Database Endpoints**

The Web3FyGo API now includes comprehensive PostgreSQL integration with intelligent caching! The following new endpoints have been added to the collection:

#### **Database Management**
- **GET** `/api/database/stats` - Get comprehensive database statistics
- **DELETE** `/api/database/cleanup?days={cleanupDays}` - Clean old database records
- **POST** `/api/products/refresh` - Force refresh product data

#### **Enhanced Product Endpoints**
- **GET** `/api/products?force=true` - Bypass cache and scrape fresh data
- **GET** `/api/products-enhanced?force=true` - Enhanced products with force refresh

#### **🆕 Individual Product Details**
- **GET** `/api/product/details?url={amazonUrl}` - Scrape specific Amazon product by URL
  - **Features**: ASIN extraction, availability status, brand, review count, features list
  - **Cache Category**: Uses `product-details` category with URL-based caching
  - **Response**: Single product object with comprehensive details

### 🔧 **Updated Environment Variables**

Both Development and Production environments now include:

#### **Database Configuration**
- `cleanupDays` - Days for database cleanup (Development: 7, Production: 30)
- `dbHost` - Database host (localhost for dev, secured for prod)
- `dbPort` - PostgreSQL port (5432)
- `dbName` - Database name (web3fygo for dev, web3fygo_prod for prod)

#### **pgAdmin Access**
- `pgAdminUrl` - pgAdmin web interface URL
- `pgAdminEmail` - pgAdmin login email
- `pgAdminPassword` - pgAdmin login password (secured in production)

#### **🆕 Testing Variables**
- `sampleAmazonUrl` - Sample Amazon product URL for testing individual product details

### 📊 **Database Features**

#### **Intelligent Caching System**
- **Cache-First Strategy**: API checks PostgreSQL before scraping
- **Configurable TTL**: 24-hour default cache expiration
- **Separate Categories**: Regular and enhanced endpoints use different cache categories
- **Force Refresh**: Bypass cache with `force=true` parameter

#### **Session Tracking**
- **UUID Session IDs**: Track each scraping operation
- **Success/Failure Monitoring**: Monitor scraping reliability
- **Database Statistics**: View comprehensive usage metrics

### 🧪 **Updated Test Scripts**

All product endpoint tests now include:
- **Cache Detection**: Identify when data comes from database cache
- **Performance Logging**: Log response times and data sources  
- **Database Health**: Verify database connection in stats endpoint
- **Session Validation**: Ensure proper session tracking

### 🚀 **Performance Improvements**

#### **Response Time Benefits**
- **Cached Requests**: 10-100x faster than scraping
- **Reduced Amazon Load**: Fewer direct scraping requests
- **Better Reliability**: Fallback to cache when scraping fails

#### **Data Persistence**
- **Permanent Storage**: Products saved to PostgreSQL
- **Historical Data**: Track scraping sessions over time
- **Cleanup Management**: Automatic old data removal

### 🔍 **Testing Scenarios**

#### **Cache Testing**
1. **First Request**: Should scrape and save to database
2. **Second Request**: Should use cached data (much faster)
3. **Force Refresh**: Should bypass cache and scrape fresh data
4. **Database Stats**: Should show increasing product counts

#### **Error Handling**
- **Database Down**: Graceful fallback to direct scraping
- **Cache Expired**: Automatic fresh scraping and re-caching
- **Scraping Failed**: Uses existing cache or static fallback

### 📱 **Collection Structure**

The collection now includes these organized sections:

1. **Core Endpoints** - Basic API functionality
2. **API Information** - Status and info endpoints  
3. **Authentication** - Token-based authentication
4. **Product Scraping** - Amazon product lists (with caching)
5. **🆕 Database Endpoints** - PostgreSQL management and statistics
6. **🆕 Individual Product Details** - URL-based product scraping with enhanced data
7. **Error Handling** - Various error scenarios

### 🛠️ **Local Development Setup**

#### **Prerequisites**
```bash
# Start PostgreSQL with Docker Compose
npm run db:up

# Verify database connection
npm run dev
```

#### **pgAdmin Access**
- **URL**: http://localhost:8080
- **Email**: admin@web3fygo.com  
- **Password**: admin123

#### **Database Management Commands**
```bash
npm run db:up      # Start PostgreSQL + pgAdmin
npm run db:down    # Stop database services
npm run db:reset   # Reset database with fresh data
npm run db:logs    # View database logs
```

### 🔐 **Production Configuration**

Production environment uses secured variables:
- `{{PRODUCTION_API_TOKEN}}` - API authentication token
- `{{PRODUCTION_DB_HOST}}` - Database host URL
- `{{PRODUCTION_PGADMIN_URL}}` - pgAdmin web interface
- `{{PRODUCTION_PGADMIN_EMAIL}}` - Admin email
- `{{PRODUCTION_PGADMIN_PASSWORD}}` - Admin password

### 📈 **Monitoring & Analytics**

#### **Database Statistics Response**
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

### 🚨 **Important Notes**

- **Cache Behavior**: First request to any endpoint will be slower (scraping), subsequent requests will be much faster (cached)
- **Categories**: Regular `/api/products` and `/api/products-enhanced` use separate cache categories
- **Force Refresh**: Use `force=true` parameter or `/api/products/refresh` endpoint to bypass cache
- **Database Health**: Monitor via `/api/database/stats` endpoint
- **Cleanup**: Use `/api/database/cleanup` to remove old data

---

## Previous Updates

### November 30, 2024 - Enhanced Scraping
- Added `/api/products-enhanced` endpoint with browser scrolling
- Improved Amazon selector targeting with real ASIN extraction  
- Enhanced error handling with comprehensive fallback strategies

### November 15, 2024 - Authentication & Error Handling
- Added token-based authentication middleware
- Comprehensive error handling test scenarios
- Improved response validation and logging

### October 1, 2024 - Initial Collection
- Basic product scraping endpoints
- Health check and API status endpoints
- Development and production environment configurations

---

*Collection maintained by Web3FyGo Development Team*
*Last updated: June 6, 2024* 