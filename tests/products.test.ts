import request from 'supertest';
import app from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

// Read mock data from a JSON file
const mockData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mocks', 'mockData.json'), 'utf8'));

// Mock puppeteer to prevent actual browser launches
jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setUserAgent: jest.fn(),
            setViewport: jest.fn(),
            setExtraHTTPHeaders: jest.fn(),
            evaluateOnNewDocument: jest.fn(),
            setDefaultNavigationTimeout: jest.fn(),
            setDefaultTimeout: jest.fn(),
            goto: jest.fn(),
            waitForSelector: jest.fn(),
            evaluate: jest.fn().mockResolvedValue([]),
            close: jest.fn()
        }),
        pages: jest.fn().mockResolvedValue([]),
        close: jest.fn()
    })
}));

// Define mock objects
const mockDbService = {
    getProducts: jest.fn().mockResolvedValue(mockData.data.products),
    hasFreshData: jest.fn().mockResolvedValue({ hasFresh: true, count: 10, lastScraped: new Date() }),
    createScrapingSession: jest.fn().mockResolvedValue('test-session-id'),
    saveProducts: jest.fn().mockResolvedValue(10),
    updateScrapingSession: jest.fn().mockResolvedValue(true)
};

const mockScraper = {
    getTrendingProducts: jest.fn().mockResolvedValue(mockData.data.products),
    getFallbackProducts: jest.fn().mockResolvedValue(mockData.data.products),
    getBrowserStatus: jest.fn().mockReturnValue({ mode: 'headless', isRunning: true, retries: 0 }),
    setLocalBrowserMode: jest.fn(),
    getCurrentBrowserMode: jest.fn().mockReturnValue('headless'),
    initBrowser: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setUserAgent: jest.fn(),
            setViewport: jest.fn(),
            setExtraHTTPHeaders: jest.fn(),
            evaluateOnNewDocument: jest.fn(),
            setDefaultNavigationTimeout: jest.fn(),
            setDefaultTimeout: jest.fn(),
            goto: jest.fn(),
            waitForSelector: jest.fn(),
            evaluate: jest.fn().mockResolvedValue([]),
            close: jest.fn()
        }),
        pages: jest.fn().mockResolvedValue([]),
        close: jest.fn()
    }),
    createPage: jest.fn().mockResolvedValue({
        setUserAgent: jest.fn(),
        setViewport: jest.fn(),
        setExtraHTTPHeaders: jest.fn(),
        evaluateOnNewDocument: jest.fn(),
        setDefaultNavigationTimeout: jest.fn(),
        setDefaultTimeout: jest.fn(),
        goto: jest.fn(),
        waitForSelector: jest.fn(),
        evaluate: jest.fn().mockResolvedValue([]),
        close: jest.fn()
    }),
    closeBrowser: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined)
};

// Mock the modules using doMock to avoid hoisting issues
jest.doMock('../src/services/database', () => ({
    dbService: mockDbService
}));

jest.doMock('../src/services/scraper', () => ({
    default: mockScraper
}));

// Reset module cache to ensure mocks are applied
jest.resetModules();

describe('Products Endpoint', () => {
    let server: any;

    beforeAll(async () => {
        // Start the server
        server = app.listen(0);
    });

    afterAll(async () => {
        // Close the server
        await new Promise<void>((resolve) => {
            server.close(() => resolve());
        });
    });

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // Clean up any remaining browser instances
        if (mockScraper.closeBrowser) {
            await mockScraper.closeBrowser();
        }
        if (mockScraper.cleanup) {
            await mockScraper.cleanup();
        }
    });

    it('GET /api/products should return a list of products', async () => {
        const response = await request(app).get('/api/products?trending=amazon');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('products');
        expect(response.body.data.products).toBeInstanceOf(Array);
        expect(response.body.data.products.length).toBeGreaterThan(0);
        expect(response.body.data.products[0]).toHaveProperty('rank');
        expect(response.body.data.products[0]).toHaveProperty('title');
        expect(response.body.data.products[0]).toHaveProperty('price');
        expect(response.body.data.products[0]).toHaveProperty('rating');
        expect(response.body.data.products[0]).toHaveProperty('image');
        expect(response.body.data.products[0]).toHaveProperty('link');
        expect(response.body.data.products[0]).toHaveProperty('source');
        expect(response.body.data.products[0]).toHaveProperty('scrapedAt');
        expect(response.body.data.products[0]).toHaveProperty('asin');
    });

    it('GET /api/products should return 400 for missing trending parameter', async () => {
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Missing required parameter');
    });

    it('GET /api/products should return 400 for invalid trending parameter', async () => {
        const response = await request(app).get('/api/products?trending=invalid');
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Invalid trending parameter');
    });

    it('GET /api/products should handle force refresh parameter', async () => {
        const response = await request(app).get('/api/products?trending=amazon&force=true');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.parameters).toHaveProperty('forceRefresh', true);
    });

    it('GET /api/products should respect limit parameter', async () => {
        const response = await request(app).get('/api/products?trending=amazon&limit=5');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data.parameters).toHaveProperty('limit', 5);
    });
}); 