# Database Setup Guide

This guide explains how to set up and use PostgreSQL with the Web3FyGo project using Docker Compose.

## Quick Start

### 1. Start PostgreSQL with Docker Compose

```bash
# Start the database services
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 2. Environment Variables

Create a `.env` file in the project root with the following database configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web3fygo
DB_USER=postgres
DB_PASSWORD=password

# Optional: Cache settings
CACHE_MAX_AGE_HOURS=24
SKIP_BROWSER=false
```

### 3. Verify Database Connection

```bash
# Test database connection
npm run dev

# The app will automatically:
# - Test the database connection
# - Initialize tables if they don't exist
# - Display connection status
```

## Services Included

### PostgreSQL Database
- **Host**: localhost:5432
- **Database**: web3fygo
- **Username**: postgres
- **Password**: password
- **Container**: web3fygo-postgres

### pgAdmin (Database Admin Panel)
- **URL**: http://localhost:8080
- **Email**: admin@web3fygo.com
- **Password**: admin123

## Database Schema

### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) UNIQUE,           -- Amazon product identifier
    rank INTEGER,                      -- Product ranking
    title TEXT NOT NULL,               -- Product title
    price VARCHAR(50),                 -- Product price
    rating VARCHAR(50),                -- Customer rating
    image_url TEXT,                    -- Product image URL
    product_url TEXT,                  -- Amazon product URL
    source VARCHAR(100),               -- Data source info
    category VARCHAR(50) DEFAULT 'electronics',
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Scraping Sessions Table
```sql
CREATE TABLE scraping_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL,
    source VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    products_found INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

## API Behavior with Database

### Data Flow
1. **Check Cache**: API first checks if fresh data exists in PostgreSQL
2. **Cache Hit**: Returns data from database (faster response)
3. **Cache Miss**: Scrapes new data, saves to database, returns results
4. **Data Freshness**: Configurable cache duration (default: 24 hours)
5. **Separate Categories**: Regular and enhanced endpoints use different cache categories

### Cache Benefits
- **Performance**: Database queries are much faster than web scraping
- **Reliability**: Cached data available even if scraping fails
- **Rate Limiting**: Reduces Amazon scraping frequency
- **Data Persistence**: Historical data tracking and analysis

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f postgres
docker-compose logs -f pgadmin

# Stop services
docker-compose stop

# Remove services and data
docker-compose down -v

# Restart services
docker-compose restart

# Update images
docker-compose pull
docker-compose up -d
```

## Database Management

### Using pgAdmin
1. Open http://localhost:8080
2. Login with admin@web3fygo.com / admin123
3. Add server:
   - **Name**: Web3FyGo Local
   - **Host**: postgres (container name)
   - **Port**: 5432
   - **Database**: web3fygo
   - **Username**: postgres
   - **Password**: password

### Using Command Line
```bash
# Connect to PostgreSQL container
docker exec -it web3fygo-postgres psql -U postgres -d web3fygo

# Run SQL queries
SELECT COUNT(*) FROM products;
SELECT * FROM fresh_products LIMIT 10;
SELECT * FROM get_product_stats();
```

## API Endpoints with Database

### Products Endpoints with Cache
```bash
# Regular endpoint - will use cache if available, otherwise scrape
curl "http://localhost:3000/api/products?trending=amazon&limit=10"

# Enhanced endpoint - with scrolling and separate cache
curl "http://localhost:3000/api/products-enhanced?trending=amazon&limit=30"

# 🆕 Individual product details - scrape specific Amazon product by URL
curl "http://localhost:3000/api/product/details?url=https://www.amazon.com/dp/B08N5WRWNW"

# Response includes source information:
{
  "data": {
    "source": "Database Cache (Enhanced) - 2 hours old" // or "Live Enhanced Scraping"
  }
}
```

### Database Statistics
```bash
# Get database stats
curl "http://localhost:3000/api/database/stats"
```

## Troubleshooting

### Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection manually
docker exec web3fygo-postgres pg_isready -U postgres -d web3fygo
```

### Data Issues
```bash
# Clear old data
docker exec web3fygo-postgres psql -U postgres -d web3fygo -c "SELECT clean_old_products(7);"

# Reset database
docker-compose down -v
docker-compose up -d
```

### Port Conflicts
If ports 5432 or 8080 are already in use:
```yaml
# Edit docker-compose.yml
ports:
  - "5433:5432"  # Change PostgreSQL port
  - "8081:80"    # Change pgAdmin port
```

## Environment Variables Reference

```env
# Required Database Settings
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_NAME=web3fygo          # Database name
DB_USER=postgres          # Database username
DB_PASSWORD=password      # Database password

# Optional Cache Settings
CACHE_MAX_AGE_HOURS=24    # How long to cache data (hours)
ENABLE_DATABASE=true      # Enable/disable database integration
AUTO_CLEANUP_DAYS=7       # Auto-cleanup old data (days)

# Optional Scraping Settings
SKIP_BROWSER=false        # Skip browser scraping
FALLBACK_TO_CACHE=true    # Use cache when scraping fails
```

## Production Considerations

1. **Security**: Change default passwords
2. **Backup**: Set up regular database backups
3. **Performance**: Monitor query performance and indexes
4. **Scaling**: Consider connection pooling for high traffic
5. **Monitoring**: Set up database monitoring and alerts 