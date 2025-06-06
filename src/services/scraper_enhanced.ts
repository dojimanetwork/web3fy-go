import puppeteer, { Browser, Page } from 'puppeteer';
import { delay } from '../utils/helpers';
import { Product, BrowserConfig } from '../types';
import { execSync } from 'child_process';
import * as fs from 'fs';

class EnhancedAmazonScraper {
    private browser: Browser | null = null;
    private maxRetries: number = 3;
    private retryDelay: number = 2000;
    private useLocalBrowser: boolean = true;

    private getChromeExecutablePath(): string | undefined {
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

        for (const path of paths) {
            try {
                if (fs.existsSync(path)) {
                    console.log(`Found Chrome executable at: ${path}`);
                    return path;
                }
            } catch (error) {
                continue;
            }
        }

        console.log('No Chrome executable found, letting Puppeteer use default');
        return undefined;
    }

    async initBrowser(): Promise<Browser> {
        if (!this.browser) {
            const chromePath = this.getChromeExecutablePath();

            const config: BrowserConfig = {
                headless: this.useLocalBrowser ? false : 'new',
                executablePath: chromePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-blink-features=AutomationControlled',
                    '--start-maximized'
                ]
            };

            this.browser = await puppeteer.launch({
                ...config,
                timeout: 30000,
                defaultViewport: null
            });

            console.log('Enhanced browser launched successfully');
        }
        return this.browser;
    }

    async createPage(): Promise<Page> {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        page.setDefaultNavigationTimeout(60000);
        return page;
    }

    async scrapeProductsWithScrolling(limit: number = 50): Promise<Product[]> {
        let page: Page | null = null;
        try {
            page = await this.createPage();

            // Navigate to Amazon Best Sellers Electronics
            const targetUrl = 'https://www.amazon.com/gp/bestsellers/electronics/';
            console.log(`Navigating to: ${targetUrl}`);

            await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 45000
            });

            // Wait for page to stabilize
            await delay(3000);

            // Try to find products using multiple approaches
            await page.waitForSelector('[data-asin], .zg-grid-general-faceout, .p13n-sc-uncoverable-faceout', { timeout: 15000 });

            let allProducts: Product[] = [];
            let scrollAttempts = 0;
            const maxScrollAttempts = 6;
            const targetProducts = Math.min(limit, 50);

            console.log(`Starting extraction for up to ${targetProducts} products...`);

            while (allProducts.length < targetProducts && scrollAttempts < maxScrollAttempts) {
                console.log(`\n--- Extraction Attempt ${scrollAttempts + 1}/${maxScrollAttempts} ---`);
                console.log(`Current products: ${allProducts.length}/${targetProducts}`);

                // Extract products from current view
                const currentProducts = await page.evaluate((): Product[] => {
                    const results: Product[] = [];

                    // Try multiple selector approaches
                    let productElements: Element[] = [];

                    // Method 1: User's specific selector path
                    const cardContainer = document.querySelector('#CardInstanceLxwOSGw9ibw7kseHPvQbcw');
                    if (cardContainer) {
                        const gridRows = cardContainer.querySelectorAll('.p13n-gridRow._cDEzb_grid-row_3Cywl');
                        gridRows.forEach(row => {
                            const rowProducts = row.querySelectorAll('[data-asin]');
                            productElements.push(...Array.from(rowProducts));
                        });
                        console.log(`Method 1 (specific path): Found ${productElements.length} products`);
                    }

                    // Method 2: Generic data-asin search
                    if (productElements.length < 10) {
                        const genericProducts = document.querySelectorAll('[data-asin]');
                        genericProducts.forEach(product => {
                            if (!productElements.includes(product)) {
                                productElements.push(product);
                            }
                        });
                        console.log(`Method 2 (generic): Total ${productElements.length} products`);
                    }

                    // Method 3: Best sellers specific selectors
                    if (productElements.length < 5) {
                        const bestSellerProducts = document.querySelectorAll('.zg-grid-general-faceout, .p13n-sc-uncoverable-faceout, .zg-item-immersion');
                        bestSellerProducts.forEach(product => {
                            if (!productElements.includes(product)) {
                                productElements.push(product);
                            }
                        });
                        console.log(`Method 3 (best sellers): Total ${productElements.length} products`);
                    }

                    // Extract data from found elements
                    for (let i = 0; i < productElements.length; i++) {
                        const element = productElements[i];
                        if (!element) continue;

                        try {
                            // Extract title
                            let title = '';
                            const titleSelectors = [
                                '._cDEzb_p13n-sc-css-line-clamp-3_g3dy1',
                                '.p13n-sc-truncate',
                                '.s-title',
                                '.a-size-base-plus',
                                'h2 span',
                                'h3 span'
                            ];

                            for (const selector of titleSelectors) {
                                const titleEl = element.querySelector(selector);
                                if (titleEl && titleEl.textContent?.trim()) {
                                    title = titleEl.textContent.trim();
                                    break;
                                }
                            }

                            if (!title || title.length < 5) continue;

                            // Extract price
                            let price = 'Price not available';
                            const priceSelectors = [
                                '._cDEzb_p13n-sc-price_3mJ9Z',
                                '.p13n-sc-price',
                                '.a-price-whole',
                                '.a-price .a-offscreen'
                            ];

                            for (const selector of priceSelectors) {
                                const priceEl = element.querySelector(selector);
                                if (priceEl && priceEl.textContent?.trim()) {
                                    price = priceEl.textContent.trim();
                                    break;
                                }
                            }

                            // Extract rating
                            let rating = 'N/A';
                            const ratingEl = element.querySelector('.a-icon-alt');
                            if (ratingEl && ratingEl.textContent?.includes('out of')) {
                                rating = ratingEl.textContent.trim();
                            }

                            // Extract image
                            let image: string | null = null;
                            const imgEl = element.querySelector('.p13n-sc-dynamic-image, img[src*="amazon.com"]') as HTMLImageElement;
                            if (imgEl && imgEl.src) {
                                image = imgEl.src;
                            }

                            // Extract link
                            let link: string | null = null;
                            const linkEl = element.querySelector('a[href*="/dp/"]') as HTMLAnchorElement;
                            if (linkEl && linkEl.href) {
                                link = linkEl.href.startsWith('http') ? linkEl.href : `https://www.amazon.com${linkEl.href}`;
                            }

                            // Get ASIN and rank
                            const asin = element.getAttribute('data-asin') || '';
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

                    console.log(`Extracted ${results.length} products from current view`);
                    return results;
                });

                // Add unique products to our collection
                const newProducts = currentProducts.filter(product =>
                    !allProducts.some(existing => existing.title === product.title)
                );

                console.log(`Found ${currentProducts.length} products, ${newProducts.length} new unique products`);
                allProducts.push(...newProducts);

                // If we have enough products or no new products found, stop
                if (allProducts.length >= targetProducts || newProducts.length === 0) {
                    console.log(`Stopping extraction: ${allProducts.length}/${targetProducts} products found`);
                    break;
                }

                // Scroll down to load more products
                if (scrollAttempts < maxScrollAttempts - 1) {
                    console.log('Scrolling to load more products...');
                    await page.evaluate(() => {
                        window.scrollBy(0, 1200);
                    });
                    await delay(4000); // Wait for content to load

                    // Additional scroll
                    await page.evaluate(() => {
                        window.scrollBy(0, 800);
                    });
                    await delay(3000);
                }

                scrollAttempts++;
            }

            if (allProducts.length === 0) {
                throw new Error('No products extracted from page');
            }

            console.log(`Successfully scraped ${allProducts.length} products with ${scrollAttempts} scroll attempts`);
            return allProducts.slice(0, targetProducts);

        } catch (error) {
            console.error('Enhanced scraping failed:', (error as Error).message);
            throw error;
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export default new EnhancedAmazonScraper(); 