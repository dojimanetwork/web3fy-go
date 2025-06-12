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

        // Create index on ASIN for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
        `);

        // Create index on category for faster category-based queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        `);

        // Create index on scraped_at for time-based queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_products_scraped_at ON products(scraped_at DESC);
        `);

        // Create scraping_sessions table to track scraping operations
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