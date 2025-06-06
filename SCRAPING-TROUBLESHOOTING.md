# 🔧 Scraping Troubleshooting Guide

This guide helps resolve common scraping issues, particularly "socket hang up" errors.

## 🐛 Common Issues

### Socket Hang Up Errors

**Error Message:**
```
Error scraping Amazon: socket hang up
Trying alternative scraping approach...
Error fetching trending products: Failed to scrape Amazon products: socket hang up
```

**Causes:**
- Amazon's anti-bot detection
- Network timeouts
- Connection terminated by server
- Rate limiting
- IP blocking

## ✅ Solutions Implemented

### 1. **Enhanced Retry Mechanism**
- **3 automatic retries** with exponential backoff
- Delays increase: 2s → 4s → 8s
- Each attempt uses fresh browser instance

### 2. **Improved Anti-Detection**
```typescript
// Updated user agent to latest Chrome
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'

// Additional browser headers
'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp...'
'Accept-Language': 'en-US,en;q=0.9'
'Connection': 'keep-alive'
```

### 3. **Multiple Selector Strategies**
```typescript
const productSelectors = [
    '[data-testid="bestsellers-productCard"]',
    '.zg-grid-general-faceout',
    '.a-carousel-card',
    '.s-result-item',
    '[data-component-type="s-search-result"]'
];
```

### 4. **Timeout Improvements**
- Browser timeout: **60 seconds**
- Navigation timeout: **45 seconds**
- Element wait timeout: **30 seconds**

### 5. **Fallback Data System**
- **5 sample products** returned when scraping fails
- Clearly marked as "Fallback Data"
- API continues working even with scraping issues

## 🚀 API Behavior

### Enhanced Endpoint: `/api/products?trending=amazon`

**Success Response (Live Data):**
```json
{
  "success": true,
  "message": "Successfully fetched 5 trending products from Amazon",
  "data": {
    "products": [...],
    "source": "Amazon Best Sellers"
  }
}
```

**Success Response (Fallback Data):**
```json
{
  "success": true,
  "message": "Returned 5 fallback products due to scraping limitations",
  "data": {
    "products": [...],
    "source": "Fallback Data - Amazon Best Sellers"
  }
}
```

**Error Response (Complete Failure):**
```json
{
  "success": false,
  "error": "Service unavailable",
  "message": "Unable to fetch trending products at this time. Please try again later."
}
```

## 🔍 Monitoring & Debugging

### Check Scraper Status
```bash
curl http://localhost:3000/api/scraper-status
```

### View Logs
```bash
npm run dev
# Watch console for detailed scraping logs
```

**Log Examples:**
```
Amazon Best Sellers Scraping - Attempt 1/3
Found products using selector: .zg-grid-general-faceout
Successfully scraped 10 products
```

```
Amazon Best Sellers Scraping - Attempt 1/3
Error scraping Amazon: socket hang up
Amazon Best Sellers Scraping - Attempt 2/3
Retrying in 4000ms...
```

## 🛠 Manual Testing

### Test with Postman
1. Import collection: `postman/Web3FyGo-API.postman_collection.json`
2. Run: **"Get Trending Products - Amazon"**
3. Check test results for data source indication

### Test with cURL
```bash
# Test scraping endpoint
curl "http://localhost:3000/api/products?trending=amazon&limit=5"

# Test scraper status
curl "http://localhost:3000/api/scraper-status"
```

## ⚡ Performance Tips

### 1. **Reduce Product Limit**
```bash
# Faster response with fewer products
curl "http://localhost:3000/api/products?trending=amazon&limit=5"
```

### 2. **Expect Delays**
- **Live scraping**: 10-30 seconds
- **Fallback data**: < 1 second
- **First request**: Slower (browser startup)

### 3. **Monitor Response Times**
- Use Postman tests to track response times
- Automatic timeout at 30 seconds in tests

## 🔄 Alternative Approaches

### 1. **Different Endpoints**
If Amazon scraping fails consistently:
```typescript
// Future enhancement ideas:
// - eBay trending products
// - AliExpress best sellers  
// - Local product database
```

### 2. **Scheduled Scraping**
```typescript
// Cron job to pre-scrape data
// Store results in database
// Serve cached data via API
```

## 🚨 When to Worry

**Normal Behavior:**
- Occasional socket hang up errors
- Automatic fallback to sample data
- 1-2 retry attempts

**Concerning Signs:**
- All scraping attempts fail consistently
- Browser won't launch
- Memory leaks from browser instances

## 🔧 Environment Fixes

### Local Development
```bash
# Ensure dependencies are installed
npm install

# Check browser installation
npx puppeteer browsers install chrome
```

### Production Deployment
```bash
# Add browser dependencies
apt-get update
apt-get install -y chromium-browser

# Set environment variable
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 📊 Success Metrics

**Good Performance:**
- ✅ 70%+ successful live scraping
- ✅ < 20 second average response time
- ✅ Fallback data always available

**Monitor These:**
- Retry attempt frequency
- Fallback data usage percentage
- Browser memory usage
- Response time trends

## 🆘 Getting Help

**Check Status:**
```bash
curl http://localhost:3000/api/scraper-status
curl http://localhost:3000/health
```

**Debug Logs:**
- Enable verbose logging in development
- Check browser developer tools
- Monitor network requests

**Community Resources:**
- Puppeteer documentation
- Anti-bot detection strategies
- Web scraping best practices

---

**The enhanced scraper should now handle socket hang up errors gracefully while providing consistent API responses! 🎉** 