export interface Product {
    rank: string | number;
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

export interface DatabaseProduct {
    id?: number;
    asin?: string;
    rank: number;
    title: string;
    price: string;
    rating: string;
    image_url: string | null;
    product_url: string | null;
    source: string;
    category: string;
    scraped_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface ScrapingSession {
    id?: number;
    session_id: string;
    source: string;
    category: string;
    products_found: number;
    success: boolean;
    error_message?: string;
    started_at: Date;
    completed_at?: Date;
} 