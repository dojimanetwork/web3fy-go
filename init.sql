-- Web3FyGo Database Initialization Script
-- This script runs when the PostgreSQL container starts for the first time

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) UNIQUE,
    rank INTEGER,
    title TEXT NOT NULL,
    price VARCHAR(50),
    rating VARCHAR(50),
    image_url TEXT,
    product_url TEXT,
    source VARCHAR(100),
    category VARCHAR(50) DEFAULT 'electronics',
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_scraped_at ON products(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_rank ON products(rank);
CREATE INDEX IF NOT EXISTS idx_products_url ON products(product_url);

-- Create scraping_sessions table to track scraping operations
CREATE TABLE IF NOT EXISTS scraping_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL,
    source VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    products_found INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON scraping_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON scraping_sessions(started_at DESC);

-- Insert some sample data for testing (optional)
INSERT INTO products (asin, rank, title, price, rating, image_url, product_url, source, category, scraped_at)
VALUES 
    ('B08N5WRWNW', 1, 'Sample Product 1', '$29.99', '4.5 out of 5 stars', 'https://via.placeholder.com/300x200', 'https://amazon.com/dp/B08N5WRWNW', 'Sample Data', 'electronics', CURRENT_TIMESTAMP),
    ('B07YTG4T6Q', 2, 'Sample Product 2', '$49.99', '4.2 out of 5 stars', 'https://via.placeholder.com/300x200', 'https://amazon.com/dp/B07YTG4T6Q', 'Sample Data', 'electronics', CURRENT_TIMESTAMP)
ON CONFLICT (asin) DO NOTHING;

-- Create a view for easy product querying
CREATE OR REPLACE VIEW fresh_products AS
SELECT 
    id, asin, rank, title, price, rating, image_url, product_url, source, category,
    scraped_at, created_at, updated_at,
    EXTRACT(EPOCH FROM (NOW() - scraped_at))/3600 as hours_old
FROM products
WHERE scraped_at > NOW() - INTERVAL '24 hours'
ORDER BY rank ASC, scraped_at DESC;

-- Create a function to clean old data
CREATE OR REPLACE FUNCTION clean_old_products(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM products 
    WHERE scraped_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get product statistics
CREATE OR REPLACE FUNCTION get_product_stats()
RETURNS TABLE(
    total_products BIGINT,
    categories_count BIGINT,
    fresh_products_24h BIGINT,
    oldest_product TIMESTAMP,
    newest_product TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(DISTINCT category) FROM products) as categories_count,
        (SELECT COUNT(*) FROM products WHERE scraped_at > NOW() - INTERVAL '24 hours') as fresh_products_24h,
        (SELECT MIN(scraped_at) FROM products) as oldest_product,
        (SELECT MAX(scraped_at) FROM products) as newest_product;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Web3FyGo database initialized successfully!';
    RAISE NOTICE '📊 Database: web3fygo';
    RAISE NOTICE '👤 User: postgres';
    RAISE NOTICE '🏠 Host: localhost:5432';
    RAISE NOTICE '🔧 Admin Panel: http://localhost:8080 (admin@web3fygo.com / admin123)';
END $$; 