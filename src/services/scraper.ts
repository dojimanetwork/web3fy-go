import puppeteer, { Browser, Page } from 'puppeteer';
import { delay } from '../utils/helpers';
import { Product, BrowserConfig, ScrapingOptions } from '../types';
import { execSync } from 'child_process';
import * as fs from 'fs';

class AmazonScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private maxRetries: number = 3;
    private retryDelay: number = 2000;
    private useLocalBrowser: boolean = true; // Set to false for headless mode

    async initBrowser(): Promise<Browser> {
        if (!this.browser) {
            const browserMode = this.useLocalBrowser ? 'local visible' : 'headless';
            console.log(`Initializing ${browserMode} browser for scraping...`);

            // Get Chrome executable path for different platforms
            const chromePath = this.getChromeExecutablePath();
            if (chromePath) {
                console.log(`Using Chrome at: ${chromePath}`);
            }

            const config: BrowserConfig = {
                headless: this.useLocalBrowser ? false : 'new', // Use local browser window or headless
                executablePath: chromePath, // Use detected Chrome path
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-renderer-backgrounding',
                    '--disable-backgrounding-occluded-windows',
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-extensions-except',
                    '--disable-plugins-discovery'
                ]
            };

            try {
                console.log('Attempting to launch browser with configuration...');

                this.browser = await puppeteer.launch({
                    ...config,
                    timeout: 30000, // Reduced timeout for faster failure detection
                    protocolTimeout: 30000,
                    defaultViewport: null,
                    devtools: false,
                    slowMo: 100
                });

                console.log('Local browser launched successfully');

                // Test browser connectivity
                const pages = await this.browser.pages();
                console.log(`Browser ready with ${pages.length} initial pages`);

            } catch (error) {
                console.error('Failed to launch local browser:', (error as Error).message);
                console.log('Diagnosing browser issues...');

                // Try to diagnose the issue
                await this.diagnoseBrowserIssue(error as Error);

                console.log('Attempting fallback to headless mode...');

                try {
                    // More conservative fallback configuration
                    const fallbackConfig: BrowserConfig = {
                        headless: 'new',
                        executablePath: chromePath, // Use same Chrome path for fallback
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu',
                            '--disable-web-security'
                        ]
                    };

                    this.browser = await puppeteer.launch({
                        ...fallbackConfig,
                        timeout: 20000, // Even shorter timeout for fallback
                        protocolTimeout: 20000
                    });

                    console.log('Fallback headless browser launched successfully');

                } catch (fallbackError) {
                    console.error('Fallback browser also failed:', (fallbackError as Error).message);
                    throw new Error(`Both local and headless browser launch failed. Local: ${(error as Error).message}, Headless: ${(fallbackError as Error).message}`);
                }
            }
        }
        return this.browser;
    }

    async createPage(): Promise<Page> {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        console.log('Configuring page for local browser scraping...');

        // Set user agent to match local browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Remove viewport restrictions for local browser (let it use natural size)
        // Only set viewport if we're in headless mode
        const isHeadless = await this.isHeadlessMode();
        if (isHeadless) {
            await page.setViewport({ width: 1366, height: 768 });
        }

        // Set extra headers to appear more like a real browser
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        });

        // Remove automation indicators
        await page.evaluateOnNewDocument(() => {
            // Remove webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            // Mock plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Mock languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        });

        // Set default navigation timeout
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(30000);

        console.log('Page configured for enhanced human-like behavior');
        return page;
    }

    // Helper method to check if we're running in headless mode
    private async isHeadlessMode(): Promise<boolean> {
        if (!this.browser) return true;
        try {
            const version = await this.browser.version();
            return version.includes('HeadlessChrome');
        } catch {
            return true;
        }
    }

    // Diagnostic method to help troubleshoot browser issues
    private async diagnoseBrowserIssue(error: Error): Promise<void> {
        console.log('=== Browser Launch Diagnostics ===');

        try {
            // Check if Chrome/Chromium is available using our path detection
            const chromePath = this.getChromeExecutablePath();
            if (chromePath) {
                console.log('✅ Chrome found at:', chromePath);

                // Try to get version if possible
                try {
                    let versionCommand = '';
                    if (process.platform === 'darwin') {
                        versionCommand = `"${chromePath}" --version`;
                    } else {
                        versionCommand = `${chromePath} --version`;
                    }

                    const chromeVersion = execSync(versionCommand, { encoding: 'utf8', timeout: 5000 });
                    console.log('✅ Chrome version:', chromeVersion.trim());
                } catch (versionError) {
                    console.log('⚠️ Chrome found but version check failed');
                }
            } else {
                console.log('❌ No Chrome/Chromium found');
                if (process.platform === 'darwin') {
                    console.log('💡 Try: Install Chrome from https://www.google.com/chrome/');
                } else if (process.platform === 'linux') {
                    console.log('💡 Try: sudo apt-get install google-chrome-stable');
                } else {
                    console.log('💡 Try: Install Chrome from https://www.google.com/chrome/');
                }
            }
        } catch (importError) {
            console.log('⚠️ Cannot check browser installation');
        }

        // Check error type
        if (error.message.includes('socket hang up')) {
            console.log('🔍 Socket hang up detected - possible causes:');
            console.log('  - Network connectivity issues');
            console.log('  - Firewall blocking browser startup');
            console.log('  - System resource constraints');
            console.log('  - Browser executable not found');
        }

        if (error.message.includes('ECONNREFUSED')) {
            console.log('🔍 Connection refused - browser may not be starting');
        }

        if (error.message.includes('timeout')) {
            console.log('🔍 Timeout - browser taking too long to start');
        }

        // Check system resources
        try {
            const memInfo = process.memoryUsage();
            const memUsageMB = Math.round(memInfo.rss / 1024 / 1024);
            console.log(`💾 Memory usage: ${memUsageMB}MB`);

            if (memUsageMB > 500) {
                console.log('⚠️ High memory usage detected');
            }
        } catch {
            console.log('⚠️ Cannot check memory usage');
        }

        console.log('=== End Diagnostics ===');
    }

    async retryOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`${operationName} - Attempt ${attempt}/${this.maxRetries}`);
                return await operation();
            } catch (error) {
                lastError = error as Error;
                console.log(`${operationName} failed (attempt ${attempt}/${this.maxRetries}): ${lastError.message}`);

                if (attempt < this.maxRetries) {
                    const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
                    console.log(`Retrying in ${backoffDelay}ms...`);
                    await delay(backoffDelay);
                } else {
                    console.log(`${operationName} failed after ${this.maxRetries} attempts`);
                }
            }
        }

        throw lastError!;
    }

    // Enhanced scraping method with category URLs (inspired by Bright Data approach)
    async scrapeTrendingProducts(limit: number = 20): Promise<Product[]> {
        return this.retryOperation(async () => {
            let page: Page | null = null;
            try {
                page = await this.createPage();

                // Use specific category URLs for better results (inspired by Bright Data approach)
                const categoryUrls = [
                    'https://www.amazon.com/gp/bestsellers/electronics/',
                    'https://www.amazon.com/gp/bestsellers/office-products/',
                    'https://www.amazon.com/gp/bestsellers/wireless/',
                    'https://www.amazon.com/gp/bestsellers/'
                ];

                console.log('Navigating to Amazon Best Sellers categories...');

                // Try the electronics category first (more reliable)
                const targetUrl = categoryUrls[0];
                console.log(`Targeting: ${targetUrl}`);

                // Add human-like behavior for local browser
                if (this.useLocalBrowser) {
                    console.log('Using local browser - adding human-like navigation behavior...');

                    // First navigate to Amazon homepage to establish session
                    await page.goto('https://www.amazon.com/', {
                        waitUntil: 'domcontentloaded',
                        timeout: 45000
                    });

                    // Human-like delay and scroll
                    await delay(Math.random() * 2000 + 1000);
                    await page.evaluate(() => window.scrollTo(0, 200));
                    await delay(Math.random() * 1500 + 500);

                    // Now navigate to target category
                    await page.goto(targetUrl, {
                        waitUntil: 'domcontentloaded',
                        timeout: 45000
                    });
                } else {
                    // Direct navigation for headless mode
                    await page.goto(targetUrl, {
                        waitUntil: 'domcontentloaded',
                        timeout: 45000
                    });
                }

                // Wait for page to stabilize
                const stabilizeDelay = this.useLocalBrowser ?
                    Math.random() * 4000 + 3000 : // 3-7 seconds for local browser
                    Math.random() * 3000 + 2000;   // 2-5 seconds for headless
                await delay(stabilizeDelay);

                // Try multiple selectors for product elements
                const productSelectors = [
                    '[data-testid="bestsellers-productCard"]',
                    '.zg-grid-general-faceout',
                    '.a-carousel-card',
                    '.s-result-item',
                    '[data-component-type="s-search-result"]',
                    '.zg-item-immersion'
                ];

                let productsFound = false;
                for (const selector of productSelectors) {
                    try {
                        await page.waitForSelector(selector, { timeout: 10000 });
                        productsFound = true;
                        console.log(`Found products using selector: ${selector}`);
                        break;
                    } catch (error) {
                        console.log(`Selector ${selector} not found, trying next...`);
                    }
                }

                if (!productsFound) {
                    throw new Error('No product elements found on the page');
                }

                // Add human-like behavior before scraping
                if (this.useLocalBrowser) {
                    console.log('Simulating human browsing behavior...');

                    // Scroll down slowly to load more content
                    await page.evaluate(async () => {
                        const scrollDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                        for (let i = 0; i < 3; i++) {
                            window.scrollBy(0, 300);
                            await scrollDelay(800 + Math.random() * 400);
                        }
                        // Scroll back to top
                        window.scrollTo(0, 0);
                        await scrollDelay(500);
                    });

                    await delay(Math.random() * 2000 + 1500);
                } else {
                    // Simple delay for headless mode
                    await delay(Math.random() * 2000 + 1000);
                }

                console.log('Extracting product data (simple mode)...');

                // Simple extraction without scrolling for the basic endpoint
                const products = await page.evaluate((limit: number): Product[] => {
                    // Use multiple selector strategies for better product discovery
                    let productElements: Element[] = [];

                    // Method 1: Try the specific selector path first
                    const cardContainer = document.querySelector('#CardInstanceLxwOSGw9ibw7kseHPvQbcw');
                    if (cardContainer) {
                        const gridRows = cardContainer.querySelectorAll('.p13n-gridRow._cDEzb_grid-row_3Cywl');
                        gridRows.forEach(row => {
                            const rowProducts = row.querySelectorAll('[data-asin]');
                            productElements.push(...Array.from(rowProducts));
                        });
                        console.log(`Method 1 (specific path): Found ${productElements.length} products`);
                    }

                    // Method 2: Fallback to generic data-asin search if not enough products
                    if (productElements.length < 5) {
                        const genericProducts = document.querySelectorAll('[data-asin]');
                        genericProducts.forEach(product => {
                            if (!productElements.includes(product)) {
                                productElements.push(product);
                            }
                        });
                        console.log(`Method 2 (generic): Total ${productElements.length} products`);
                    }

                    // Method 3: Try Amazon Best Sellers specific selectors
                    if (productElements.length < 3) {
                        const bestSellerProducts = document.querySelectorAll('.zg-grid-general-faceout, .p13n-sc-uncoverable-faceout, .zg-item-immersion');
                        bestSellerProducts.forEach(product => {
                            if (!productElements.includes(product)) {
                                productElements.push(product);
                            }
                        });
                        console.log(`Method 3 (best sellers): Total ${productElements.length} products`);
                    }

                    const results: Product[] = [];
                    const maxResults = Math.min(productElements.length, limit);

                    for (let i = 0; i < maxResults; i++) {
                        const element = productElements[i];
                        if (!element) continue;

                        try {
                            // Enhanced title extraction with specific Amazon classes
                            let title = '';
                            const titleSelectors = [
                                '._cDEzb_p13n-sc-css-line-clamp-3_g3dy1', // Specific Amazon title class
                                '.p13n-sc-truncate',
                                '.s-title',
                                '.a-size-base-plus',
                                '.a-size-medium',
                                'h2 span',
                                'h3 span',
                                '.zg-text-center p',
                                'span[class*="truncate"]'
                            ];

                            for (const selector of titleSelectors) {
                                const titleEl = element.querySelector(selector);
                                if (titleEl && titleEl.textContent?.trim()) {
                                    title = titleEl.textContent.trim();
                                    break;
                                }
                            }

                            if (!title || title.length < 5) continue;

                            // Enhanced price extraction with specific Amazon classes
                            let price = 'Price not available';
                            const priceSelectors = [
                                '._cDEzb_p13n-sc-price_3mJ9Z', // Specific Amazon price class
                                '.p13n-sc-price',
                                '.a-price-whole',
                                '.a-price .a-offscreen',
                                '.sx-price',
                                'span[class*="price"]'
                            ];

                            for (const selector of priceSelectors) {
                                const priceEl = element.querySelector(selector);
                                if (priceEl && priceEl.textContent?.trim()) {
                                    price = priceEl.textContent.trim();
                                    break;
                                }
                            }

                            // Enhanced rating extraction
                            let rating = 'N/A';
                            const ratingSelectors = [
                                '.a-icon-alt',
                                '[data-testid="star-rating"]',
                                '.sx-stars',
                                'span[class*="rating"]'
                            ];

                            for (const selector of ratingSelectors) {
                                const ratingEl = element.querySelector(selector);
                                if (ratingEl && ratingEl.textContent?.includes('out of')) {
                                    rating = ratingEl.textContent.trim();
                                    break;
                                }
                            }

                            // Enhanced image extraction with specific Amazon classes
                            let image: string | null = null;
                            const imageSelectors = [
                                '.p13n-sc-dynamic-image', // Specific Amazon image class
                                'img[src*="amazon.com"]',
                                '.a-dynamic-image',
                                'img[data-src]'
                            ];

                            for (const selector of imageSelectors) {
                                const imgEl = element.querySelector(selector) as HTMLImageElement;
                                if (imgEl && (imgEl.src || imgEl.dataset.src)) {
                                    image = imgEl.src || imgEl.dataset.src || null;
                                    break;
                                }
                            }

                            // Enhanced link extraction
                            let link: string | null = null;
                            const linkEl = element.querySelector('a[href*="/dp/"], a[href*="/gp/product/"]') as HTMLAnchorElement;
                            if (linkEl && linkEl.href) {
                                link = linkEl.href.startsWith('http') ? linkEl.href : `https://www.amazon.com${linkEl.href}`;
                            }

                            // Get ASIN for reference
                            const asin = element.getAttribute('data-asin') || '';

                            // Extract rank from badge if available
                            let rank: string | number = i + 1;
                            const rankEl = element.querySelector('.zg-bdg-text');
                            if (rankEl && rankEl.textContent?.trim()) {
                                rank = rankEl.textContent.trim().replace('#', '');
                            }

                            results.push({
                                rank: rank,
                                title: title,
                                price: price,
                                rating: rating,
                                image: image,
                                link: link,
                                source: `Amazon Best Sellers (Electronics) - ASIN: ${asin}`,
                                scrapedAt: new Date().toISOString()
                            });

                        } catch (extractError) {
                            console.log(`Error extracting product ${i + 1}:`, extractError);
                            continue;
                        }
                    }

                    return results;
                }, limit);

                if (products.length === 0) {
                    throw new Error('No products extracted from page');
                }

                console.log(`Successfully scraped ${products.length} products using simple extraction`);
                return products;

            } catch (error) {
                console.error('Enhanced scraping failed:', (error as Error).message);
                throw error;
            } finally {
                if (page) {
                    await page.close();
                }
            }
        }, 'Enhanced Multi-Category Scraping');
    }

    // Scrape individual product details from a specific Amazon URL
    async scrapeProductDetails(productUrl: string): Promise<Product | null> {
        console.log(`🔍 Scraping product details from: ${productUrl}`);

        // Validate Amazon URL
        if (!this.isValidAmazonUrl(productUrl)) {
            throw new Error('Invalid Amazon URL provided');
        }

        try {
            const page = await this.createPage();

            console.log('Navigating to product page...');
            await page.goto(productUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // Wait for essential elements to load
            await page.waitForTimeout(2000);

            console.log('Extracting product details...');

            // Extract product details using multiple selectors for reliability
            const productDetails = await page.evaluate(() => {
                // Helper function to get text content with fallback
                const getTextContent = (selectors: string[]): string => {
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            return element.textContent?.trim() || '';
                        }
                    }
                    return '';
                };

                // Helper function to get attribute with fallback
                const getAttribute = (selectors: string[], attribute: string): string => {
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            return element.getAttribute(attribute) || '';
                        }
                    }
                    return '';
                };

                // Extract title
                const title = getTextContent([
                    '#productTitle',
                    '.product-title h1',
                    'h1.a-size-large',
                    'h1 span'
                ]);

                // Extract price
                const price = getTextContent([
                    '.a-price .a-offscreen',
                    '.a-price-whole',
                    '#priceblock_dealprice',
                    '#priceblock_ourprice',
                    '.a-price-current .a-offscreen',
                    '.a-price-range .a-offscreen',
                    'span.a-price.a-text-price.a-size-medium.apexPriceToPay',
                    '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen'
                ]);

                // Extract rating
                const rating = getTextContent([
                    'span.a-icon-alt',
                    '.a-icon-star .a-icon-alt',
                    '#acrPopover .a-icon-alt',
                    '.reviewCountTextLinkedHistogram .a-icon-alt'
                ]);

                // Extract main image
                const image = getAttribute([
                    '#landingImage',
                    '#imgBlkFront',
                    '.a-dynamic-image',
                    'img.a-dynamic-image'
                ], 'src') || getAttribute([
                    '#landingImage',
                    '#imgBlkFront',
                    '.a-dynamic-image',
                    'img.a-dynamic-image'
                ], 'data-old-hires');

                // Extract ASIN from URL or page
                const asinElement = document.querySelector('div[data-asin]');
                let asin = '';
                if (asinElement) {
                    asin = asinElement.getAttribute('data-asin') || '';
                } else {
                    // Extract ASIN from URL
                    const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
                    asin = urlMatch ? urlMatch[1] : '';
                }

                // Extract availability/stock status
                const availability = getTextContent([
                    '#availability span',
                    '.a-color-success',
                    '.a-color-state',
                    '#availability .a-color-success'
                ]);

                // Extract review count
                const reviewCount = getTextContent([
                    'a[href="#customerReviews"] span',
                    '#acrCustomerReviewText',
                    '.a-link-normal span'
                ]);

                // Extract brand
                const brand = getTextContent([
                    '#bylineInfo',
                    '.a-link-normal#bylineInfo',
                    'a.a-link-normal span',
                    '.po-brand .po-break-word'
                ]);

                // Extract features/description
                const features = Array.from(document.querySelectorAll('#feature-bullets ul li, .a-unordered-list.a-nostyle li'))
                    .map(li => li.textContent?.trim())
                    .filter(text => text && !text.includes('Make sure') && text.length > 10)
                    .slice(0, 5); // Get top 5 features

                return {
                    title,
                    price,
                    rating,
                    image,
                    asin,
                    availability,
                    reviewCount,
                    brand,
                    features,
                    url: window.location.href
                };
            });

            await page.close();

            // Validate extracted data
            if (!productDetails.title || productDetails.title.length < 5) {
                throw new Error('Could not extract product title - page may have failed to load properly');
            }

            // Construct product object
            const product: Product = {
                rank: '1', // Individual products don't have ranks
                title: productDetails.title,
                price: productDetails.price || 'Price not available',
                rating: productDetails.rating || 'Rating not available',
                image: productDetails.image || 'https://via.placeholder.com/200x200?text=No+Image',
                link: productUrl,
                source: `Amazon Product Detail${productDetails.asin ? ` - ASIN: ${productDetails.asin}` : ''}`,
                scrapedAt: new Date().toISOString(),
                // Additional details specific to individual products
                ...(productDetails.asin && { asin: productDetails.asin }),
                ...(productDetails.availability && { availability: productDetails.availability }),
                ...(productDetails.reviewCount && { reviewCount: productDetails.reviewCount }),
                ...(productDetails.brand && { brand: productDetails.brand }),
                ...(productDetails.features.length > 0 && { features: productDetails.features.filter((f): f is string => f !== undefined) })
            };

            console.log(`✅ Successfully extracted product details: ${product.title}`);
            return product;

        } catch (error) {
            console.error('❌ Error scraping product details:', (error as Error).message);
            throw error;
        }
    }

    private isValidAmazonUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const validDomains = [
                'amazon.com',
                'amazon.co.uk',
                'amazon.ca',
                'amazon.de',
                'amazon.fr',
                'amazon.it',
                'amazon.es',
                'amazon.co.jp',
                'amazon.in',
                'amazon.com.au',
                'amazon.com.br',
                'amazon.com.mx'
            ];

            const isAmazonDomain = validDomains.some(domain =>
                urlObj.hostname === domain || urlObj.hostname === `www.${domain}`
            );

            // Check if URL contains product indicators
            const hasProductPath = urlObj.pathname.includes('/dp/') ||
                urlObj.pathname.includes('/gp/product/') ||
                urlObj.pathname.includes('/product/');

            return isAmazonDomain && hasProductPath;
        } catch {
            return false;
        }
    }

    // Fallback method that returns sample data when scraping fails
    async getFallbackProducts(limit: number = 10): Promise<Product[]> {
        console.log('Using fallback product data due to scraping failures...');

        const fallbackProducts: Product[] = [
            {
                rank: 1,
                title: "Echo Dot (5th Gen) | Smart speaker with bigger vibrant sound and Alexa",
                price: "$49.99",
                rating: "4.7 out of 5 stars",
                image: null,
                link: null,
                source: "Fallback Data - Amazon Best Sellers",
                scrapedAt: new Date().toISOString()
            },
            {
                rank: 2,
                title: "Fire TV Stick 4K Max streaming device",
                price: "$54.99",
                rating: "4.6 out of 5 stars",
                image: null,
                link: null,
                source: "Fallback Data - Amazon Best Sellers",
                scrapedAt: new Date().toISOString()
            },
            {
                rank: 3,
                title: "Apple AirPods (3rd Generation) Wireless Earbuds",
                price: "$169.00",
                rating: "4.4 out of 5 stars",
                image: null,
                link: null,
                source: "Fallback Data - Amazon Best Sellers",
                scrapedAt: new Date().toISOString()
            },
            {
                rank: 4,
                title: "Kindle Paperwhite – Now with 6.8\" display and adjustable warm light",
                price: "$139.99",
                rating: "4.6 out of 5 stars",
                image: null,
                link: null,
                source: "Fallback Data - Amazon Best Sellers",
                scrapedAt: new Date().toISOString()
            },
            {
                rank: 5,
                title: "Apple Watch Series 9 [GPS 41mm] Smartwatch",
                price: "$329.00",
                rating: "4.5 out of 5 stars",
                image: null,
                link: null,
                source: "Fallback Data - Amazon Best Sellers",
                scrapedAt: new Date().toISOString()
            }
        ];

        // Return only the requested number of products
        return fallbackProducts.slice(0, limit);
    }

    // Alternative HTTP-only scraping method (no browser required)
    async scrapeWithHttpOnly(limit: number = 10): Promise<Product[]> {
        console.log('Attempting HTTP-only scraping approach...');

        try {
            const https = require('https');
            // Use electronics category for HTTP scraping too
            const url = 'https://www.amazon.com/gp/bestsellers/electronics/';

            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 10000
            };

            const html = await new Promise<string>((resolve, reject) => {
                const req = https.get(url, options, (res: any) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode}`));
                        return;
                    }

                    let data = '';
                    res.on('data', (chunk: any) => data += chunk);
                    res.on('end', () => resolve(data));
                });

                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('HTTP request timeout'));
                });
            });

            // Enhanced HTML parsing with multiple patterns
            const products: Product[] = [];

            // Try multiple regex patterns for different Amazon layouts
            const titlePatterns = [
                /<span[^>]*class="[^"]*p13n-sc-truncate[^"]*"[^>]*>([^<]+)<\/span>/gi,
                /<h2[^>]*class="[^"]*s-size-mini[^"]*"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/gi,
                /<span[^>]*class="[^"]*a-size-base-plus[^"]*"[^>]*>([^<]+)<\/span>/gi,
                /<span[^>]*class="[^"]*a-size-medium[^"]*"[^>]*>([^<]+)<\/span>/gi,
                /<h3[^>]*>.*?<span[^>]*>([^<]+)<\/span>.*?<\/h3>/gi
            ];

            let rank = 1;

            for (const pattern of titlePatterns) {
                let match;
                const regex = new RegExp(pattern.source, pattern.flags);

                while ((match = regex.exec(html)) !== null && rank <= limit) {
                    const title = match[1].trim();

                    // Better title validation
                    if (title &&
                        title.length > 10 &&
                        title.length < 200 &&
                        !title.includes('Amazon') &&
                        !title.includes('Best Sellers') &&
                        !/^[0-9\s\-#\.]*$/.test(title)) {

                        // Check for duplicates
                        const isDuplicate = products.some(p => p.title === title);
                        if (!isDuplicate) {
                            products.push({
                                rank: rank,
                                title: title,
                                price: 'Price not available',
                                rating: 'N/A',
                                image: null,
                                link: null,
                                source: 'Amazon Best Sellers (HTTP)',
                                scrapedAt: new Date().toISOString()
                            });
                            rank++;
                        }
                    }
                }

                // If we found products with this pattern, break
                if (products.length > 0) {
                    console.log(`Found products using pattern: ${pattern.source.substring(0, 50)}...`);
                    break;
                }
            }

            if (products.length > 0) {
                console.log(`HTTP-only scraping found ${products.length} products`);
                return products;
            } else {
                throw new Error('No products found in HTTP response');
            }

        } catch (error) {
            console.error('HTTP-only scraping failed:', (error as Error).message);
            throw error;
        }
    }

    // Enhanced scraping method with multiple fallback strategies
    async getTrendingProducts(limit: number = 20): Promise<Product[]> {
        // Check if browser is available, if not skip directly to HTTP-only
        const skipBrowser = process.env.SKIP_BROWSER === 'true';

        if (skipBrowser) {
            console.log('Browser scraping disabled via SKIP_BROWSER env var');
            try {
                return await this.scrapeWithHttpOnly(limit);
            } catch (httpError) {
                console.error('HTTP-only scraping failed:', (httpError as Error).message);
                return await this.getFallbackProducts(limit);
            }
        }

        try {
            // First try the main browser-based scraping method
            return await this.scrapeTrendingProducts(limit);
        } catch (error) {
            console.error('Browser-based scraping failed:', (error as Error).message);

            // Try HTTP-only approach as secondary fallback
            try {
                console.log('Trying HTTP-only scraping as fallback...');
                return await this.scrapeWithHttpOnly(limit);
            } catch (httpError) {
                console.error('HTTP-only scraping also failed:', (httpError as Error).message);

                // Final fallback to sample data
                console.log('Returning fallback product data...');
                return await this.getFallbackProducts(limit);
            }
        }
    }

    // Configuration methods
    setLocalBrowserMode(useLocal: boolean): void {
        this.useLocalBrowser = useLocal;
        console.log(`Browser mode set to: ${useLocal ? 'local visible' : 'headless'}`);

        // Close existing browser to apply new settings
        if (this.browser) {
            this.closeBrowser();
        }
    }

    getCurrentBrowserMode(): string {
        return this.useLocalBrowser ? 'local visible' : 'headless';
    }

    getBrowserStatus(): { mode: string; isRunning: boolean; retries: number } {
        return {
            mode: this.getCurrentBrowserMode(),
            isRunning: this.browser !== null,
            retries: this.maxRetries
        };
    }

    private getChromeExecutablePath(): string | undefined {
        // Common Chrome paths for different platforms
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

        // Check each path until we find one that exists
        for (const path of paths) {
            try {
                if (fs.existsSync(path)) {
                    console.log(`Found Chrome executable at: ${path}`);
                    return path;
                }
            } catch (error) {
                // Continue checking other paths
            }
        }

        // Try to find Chrome using command line tools
        try {
            if (platform === 'darwin') {
                // macOS: Try to find Chrome using mdfind
                const result = execSync('mdfind "kMDItemCFBundleIdentifier == \'com.google.Chrome\'"', {
                    encoding: 'utf8',
                    timeout: 5000
                }).trim();

                if (result) {
                    const chromePath = result.split('\n')[0] + '/Contents/MacOS/Google Chrome';
                    if (fs.existsSync(chromePath)) {
                        console.log(`Found Chrome via mdfind at: ${chromePath}`);
                        return chromePath;
                    }
                }
            } else if (platform === 'linux') {
                // Linux: Try which command
                const result = execSync('which google-chrome || which chromium-browser', {
                    encoding: 'utf8',
                    timeout: 5000
                }).trim();

                if (result && fs.existsSync(result)) {
                    console.log(`Found Chrome via which at: ${result}`);
                    return result;
                }
            }
        } catch (error) {
            console.log('Could not locate Chrome using system commands');
        }

        console.log('No Chrome executable found, letting Puppeteer use default');
        return undefined;
    }

    async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // Cleanup method to be called on app shutdown
    async cleanup(): Promise<void> {
        await this.closeBrowser();
    }
}

// Create singleton instance
const amazonScraper = new AmazonScraper();

// Cleanup on process exit
process.on('SIGINT', async (): Promise<void> => {
    console.log('Cleaning up browser...');
    await amazonScraper.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async (): Promise<void> => {
    console.log('Cleaning up browser...');
    await amazonScraper.cleanup();
    process.exit(0);
});

export default amazonScraper; 