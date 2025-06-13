import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseConfig: PoolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'web3fygo',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true
    } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
};

export const pool = new Pool(databaseConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};

// Initialize database tables
export const initializeDatabase = async (): Promise<void> => {
    try {
        const client = await pool.connect();

        // Create products table
        try {
        await client.query(`
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
        `);
        } catch (error: any) {
            if (error.code !== '42P07') { // 42P07 is the error code for duplicate table
                throw error;
            }
        }

        // Create metadata table
        try {
        await client.query(`
                CREATE TABLE IF NOT EXISTS metadata (
                    id SERIAL PRIMARY KEY,
                    type VARCHAR(50) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    url TEXT NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(type, category)
                );
            `);
        } catch (error: any) {
            if (error.code !== '42P07') {
                throw error;
            }
        }

        // Create indexes for better performance
        try {
        await client.query(`
                CREATE INDEX IF NOT EXISTS idx_metadata_type_category ON metadata(type, category);
                CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
            CREATE INDEX IF NOT EXISTS idx_products_scraped_at ON products(scraped_at DESC);
                CREATE INDEX IF NOT EXISTS idx_products_rank ON products(rank);
                CREATE INDEX IF NOT EXISTS idx_products_url ON products(product_url);
        `);
        } catch (error: any) {
            if (error.code !== '42701') { // 42701 is the error code for duplicate index
                throw error;
            }
        }

        // Create scraping_sessions table
        try {
        await client.query(`
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
        `);
        } catch (error: any) {
            if (error.code !== '42P07') {
                throw error;
            }
        }

        // Create indexes for scraping_sessions
        try {
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON scraping_sessions(session_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON scraping_sessions(started_at DESC);
            `);
        } catch (error: any) {
            if (error.code !== '42701') {
                throw error;
            }
        }

        // Create fresh_products view
        try {
            await client.query(`
                CREATE OR REPLACE VIEW fresh_products AS
                SELECT 
                    id, asin, rank, title, price, rating, image_url, product_url, source, category,
                    scraped_at, created_at, updated_at,
                    EXTRACT(EPOCH FROM (NOW() - scraped_at))/3600 as hours_old
                FROM products
                WHERE scraped_at > NOW() - INTERVAL '24 hours'
                ORDER BY rank ASC, scraped_at DESC;
            `);
        } catch (error: any) {
            if (error.code !== '42710') { // 42710 is the error code for duplicate view
                throw error;
            }
        }

        // Create clean_old_products function
        try {
            await client.query(`
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
            `);
        } catch (error: any) {
            if (error.code !== '42723') { // 42723 is the error code for duplicate function
                throw error;
            }
        }

        // Create get_product_stats function
        try {
            await client.query(`
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
            `);
        } catch (error: any) {
            if (error.code !== '42723') {
                throw error;
            }
        }

        // Create update_updated_at_column function and trigger
        try {
            await client.query(`
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);
        } catch (error: any) {
            if (error.code !== '42723') {
                throw error;
            }
        }

        // Create trigger and ignore if already exists
        try {
            await client.query(`
                CREATE TRIGGER update_metadata_updated_at
                    BEFORE UPDATE ON metadata
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);
        } catch (error: any) {
            if (error.code !== '42710') { // 42710 is the error code for duplicate trigger
                throw error;
            }
        }

        // Insert sample data
        try {
            await client.query(`
                INSERT INTO products (asin, rank, title, price, rating, image_url, product_url, source, category, scraped_at)
                VALUES 
                    ('B08N5WRWNW', 1, 'Sample Product 1', '$29.99', '4.5 out of 5 stars', 'https://via.placeholder.com/300x200', 'https://amazon.com/dp/B08N5WRWNW', 'Sample Data', 'electronics', CURRENT_TIMESTAMP),
                    ('B07YTG4T6Q', 2, 'Sample Product 2', '$49.99', '4.2 out of 5 stars', 'https://via.placeholder.com/300x200', 'https://amazon.com/dp/B07YTG4T6Q', 'Sample Data', 'electronics', CURRENT_TIMESTAMP)
                ON CONFLICT (asin) DO NOTHING;
            `);
        } catch (error: any) {
            if (error.code !== '23505') { // 23505 is the error code for unique violation
                throw error;
            }
        }

        client.release();
        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
};

// Close database connection pool
export const closeDatabase = async (): Promise<void> => {
    await pool.end();
    console.log('Database connection pool closed');
}; 