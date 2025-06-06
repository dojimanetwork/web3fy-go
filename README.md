# Web3FyGo

A modern Node.js web3 project built with **TypeScript** and Express.js, featuring a robust API structure, comprehensive testing, and development tools.

## 🚀 Features

- **TypeScript** - Full TypeScript support with strict type checking
- **Express.js Server** - Fast, unopinionated web framework
- **RESTful API** - Well-structured API endpoints with type safety
- **PostgreSQL Database** - Robust data persistence with connection pooling
- **Database Caching** - Smart caching system for scraped product data
- **Authentication Middleware** - Token-based authentication system
- **Rate Limiting** - Built-in request rate limiting
- **Input Validation** - Comprehensive request validation with types
- **Error Handling** - Centralized error handling middleware
- **Testing Suite** - Complete test coverage with Jest and TypeScript
- **Code Quality** - ESLint + TypeScript ESLint for consistent code style
- **CORS Support** - Cross-origin resource sharing enabled
- **Environment Configuration** - Flexible environment setup
- **Web3 Utilities** - Helper functions for blockchain development
- **Web Scraping** - Headless browser automation with Puppeteer
- **Product Scraping** - Fetch trending products from Amazon with database caching
- **Docker Support** - PostgreSQL and pgAdmin via Docker Compose
- **Postman Support** - Comprehensive API collection with automated tests

## 📁 Project Structure

```
web3fygo/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── routes/
│   │   └── api.ts              # API route definitions
│   ├── services/
│   │   └── scraper.ts          # Web scraping service
│   ├── middleware/
│   │   └── auth.ts             # Authentication & middleware
│   └── utils/
│       └── helpers.ts          # Utility functions
├── tests/
│   └── api.test.ts             # Test suite
├── postman/                    # Postman collection & environments
│   ├── Web3FyGo-API.postman_collection.json
│   ├── Web3FyGo-Development.postman_environment.json
│   ├── Web3FyGo-Production.postman_environment.json
│   └── README.md              # Postman usage guide
├── dist/                       # Compiled JavaScript output
├── package.json                # Project dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest configuration
├── .eslintrc.js               # ESLint + TypeScript configuration
├── .gitignore                 # Git ignore rules
└── README.md                  # Project documentation
```

## 🛠 Getting Started

### Prerequisites

- **Node.js** (>= 16.0.0)
- **npm** or **yarn**

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start PostgreSQL database:**
   ```bash
   npm run db:up
   ```

3. **Create environment file:**
   ```bash
   # Create .env file with your configuration
   echo "PORT=3000\nNODE_ENV=development\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME=web3fygo\nDB_USER=postgres\nDB_PASSWORD=password" > .env
   ```

4. **Build the TypeScript project:**
   ```bash
   npm run build
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Visit your application:**
   - API: `http://localhost:3000`
   - Database Admin: `http://localhost:8080` (admin@web3fygo.com / admin123)

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint code analysis |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run type-check` | Check TypeScript types without compilation |
| `npm run db:up` | Start PostgreSQL database with Docker |
| `npm run db:down` | Stop database services |
| `npm run db:reset` | Reset database (removes all data) |
| `npm run db:logs` | View PostgreSQL logs |

## 🌐 API Endpoints

### Core Endpoints
- `GET /` - Welcome message and API info
- `GET /health` - Health check with system metrics

### API Routes (`/api`)
- `GET /api/status` - API operational status
- `GET /api/info` - API version and endpoint information
- `POST /api/echo` - Echo request data (for testing)
- `GET /api/users` - Get sample user list
- `POST /api/users` - Create new user
- `GET /api/products?trending=amazon` - Fetch trending products (with database caching)
- `GET /api/products-enhanced?trending=amazon` - Enhanced scraping with scrolling (with database caching)
- `GET /api/database/stats` - Database statistics and metrics
- `POST /api/database/cleanup` - Clean old data from database
- `POST /api/products/refresh` - Force refresh products (bypass cache)

### Example API Usage

#### Get API Status
```bash
curl http://localhost:3000/api/status
```

#### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

#### Echo Test (with Authentication)
```bash
curl -X POST http://localhost:3000/api/echo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -d '{"message": "Hello World"}'
```

#### Fetch Trending Products from Amazon (with caching)
```bash
# First request - scrapes and caches data
curl "http://localhost:3000/api/products?trending=amazon&limit=10"

# Subsequent requests - uses cached data
curl "http://localhost:3000/api/products?trending=amazon&limit=10"

# Force refresh - bypasses cache
curl "http://localhost:3000/api/products?trending=amazon&limit=10&force=true"
```

#### Enhanced Products (with advanced scrolling and caching)
```bash
# Enhanced scraping with scrolling (up to 50 products) - uses cache
curl "http://localhost:3000/api/products-enhanced?trending=amazon&limit=30"

# Force refresh enhanced scraping
curl "http://localhost:3000/api/products-enhanced?trending=amazon&limit=30&force=true"
```

#### Database Operations
```bash
# Get database statistics
curl "http://localhost:3000/api/database/stats"

# Clean old data (older than 7 days)
curl -X POST "http://localhost:3000/api/database/cleanup" \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 7}'

# Force refresh products
curl -X POST "http://localhost:3000/api/products/refresh" \
  -H "Content-Type: application/json" \
  -d '{"category": "electronics", "limit": 20}'
```

## 🔐 Authentication

The project includes a token-based authentication system:

- **Demo Token**: `demo-token` or `valid-token`
- **Format**: `Bearer <token>`
- **Header**: `Authorization: Bearer <token>`

```javascript
// Example authenticated request
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': 'Bearer demo-token',
    'Content-Type': 'application/json'
  }
});
```

## 🧪 Testing

### Jest Tests

Run the complete test suite:

```bash
npm test
```

The project includes comprehensive tests for:
- API endpoint functionality
- Error handling
- Request/response validation
- Authentication middleware

### Postman Tests

Import and run the Postman collection for interactive API testing:

1. **Import Collection:**
   - Open Postman
   - Import `postman/Web3FyGo-API.postman_collection.json`

2. **Import Environment:**
   - Import `postman/Web3FyGo-Development.postman_environment.json`
   - Select the environment in Postman

3. **Run Tests:**
   - Individual requests or entire collection
   - Automated tests included for all endpoints

See `postman/README.md` for detailed instructions.

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web3fygo
DB_USER=postgres
DB_PASSWORD=password

# Cache Settings
CACHE_MAX_AGE_HOURS=24

# Optional Settings
SKIP_BROWSER=false

# API Keys (if needed)
API_KEY=your_api_key_here

# Web3 Configuration (if needed)
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your_project_id
PRIVATE_KEY=your_private_key_here
```

## 🗄️ Database

The project uses PostgreSQL for data persistence with intelligent caching:

### Features
- **Smart Caching**: Automatically caches scraped product data
- **Configurable TTL**: Set cache expiration (default: 24 hours)
- **Fallback Strategy**: Uses cached data when scraping fails
- **Session Tracking**: Monitors scraping operations
- **Data Cleanup**: Automatic cleanup of old data

### Database Schema
- **products**: Stores scraped product information with ASIN, title, price, rating, etc.
- **scraping_sessions**: Tracks scraping operations for monitoring and debugging

### Quick Start
```bash
# Start database
npm run db:up

# Check database status
curl http://localhost:3000/api/database/stats

# Access pgAdmin
open http://localhost:8080
```

See `DATABASE-SETUP.md` for detailed database setup and management instructions.

## 🛒 Products API

The project provides two product endpoints with intelligent database caching:

### Endpoints
- **`/api/products`**: Standard scraping (up to 20 products)
- **`/api/products-enhanced`**: Enhanced scraping with scrolling (up to 50 products)

### Parameters
- **trending** (required): Source platform (`amazon`)
- **limit** (optional): Number of products to fetch (default: 20, max: 50)
- **force** (optional): Set to `true` to bypass cache and force fresh scraping

### Caching Behavior
1. **First Request**: Scrapes data from Amazon and saves to database
2. **Subsequent Requests**: Returns cached data (faster response)
3. **Cache Expiry**: Data older than 24 hours triggers fresh scraping
4. **Force Refresh**: Use `force=true` parameter to bypass cache
5. **Separate Caches**: Regular and enhanced endpoints maintain separate caches

### Enhanced vs Regular
- **Regular**: Faster, basic scraping, suitable for quick requests
- **Enhanced**: Advanced scrolling, more products (up to 50), longer processing time

### Example Response
```json
{
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "Successfully fetched 10 trending products from Amazon",
  "data": {
    "products": [
      {
        "rank": 1,
        "title": "Product Name",
        "price": "$29.99",
        "rating": "4.5 out of 5 stars",
        "image": "https://example.com/image.jpg",
        "link": "https://amazon.com/product-link",
        "source": "Amazon Best Sellers",
        "scrapedAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "totalFound": 10,
    "source": "Amazon",
    "parameters": {
      "trending": "amazon",
      "limit": 10
    }
  }
}
```

### Notes
- Scraping may take 10-30 seconds depending on Amazon's response time
- The service uses a headless browser to avoid bot detection
- Rate limiting is recommended to avoid being blocked by Amazon
- Some requests may fail due to Amazon's anti-bot measures

## 🔧 Utilities & Helpers

The project includes useful utility functions in `src/utils/helpers.js`:

- **ID Generation**: `generateId()`
- **Email Validation**: `isValidEmail(email)`
- **Response Formatting**: `successResponse()`, `errorResponse()`
- **Ethereum Address Validation**: `isValidEthereumAddress(address)`
- **Wei/Ether Conversion**: `weiToEther()`, `etherToWei()`
- **Input Sanitization**: `sanitizeString()`
- **Async Error Handling**: `asyncHandler()`

## 🌟 Development Tips

### Adding New Routes
1. Create route handlers in `src/routes/`
2. Import and use in `src/index.js`
3. Add corresponding tests in `tests/`

### Middleware Usage
```javascript
const { authenticate, rateLimit } = require('./middleware/auth');

// Apply to specific routes
router.get('/protected', authenticate, handler);

// Apply rate limiting
router.use('/api', rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
```

### Error Handling
The project uses centralized error handling. Wrap async functions:

```javascript
const { asyncHandler } = require('./utils/helpers');

router.get('/example', asyncHandler(async (req, res) => {
  // Your async code here
  // Errors automatically caught and handled
}));
```

## 📈 Production Deployment

1. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export PORT=8080
   ```

2. **Install production dependencies:**
   ```bash
   npm ci --only=production
   ```

3. **Start production server:**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Next Steps

- [x] Add database integration (PostgreSQL)
- [x] Implement caching with PostgreSQL
- [x] Add Docker configuration
- [ ] Implement JWT authentication
- [ ] Add API documentation with Swagger
- [ ] Integrate Web3.js or Ethers.js
- [ ] Set up CI/CD pipeline
- [ ] Add logging with Winston
- [ ] Add Redis for session management

## 🛒 Product Scraping

### **Standard Product Lists**
- **GET** `/api/products` - Amazon best sellers (up to 20 products, ~10-30s)
  - **Parameters**: `trending=amazon`, `limit=20`, `force=false`
  - **Cache**: Uses `electronics` category with 24-hour TTL
  - **Example**: `/api/products?trending=amazon&limit=10`

### **Enhanced Product Lists** 
- **GET** `/api/products-enhanced` - Advanced scraping with scrolling (up to 50 products, ~20-60s)
  - **Parameters**: `trending=amazon`, `limit=50`, `force=false`
  - **Cache**: Uses `electronics-enhanced` category with 24-hour TTL
  - **Features**: Browser scrolling, better selectors, more products
  - **Example**: `/api/products-enhanced?trending=amazon&limit=30`

### **🆕 Individual Product Details**
- **GET** `/api/product/details` - Scrape specific Amazon product by URL (~10-30s)
  - **Parameters**: `url={amazonProductUrl}` (required)
  - **Cache**: Uses `product-details` category with 24-hour TTL
  - **Features**: Detailed product info, ASIN extraction, availability status, features list
  - **Example**: `/api/product/details?url=https://www.amazon.com/dp/B08N5WRWNW`
  - **Response**: Single product object with enhanced details (brand, features, availability, etc.)

### **Database Integration**
All product endpoints now feature:
- **Intelligent Caching**: PostgreSQL-based for 10-100x faster responses
- **Force Refresh**: Add `?force=true` to bypass cache
- **Session Tracking**: UUID-based scraping session monitoring
- **Automatic Fallback**: Database → Scraping → Static data

---

**Happy Coding! 🚀** 