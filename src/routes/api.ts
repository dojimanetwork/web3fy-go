import express, { Request, Response, Router } from 'express';
import amazonScraper from '../services/scraper';
import enhancedScraper from '../services/scraper_enhanced';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';
import { User, ProductsResponse } from '../types';
import { dbService } from '../services/database';
import { MetadataService, Metadata } from '../services/metadata';

const router: Router = express.Router();
const metadataService = new MetadataService();

// Get API status
router.get('/status', (req: Request, res: Response): void => {
    res.json({
        status: 'success',
        message: 'API is operational',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get API version and info
router.get('/info', (req: Request, res: Response): void => {
    res.json({
        name: 'Web3FyGo API',
        version: '1.0.0',
        description: 'A Node.js web3 project API with enhanced scraping reliability',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        features: {
            scraping: {
                retryMechanism: true,
                fallbackData: true,
                antiDetection: true,
                maxRetries: 3
            },
            authentication: true,
            rateLimit: true,
            cors: true
        },
        endpoints: [
            'GET /api/status',
            'GET /api/info',
            'GET /api/scraper-status',
            'POST /api/scraper-config',
            'GET /api/browser-diagnostics',
            'POST /api/echo',
            'GET /api/users',
            'POST /api/users',
            'GET /api/products?trending=amazon&limit=20&force=false',
            'GET /api/products-enhanced?trending=amazon&limit=50&force=false',
            'GET /api/product/details?url={amazonUrl}',
            'GET /api/database/stats',
            'POST /api/database/cleanup',
            'POST /api/products/refresh',
            'GET /api/metadata',
            'POST /api/metadata',
            'DELETE /api/metadata'
        ]
    });
});

// Scraper status endpoint
router.get('/scraper-status', (req: Request, res: Response): void => {
    const browserStatus = amazonScraper.getBrowserStatus();

    res.json({
        status: 'operational',
        browser: {
            mode: browserStatus.mode,
            isRunning: browserStatus.isRunning,
            maxRetries: browserStatus.retries
        },
        features: {
            retryAttempts: 3,
            fallbackDataAvailable: true,
            localBrowserSupport: true,
            antiDetectionMeasures: [
                'Local browser window',
                'Human-like navigation',
                'Dynamic scrolling behavior',
                'Random delays',
                'Browser headers simulation',
                'Multiple selector strategies'
            ]
        },
        lastCheck: new Date().toISOString(),
        supportedSources: ['amazon'],
        fallbackProductCount: 5,
        averageResponseTime: '10-45 seconds (local browser may take longer)',
        configuration: {
            localBrowserEnabled: browserStatus.mode === 'local visible',
            humanLikeBehavior: browserStatus.mode === 'local visible'
        }
    });
});

// Browser configuration endpoint
router.post('/scraper-config', (req: Request, res: Response): void => {
    const { mode }: { mode?: string } = req.body;

    if (!mode || !['local', 'headless'].includes(mode)) {
        res.status(400).json({
            error: 'Invalid mode',
            message: 'Mode must be either "local" or "headless"',
            validModes: ['local', 'headless'],
            timestamp: new Date().toISOString()
        });
        return;
    }

    const useLocal = mode === 'local';
    amazonScraper.setLocalBrowserMode(useLocal);

    res.json({
        message: `Scraper mode updated to ${mode}`,
        previousMode: amazonScraper.getCurrentBrowserMode(),
        newMode: mode,
        timestamp: new Date().toISOString(),
        note: 'Browser will restart on next scraping request'
    });
});

// Browser diagnostics endpoint
router.get('/browser-diagnostics', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Running browser diagnostics...');

        const diagnostics: any = {
            timestamp: new Date().toISOString(),
            system: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                memory: process.memoryUsage()
            },
            browser: {
                currentMode: amazonScraper.getCurrentBrowserMode(),
                status: amazonScraper.getBrowserStatus()
            },
            checks: {}
        };

        // Check browser installation using proper path detection
        try {
            const fs = require('fs');
            const { execSync } = require('child_process');

            // Use the same Chrome path detection logic as the scraper
            const chromePaths = {
                win32: [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
                ],
                darwin: [
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    '/Applications/Chromium.app/Contents/MacOS/Chromium'
                ],
                linux: [
                    '/usr/bin/google-chrome',
                    '/usr/bin/google-chrome-stable',
                    '/usr/bin/chromium-browser',
                    '/usr/bin/chromium'
                ]
            };

            const platform = process.platform as keyof typeof chromePaths;
            const paths = chromePaths[platform] || chromePaths.linux;
            let chromeFound = false;
            let chromePath = '';

            // Check each path until we find one that exists
            for (const path of paths) {
                try {
                    if (fs.existsSync(path)) {
                        chromeFound = true;
                        chromePath = path;
                        break;
                    }
                } catch (error) {
                    // Continue checking other paths
                }
            }

            if (chromeFound) {
                diagnostics.checks.browser = {
                    available: true,
                    path: chromePath,
                    message: 'Chrome found'
                };

                // Try to get version
                try {
                    let versionCommand = '';
                    if (process.platform === 'darwin') {
                        versionCommand = `"${chromePath}" --version`;
                    } else {
                        versionCommand = `${chromePath} --version`;
                    }

                    const chromeVersion = execSync(versionCommand, { encoding: 'utf8', timeout: 5000 });
                    diagnostics.checks.browser.version = chromeVersion.trim();
                } catch (versionError) {
                    diagnostics.checks.browser.versionError = 'Version check failed';
                }
            } else {
                diagnostics.checks.browser = {
                    available: false,
                    message: 'No Chrome/Chromium found'
                };
            }
        } catch {
            diagnostics.checks.browser = {
                available: false,
                message: 'Cannot check browser installation'
            };
        }

        // Test basic browser launch
        try {
            console.log('Testing minimal browser launch...');
            const puppeteer = require('puppeteer');

            const launchConfig: any = {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 10000
            };

            // Use detected Chrome path if available
            if (diagnostics.checks.browser?.available && diagnostics.checks.browser?.path) {
                launchConfig.executablePath = diagnostics.checks.browser.path;
                console.log('Using detected Chrome path for test launch');
            }

            const testBrowser = await puppeteer.launch(launchConfig);
            await testBrowser.close();

            diagnostics.checks.launchTest = {
                success: true,
                message: 'Basic browser launch successful'
            };

        } catch (launchError) {
            diagnostics.checks.launchTest = {
                success: false,
                error: (launchError as Error).message,
                message: 'Browser launch failed'
            };
        }

        // Check network connectivity
        try {
            const https = require('https');
            await new Promise((resolve, reject) => {
                const req = https.get('https://www.amazon.com/', { timeout: 5000 }, (res: any) => {
                    diagnostics.checks.amazonConnectivity = {
                        success: true,
                        statusCode: res.statusCode
                    };
                    resolve(res);
                });
                req.on('error', reject);
                req.on('timeout', () => reject(new Error('Timeout')));
            });
        } catch (netError) {
            diagnostics.checks.amazonConnectivity = {
                success: false,
                error: (netError as Error).message
            };
        }

        res.json({
            success: true,
            message: 'Browser diagnostics completed',
            data: diagnostics
        });

    } catch (error) {
        console.error('Diagnostics failed:', (error as Error).message);
        res.status(500).json({
            success: false,
            error: 'Diagnostics failed',
            message: (error as Error).message,
            timestamp: new Date().toISOString()
        });
    }
}));

// Echo endpoint for testing
router.post('/echo', (req: Request, res: Response): void => {
    res.json({
        message: 'Echo successful',
        received: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
});

// Sample users endpoint
router.get('/users', (req: Request, res: Response): void => {
    const sampleUsers: User[] = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' }
    ];

    res.json({
        users: sampleUsers,
        count: sampleUsers.length,
        timestamp: new Date().toISOString()
    });
});

// Create user endpoint
router.post('/users', (req: Request, res: Response): void => {
    const { name, email }: { name?: string; email?: string } = req.body;

    if (!name || !email) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Name and email are required',
            timestamp: new Date().toISOString()
        });
        return;
    }

    const newUser: User = {
        id: Date.now(),
        name,
        email,
        created: new Date().toISOString()
    };

    res.status(201).json({
        message: 'User created successfully',
        user: newUser,
        timestamp: new Date().toISOString()
    });
});

// Enhanced products endpoint with database caching and scrolling (up to 50 products)
router.get('/products-enhanced', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { trending, limit = '20', force = 'false' }: { trending?: string; limit?: string; force?: string } = req.query as Record<string, string>;

    // Validate parameters
    if (!trending) {
        res.status(400).json(errorResponse(
            'Missing required parameter',
            'The "trending" parameter is required'
        ));
        return;
    }

    if (trending !== 'amazon') {
        res.status(400).json(errorResponse(
            'Invalid trending parameter',
            'Currently only "amazon" is supported for the trending parameter'
        ));
        return;
    }

    const productLimit = Math.min(parseInt(limit) || 20, 50); // Cap at 50 products
    const forceRefresh = force === 'true';
    const category = 'electronics-enhanced'; // Different category for enhanced scraping
    const maxAgeHours = parseInt(process.env.CACHE_MAX_AGE_HOURS || '24');

    try {
        console.log(`Enhanced scraping request for ${productLimit} products...`);

        let products: any[] = [];
        let dataSource = '';
        let sessionId: string | null = null;

        // Check if we should skip cache (force refresh) or no fresh data available
        if (!forceRefresh) {
            const freshDataCheck = await dbService.hasFreshData(category, maxAgeHours);

            if (freshDataCheck.hasFresh && freshDataCheck.count >= productLimit) {
                console.log(`✅ Using cached enhanced data (${freshDataCheck.count} products, last scraped: ${freshDataCheck.lastScraped})`);
                products = await dbService.getProducts(productLimit, category, maxAgeHours);

                if (freshDataCheck.lastScraped) {
                    const hoursOld = Math.round((Date.now() - freshDataCheck.lastScraped.getTime()) / (1000 * 60 * 60));
                    dataSource = `Database Cache (Enhanced) - ${hoursOld} hours old`;
                }
            }
        }

        // If no cached data or force refresh, scrape new data with enhanced method
        if (products.length === 0 || forceRefresh) {
            console.log(forceRefresh ? '🔄 Force refresh requested - enhanced scraping new data' : '📡 No fresh enhanced cache available - scraping new data');

            // Create scraping session
            sessionId = await dbService.createScrapingSession('amazon-enhanced-scraper', category);

            try {
                // Use enhanced scraping with scrolling
                const scrapedProducts = await enhancedScraper.scrapeProductsWithScrolling(productLimit);

                if (scrapedProducts.length > 0) {
                    // Save to database with enhanced category
                    const savedCount = await dbService.saveProducts(scrapedProducts, category);
                    console.log(`💾 Saved ${savedCount} enhanced products to database`);

                    products = scrapedProducts;
                    dataSource = 'Live Enhanced Scraping - Just scraped with scrolling';

                    // Update session as successful
                    await dbService.updateScrapingSession(sessionId, true, savedCount);
                } else {
                    throw new Error('No enhanced products scraped');
                }

            } catch (scrapingError) {
                console.error('❌ Enhanced scraping failed:', (scrapingError as Error).message);

                // Update session as failed
                if (sessionId) {
                    await dbService.updateScrapingSession(sessionId, false, 0, (scrapingError as Error).message);
                }

                // Try to get any cached enhanced data as fallback (even if older)
                const fallbackProducts = await dbService.getProducts(productLimit, category, 72); // 3 days old
                if (fallbackProducts.length > 0) {
                    console.log(`📦 Using older cached enhanced data as fallback (${fallbackProducts.length} products)`);
                    products = fallbackProducts;
                    dataSource = 'Database Cache (Enhanced Fallback) - Scraping failed';
                } else {
                    // Try regular category as fallback
                    const regularFallback = await dbService.getProducts(productLimit, 'electronics', 72);
                    if (regularFallback.length > 0) {
                        console.log(`📦 Using regular cached data as fallback (${regularFallback.length} products)`);
                        products = regularFallback;
                        dataSource = 'Database Cache (Regular Fallback) - Enhanced scraping failed';
                    } else {
                        // Final fallback to scraper's internal fallback
                        products = await amazonScraper.getFallbackProducts(productLimit);
                        dataSource = 'Static Fallback Data - All enhanced sources failed';
                    }
                }
            }
        }

        const responseData: ProductsResponse = {
            products,
            totalFound: products.length,
            source: dataSource || (products.length > 0 ? products[0].source : 'Enhanced Amazon Scraper'),
            parameters: {
                trending,
                limit: productLimit,
                ...(forceRefresh && { forceRefresh: true }),
                category,
                maxAgeHours
            }
        };

        // Create appropriate message based on data source
        let message = `Successfully retrieved ${products.length} products`;
        if (dataSource.includes('Cache')) {
            message += ' from enhanced database cache';
        } else if (dataSource.includes('Live Enhanced')) {
            message += ' via live enhanced scraping with scrolling';
        } else if (dataSource.includes('Fallback')) {
            message += ' from fallback data';
        }

        res.json(successResponse(responseData, message));

    } catch (error) {
        console.error('Error in enhanced products endpoint:', (error as Error).message);
        res.status(500).json(errorResponse(
            'Enhanced scraping failed',
            `Unable to extract enhanced products: ${(error as Error).message}`
        ));
    }
}));

// Products endpoint with database caching
router.get('/products', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { trending, category = 'electronics', limit = '20', force = 'false' }: { trending?: string; category?: string; limit?: string; force?: string } = req.query as Record<string, string>;

    // Validate parameters
    if (!trending) {
        res.status(400).json(errorResponse(
            'Missing required parameter',
            'The "trending" parameter is required'
        ));
        return;
    }

    if (trending !== 'amazon') {
        res.status(400).json(errorResponse(
            'Invalid trending parameter',
            'Currently only "amazon" is supported for the trending parameter'
        ));
        return;
    }

    const productLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 products
    const forceRefresh = force === 'true';
    const maxAgeHours = parseInt(process.env.CACHE_MAX_AGE_HOURS || '24');

    try {
        console.log(`Fetching ${productLimit} trending products from Amazon ${category}...`);

        let products: any[] = [];
        let dataSource = '';
        let sessionId: string | null = null;

        // First try to get data from PostgreSQL
        const dbProducts = await dbService.getProducts(productLimit, category, maxAgeHours);

        if (dbProducts.length > 0 && !forceRefresh) {
            console.log(`✅ Using PostgreSQL data (${dbProducts.length} products)`);
            products = dbProducts;
            dataSource = `PostgreSQL Cache (${category})`;
        } else {
            console.log('📡 No PostgreSQL data available or force refresh requested - scraping new data');

            // Create scraping session
            sessionId = await dbService.createScrapingSession('amazon-scraper', category);

            try {
                // Scrape new products using metadata URL
                const scrapedProducts = await amazonScraper.getTrendingProducts(productLimit, trending, category);

                if (scrapedProducts.length > 0) {
                    // Save to PostgreSQL
                    const savedCount = await dbService.saveProducts(scrapedProducts, category);
                    console.log(`💾 Saved ${savedCount} products to PostgreSQL`);

                    products = scrapedProducts;
                    dataSource = 'Live Scraping - Just scraped';

                    // Update session as successful
                    await dbService.updateScrapingSession(sessionId, true, savedCount);
                } else {
                    throw new Error('No products scraped');
                }

            } catch (scrapingError) {
                console.error('❌ Scraping failed:', (scrapingError as Error).message);

                // Update session as failed
                if (sessionId) {
                    await dbService.updateScrapingSession(sessionId, false, 0, (scrapingError as Error).message);
                }

                // If scraping failed and we have no PostgreSQL data, use fallback
                if (dbProducts.length === 0) {
                    products = await amazonScraper.getFallbackProducts(productLimit);
                    dataSource = 'Static Fallback Data - All other sources failed';
                } else {
                    // Use existing PostgreSQL data as fallback
                    products = dbProducts;
                    dataSource = 'PostgreSQL Cache (Fallback) - Scraping failed';
                }
            }
        }

        const responseData: ProductsResponse = {
            products,
            totalFound: products.length,
            source: dataSource || (products.length > 0 ? products[0].source : 'Unknown'),
            parameters: {
                trending,
                category,
                limit: productLimit,
                ...(forceRefresh && { forceRefresh: true }),
                maxAgeHours
            }
        };

        // Create appropriate message based on data source
        let message = `Successfully retrieved ${products.length} products`;
        if (dataSource.includes('PostgreSQL')) {
            message += ' from PostgreSQL';
            if (dataSource.includes('Fallback')) {
                message += ' (fallback)';
            }
        } else if (dataSource.includes('Live')) {
            message += ' via live scraping';
        } else if (dataSource.includes('Fallback')) {
            message += ' from fallback data';
        }

        res.json(successResponse(responseData, message));

    } catch (error) {
        console.error('Error in products endpoint:', (error as Error).message);

        res.status(500).json(errorResponse(
            'Service unavailable',
            'Unable to fetch trending products at this time. Please try again later.'
        ));
    }
}));

// Product details endpoint - scrape individual Amazon product by URL
router.get('/product/details', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { url }: { url?: string } = req.query as Record<string, string>;

    // Validate URL parameter
    if (!url) {
        res.status(400).json(errorResponse(
            'Missing required parameter',
            'The "url" parameter is required and must be a valid Amazon product URL'
        ));
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch {
        res.status(400).json(errorResponse(
            'Invalid URL format',
            'Please provide a valid Amazon product URL'
        ));
        return;
    }

    const category = 'product-details'; // Category for individual product details
    const maxAgeHours = parseInt(process.env.CACHE_MAX_AGE_HOURS || '24');

    try {
        console.log(`Fetching product details for URL: ${url}`);

        let product: any = null;
        let dataSource = '';
        let sessionId: string | null = null;

        // Check if we have cached data for this specific product URL
        const cachedProduct = await dbService.getProductByUrl(url, maxAgeHours);

        if (cachedProduct) {
            console.log(`✅ Using cached product details for URL: ${url}`);
            product = cachedProduct;

            const hoursOld = Math.round((Date.now() - new Date(cachedProduct.scrapedAt).getTime()) / (1000 * 60 * 60));
            dataSource = `Database Cache (Product Detail) - ${hoursOld} hours old`;
        } else {
            console.log('📡 No cached data available - scraping product details');

            // Create scraping session
            sessionId = await dbService.createScrapingSession('product-details', category);

            try {
                // Scrape product details from the specific URL
                const scrapedProduct = await amazonScraper.scrapeProductDetails(url);

                if (scrapedProduct) {
                    // Save to database
                    const savedCount = await dbService.saveProducts([scrapedProduct], category);
                    console.log(`💾 Saved product details to database`);

                    product = scrapedProduct;
                    dataSource = 'Live Scraping - Just scraped product details';

                    // Update session as successful
                    await dbService.updateScrapingSession(sessionId, true, savedCount);
                } else {
                    throw new Error('No product details scraped');
                }

            } catch (scrapingError) {
                console.error('❌ Scraping failed:', (scrapingError as Error).message);

                // Update session as failed
                if (sessionId) {
                    await dbService.updateScrapingSession(sessionId, false, 0, (scrapingError as Error).message);
                }

                // Check if we have any cached version (even older)
                const fallbackProduct = await dbService.getProductByUrl(url, 168); // 7 days old
                if (fallbackProduct) {
                    console.log(`📦 Using older cached data as fallback`);
                    product = fallbackProduct;
                    dataSource = 'Database Cache (Fallback) - Scraping failed';
                } else {
                    throw scrapingError; // Re-throw the original error if no fallback available
                }
            }
        }

        const responseData = {
            product,
            source: dataSource,
            parameters: {
                url,
                maxAgeHours
            },
            ...(sessionId && { sessionId })
        };

        // Create appropriate message based on data source
        let message = 'Successfully retrieved product details';
        if (dataSource.includes('Cache')) {
            message += ' from database cache';
        } else if (dataSource.includes('Live')) {
            message += ' via live scraping';
        }

        res.json(successResponse(responseData, message));

    } catch (error) {
        console.error('Error in product details endpoint:', (error as Error).message);

        res.status(500).json(errorResponse(
            'Service unavailable',
            'Unable to fetch product details at this time. Please check the URL and try again later.'
        ));
    }
}));

// Database statistics endpoint
router.get('/database/stats', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await dbService.getStats();

        res.json(successResponse({
            database: {
                totalProducts: stats.totalProducts,
                categoryCounts: stats.categoryCounts,
                recentSessions: stats.recentSessions.slice(0, 5) // Show only 5 most recent
            },
            lastUpdated: new Date().toISOString()
        }, 'Database statistics retrieved successfully'));

    } catch (error) {
        console.error('Error fetching database stats:', (error as Error).message);
        res.status(500).json(errorResponse(
            'Database error',
            'Unable to fetch database statistics'
        ));
    }
}));

// Database cleanup endpoint
router.post('/database/cleanup', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { daysOld = '7' }: { daysOld?: string } = req.body;

    try {
        const deletedCount = await dbService.cleanOldData(parseInt(daysOld));

        res.json(successResponse({
            deletedCount,
            daysOld: parseInt(daysOld),
            timestamp: new Date().toISOString()
        }, `Successfully cleaned ${deletedCount} old records from database`));

    } catch (error) {
        console.error('Error cleaning database:', (error as Error).message);
        res.status(500).json(errorResponse(
            'Database cleanup failed',
            'Unable to clean old data from database'
        ));
    }
}));

// Force refresh products endpoint (bypasses cache)
router.post('/products/refresh', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category = 'electronics', limit = '20' }: { category?: string; limit?: string } = req.body;

    try {
        const productLimit = Math.min(parseInt(limit) || 20, 50);

        // Create scraping session
        const sessionId = await dbService.createScrapingSession('manual-refresh', category);

        try {
            // Force scrape new data
            const products = await amazonScraper.getTrendingProducts(productLimit);

            if (products.length > 0) {
                // Save to database
                const savedCount = await dbService.saveProducts(products, category);

                // Update session as successful
                await dbService.updateScrapingSession(sessionId, true, savedCount);

                res.json(successResponse({
                    products,
                    totalFound: products.length,
                    savedToDatabase: savedCount,
                    sessionId,
                    category,
                    timestamp: new Date().toISOString()
                }, `Successfully refreshed ${savedCount} products and saved to database`));
            } else {
                throw new Error('No products scraped');
            }

        } catch (scrapingError) {
            // Update session as failed
            await dbService.updateScrapingSession(sessionId, false, 0, (scrapingError as Error).message);
            throw scrapingError;
        }

    } catch (error) {
        console.error('Error refreshing products:', (error as Error).message);
        res.status(500).json(errorResponse(
            'Refresh failed',
            `Unable to refresh products: ${(error as Error).message}`
        ));
    }
}));

// Metadata endpoint
router.get('/metadata', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, category } = req.query as { type?: string; category?: string };

    if (!type) {
        res.status(400).json(errorResponse(
            'Missing required parameter',
            'The "type" parameter is required'
        ));
        return;
    }

    try {
        const metadata = await metadataService.getMetadata(type, category);
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: category === 'all' ?
                `Successfully retrieved metadata for all categories of type ${type}` :
                `Successfully retrieved metadata for type ${type}${category ? ` and category ${category}` : ''}`,
            data: {
                metadata,
                parameters: {
                    type,
                    ...(category && { category })
                }
            }
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json(errorResponse(
            'Service unavailable',
            'Unable to fetch metadata at this time. Please try again later.'
        ));
    }
}));

router.post('/metadata', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, category, url, description } = req.body as Metadata;

    if (!type || !category || !url) {
        res.status(400).json(errorResponse(
            'Missing required fields',
            'Type, category, and URL are required'
        ));
        return;
    }

    try {
        const metadata = await metadataService.upsertMetadata({
            type,
            category,
            url,
            description: description || undefined
        });
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Successfully updated metadata',
            data: {
                metadata,
                parameters: { type, category }
            }
        });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json(errorResponse(
            'Service unavailable',
            'Unable to update metadata at this time. Please try again later.'
        ));
    }
}));

router.delete('/metadata', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, category } = req.query as { type?: string; category?: string };

    if (!type || !category) {
        res.status(400).json(errorResponse(
            'Missing required parameters',
            'Both "type" and "category" parameters are required'
        ));
        return;
    }

    try {
        await metadataService.deleteMetadata(type, category);
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Successfully deleted metadata',
            data: {
                parameters: { type, category }
            }
        });
    } catch (error) {
        console.error('Error deleting metadata:', error);
        res.status(500).json(errorResponse(
            'Service unavailable',
            'Unable to delete metadata at this time. Please try again later.'
        ));
    }
}));

// Categories endpoint
router.get('/categories', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type } = req.query as { type?: string };

    if (!type) {
        res.status(400).json(errorResponse(
            'Missing required parameter',
            'The "type" parameter is required'
        ));
        return;
    }

    try {
        const metadata = await metadataService.getMetadata(type);
        const categories = metadata.map(item => ({
            category: item.category,
            url: item.url,
            description: item.description
        }));

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: `Successfully retrieved categories for type ${type}`,
            data: {
                categories,
                parameters: {
                    type
                }
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json(errorResponse(
            'Service unavailable',
            'Unable to fetch categories at this time. Please try again later.'
        ));
    }
}));

export default router; 