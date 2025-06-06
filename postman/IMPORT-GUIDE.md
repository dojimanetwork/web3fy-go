# 📥 Postman Collection Import Guide

## 🚀 **Updated Collection Features**

Your Web3FyGo Postman collection now includes **Individual Product Details** endpoint and comprehensive **PostgreSQL database integration**!

### **🆕 What's New:**
- **Individual Product Scraping**: Get detailed info from any Amazon product URL
- **Enhanced Database Caching**: 10-100x faster responses with PostgreSQL
- **URL-Based Caching**: Individual products cached by specific URL
- **Comprehensive Testing**: 25+ test scenarios with automatic cache detection

---

## 📋 **Quick Import Steps**

### **1. Download Files**
Save these files from the `postman/` directory:
- `Web3FyGo-API.postman_collection.json` - Complete API collection
- `Web3FyGo-Development.postman_environment.json` - Local development environment
- `Web3FyGo-Production.postman_environment.json` - Production environment

### **2. Import into Postman**
1. **Open Postman**
2. **Click "Import"** button (top left)
3. **Upload all 3 files** at once
4. **Collection Structure** will appear:
   ```
   Web3FyGo API
   ├── Core Endpoints
   ├── API Information  
   ├── Authentication
   ├── Product Scraping (Lists)
   ├── Database Endpoints
   ├── 🆕 Individual Product Details
   └── Error Handling
   ```

### **3. Select Environment**
- **Development**: Use for local testing (localhost:3000)
- **Production**: Use for production API testing

---

## 🎯 **New Endpoint Quick Test**

### **Test Individual Product Details**
```bash
GET {{baseUrl}}/api/product/details?url={{sampleAmazonUrl}}
```

**Expected Behavior:**
1. **First Request**: ~10-30s (scrapes fresh data)
2. **Second Request**: ~100-500ms (uses database cache)
3. **Response**: Comprehensive product details with ASIN, brand, features

---

## 📊 **Collection Sections Overview**

### **1. Core Endpoints** (2 requests)
- Health check and welcome message
- Basic API status validation

### **2. Product Scraping** (6 requests)
- **Regular Products**: Up to 20 products from Amazon best sellers
- **Enhanced Products**: Up to 50 products with advanced scrolling
- **Force Refresh**: Bypass cache with `?force=true`

### **3. 🆕 Individual Product Details** (3 requests)
- **Success Scenario**: Valid Amazon product URL
- **Missing URL**: Error validation testing
- **Invalid URL**: URL format validation

### **4. Database Endpoints** (5 requests)
- **Database Statistics**: Connection status, product counts, session metrics
- **Data Cleanup**: Remove old cached data
- **Force Refresh**: Manual cache bypass and fresh scraping

### **5. Authentication** (2 requests)
- Token-based authentication testing
- Admin-level access validation

### **6. Error Handling** (4 requests)
- Various error scenarios and edge cases
- Parameter validation testing

---

## 🔧 **Environment Variables Reference**

### **Development Environment**
| Variable | Value | Purpose |
|----------|-------|---------|
| `baseUrl` | `http://localhost:3000` | Local API server |
| `productLimit` | `10` | Standard product limit |
| `enhancedProductLimit` | `30` | Enhanced scraping limit |
| `cleanupDays` | `7` | Database cleanup retention |
| `sampleAmazonUrl` | `https://www.amazon.com/dp/B08N5WRWNW` | Test product URL |
| `pgAdminUrl` | `http://localhost:8080` | Database admin panel |

### **Production Environment**
| Variable | Value | Purpose |
|----------|-------|---------|
| `baseUrl` | `https://api.web3fygo.com` | Production API |
| `enhancedProductLimit` | `50` | Higher production limit |
| `cleanupDays` | `30` | Longer retention period |
| All database variables | `{{PRODUCTION_*}}` | Secured production values |

---

## 🧪 **Testing Workflow**

### **Recommended Test Sequence:**
1. **Health Check** → Verify API is running
2. **Database Stats** → Confirm database connection
3. **Product Details** → Test new individual scraping (first time)
4. **Product Details** → Test caching (same URL, should be fast)
5. **Regular Products** → Test list scraping
6. **Enhanced Products** → Test advanced scraping

### **Cache Testing:**
```bash
# 1. Fresh scraping (slow)
GET /api/product/details?url=https://www.amazon.com/dp/B08N5WRWNW
# Response: "Live Scraping - Just scraped product details"

# 2. Cached response (fast)  
GET /api/product/details?url=https://www.amazon.com/dp/B08N5WRWNW
# Response: "Database Cache (Product Detail) - X hours old"
```

---

## 📈 **Automatic Test Validation**

Each request includes comprehensive test scripts that automatically:
- ✅ **Validate Response Structure**: Ensures all required fields are present
- ✅ **Check Status Codes**: Validates HTTP response codes
- ✅ **Detect Cache Sources**: Identifies database cache vs fresh scraping
- ✅ **Performance Logging**: Logs response times and data sources
- ✅ **Error Handling**: Validates error responses and messages

### **Test Results Display:**
- **Green**: All tests passed
- **Red**: Tests failed (check response structure)
- **Console Logs**: Cache hit/miss information and performance data

---

## 🚨 **Prerequisites**

### **For Local Testing:**
```bash
# 1. Start PostgreSQL database
npm run db:up

# 2. Start API server  
npm run dev

# 3. Verify endpoints
curl http://localhost:3000/api/status
```

### **Database Access:**
- **pgAdmin**: http://localhost:8080 
- **Credentials**: admin@web3fygo.com / admin123
- **Database**: web3fygo on postgres:5432

---

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **"Service unavailable" errors:**
- Check if API server is running (`npm run dev`)
- Verify database is running (`npm run db:up`)
- Check server logs for specific errors

#### **Cache not working:**
- Verify PostgreSQL connection in database stats
- Check if database tables are initialized
- Try database reset: `npm run db:reset`

#### **Slow responses:**
- First requests are always slower (fresh scraping)
- Subsequent requests should be much faster (cached)
- Force refresh always bypasses cache

---

## 📞 **Support**

- **Documentation**: Check `README.md` and `DATABASE-SETUP.md`
- **Postman Updates**: See `POSTMAN-UPDATES.md` for latest changes
- **Database Guide**: Review `DATABASE-SETUP.md` for PostgreSQL setup
- **API Logs**: Use `npm run dev` to see real-time logs

---

**🎉 Your Postman collection is now ready with Individual Product Details and PostgreSQL integration!**

*Happy Testing! 🚀* 