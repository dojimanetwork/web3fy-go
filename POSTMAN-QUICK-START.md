# 🚀 Postman Quick Start Guide

Get up and running with the Web3FyGo API Postman collection in under 2 minutes!

## 📥 Import Files

### Option 1: Import via Postman App

1. **Open Postman**
2. **Click Import** (top-left corner)
3. **Drag & Drop** or **Select Files**:
   - `postman/Web3FyGo-API.postman_collection.json`
   - `postman/Web3FyGo-Development.postman_environment.json`

### Option 2: Import via URLs (if hosted)

```
Collection URL: [Your hosted collection URL]
Environment URL: [Your hosted environment URL]
```

## ⚙️ Setup Environment

1. **Select Environment** (top-right dropdown)
2. Choose **"Web3FyGo - Development"**
3. Verify variables are loaded:
   - `baseUrl`: `http://localhost:3000`
   - `authToken`: `demo-token`

## 🧪 Test API

### Quick Test Sequence:

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Run these requests in order:**
   - ✅ **Welcome Message** - Test basic connectivity
   - ✅ **Health Check** - Verify server status
   - ✅ **API Status** - Check API operational status
   - ✅ **Get Users** - Test data retrieval
   - ✅ **Create User** - Test data creation
   - ⏱️ **Get Trending Products** - Test scraping (takes 10-30s)
   - 🆕 **Get Enhanced Products** - Test enhanced scraping with scrolling (takes 20-60s)

## 🔥 Power Features

### Run All Tests
- Right-click collection → **"Run collection"**
- Watch automated tests execute
- View detailed test report

### Environment Switching
- Switch between **Development** and **Production**
- All requests automatically adapt to environment

### Variables Available
- `{{baseUrl}}` - API base URL
- `{{authToken}}` - Authentication token
- `{{productLimit}}` - Product scraping limit (standard)
- `{{enhancedProductLimit}}` - Enhanced product scraping limit (up to 50)
- `{{$timestamp}}` - Dynamic timestamp
- `{{$randomUUID}}` - Random UUID

## 🎯 Common Use Cases

### Test Authentication
```
POST /api/echo
Header: Authorization: Bearer {{authToken}}
```

### Test Product Scraping

**Standard Scraping (up to 20 products):**
```
GET /api/products?trending=amazon&limit={{productLimit}}
```

**Enhanced Scraping (up to 50 products with scrolling):**
```
GET /api/products-enhanced?trending=amazon&limit={{enhancedProductLimit}}
```

### Test User Creation
```
POST /api/users
Body: {
  "name": "{{testUserName}}",
  "email": "{{testUserEmail}}"
}
```

## 📊 Automated Tests

Every request includes automated tests:
- ✅ Status code validation
- ✅ Response structure checks
- ✅ Data type validation
- ✅ Error handling verification

## 🔗 Links

- **Full Documentation**: `postman/README.md`
- **API Documentation**: `README.md`
- **Source Code**: `src/`

---

**Ready to test? Import the collection and start exploring! 🚀** 