import { Request } from 'express';

// User types
export interface User {
    id: number;
    name: string;
    email: string;
    created?: string;
    username?: string;
    role?: string;
    authenticated?: boolean;
}

// Product types
export interface Product {
    rank: number | string;
    title: string;
    price: string;
    rating: string;
    image: string | null;
    link: string | null;
    source: string;
    scrapedAt: string;
    // Additional fields for individual product details
    asin?: string;
    availability?: string;
    reviewCount?: string;
    brand?: string;
    features?: string[];
}

export interface ProductsResponse {
    products: Product[];
    totalFound: number;
    source: string;
    parameters: {
        trending: string;
        limit: number;
        forceRefresh?: boolean;
        category?: string;
        maxAgeHours?: number;
    };
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    timestamp: string;
    message: string | null;
    data: T | null;
    error: string | null;
}

export interface ErrorResponse {
    error: string;
    message: string;
    timestamp: string;
}

// Express types extensions
export interface AuthenticatedRequest extends Request {
    user?: User;
}

// Scraper types
export interface ScrapingOptions {
    limit?: number;
    timeout?: number;
}

export interface BrowserConfig {
    headless: boolean | 'new';
    args: string[];
    executablePath?: string;
}

// Helper function types
export type AsyncRequestHandler = (
    req: Request,
    res: any,
    next: any
) => Promise<void>;

// Validation types
export interface ValidationResult {
    isValid: boolean;
    missingFields: string[];
}

// Environment types
export interface ProcessEnv {
    PORT?: string;
    NODE_ENV?: string;
    DATABASE_URL?: string;
    API_KEY?: string;
    WEB3_PROVIDER_URL?: string;
    PRIVATE_KEY?: string;
}

// Rate limiting types
export interface RateLimitOptions {
    maxRequests?: number;
    windowMs?: number;
}

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: string;
}

// Health check types
export interface HealthCheckResponse {
    status: string;
    uptime: number;
    timestamp: string;
    memory: NodeJS.MemoryUsage;
    environment: string;
} 