import { pool } from '../config/database';
import { Product, DatabaseProduct, ScrapingSession } from '../models/Product';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {

    // Convert scraper Product to DatabaseProduct
    private convertToDbProduct(product: Product, category: string = 'electronics'): Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'> {
        // Extract ASIN from source or link
        let asin = '';
        if (product.source && product.source.includes('ASIN:')) {
            asin = product.source.split('ASIN:')[1].trim();
        } else if (product.link && product.link.includes('/dp/')) {
            const match = product.link.match(/\/dp\/([A-Z0-9]{10})/);
            if (match) asin = match[1];
        }

        return {
            asin: asin || undefined,
            rank: typeof product.rank === 'string' ? parseInt(product.rank) || 0 : product.rank,
            title: product.title,
            price: product.price,
            rating: product.rating,
            image_url: product.image,
            product_url: product.link,
            source: product.source,
            category,
            scraped_at: new Date(product.scrapedAt)
        };
    }

    // Convert DatabaseProduct to Product
    private convertFromDbProduct(dbProduct: DatabaseProduct): Product {
        const baseProduct: Product = {
            rank: dbProduct.rank,
            title: dbProduct.title,
            price: dbProduct.price,
            rating: dbProduct.rating,
            image: dbProduct.image_url,
            link: dbProduct.product_url,
            source: dbProduct.source,
            scrapedAt: dbProduct.scraped_at.toISOString()
        };

        // Add ASIN if available
        if (dbProduct.asin) {
            baseProduct.asin = dbProduct.asin;
        }

        return baseProduct;
    }

    // Save products to database
    async saveProducts(products: Product[], category: string = 'electronics'): Promise<number> {
        const client = await pool.connect();
        let savedCount = 0;

        try {
            await client.query('BEGIN');

            for (const product of products) {
                const dbProduct = this.convertToDbProduct(product, category);

                // Use UPSERT (INSERT ... ON CONFLICT DO UPDATE)
                const query = `
                    INSERT INTO products (asin, rank, title, price, rating, image_url, product_url, source, category, scraped_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (asin) 
                    DO UPDATE SET 
                        rank = EXCLUDED.rank,
                        title = EXCLUDED.title,
                        price = EXCLUDED.price,
                        rating = EXCLUDED.rating,
                        image_url = EXCLUDED.image_url,
                        product_url = EXCLUDED.product_url,
                        source = EXCLUDED.source,
                        category = EXCLUDED.category,
                        scraped_at = EXCLUDED.scraped_at,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id;
                `;

                const values = [
                    dbProduct.asin,
                    dbProduct.rank,
                    dbProduct.title,
                    dbProduct.price,
                    dbProduct.rating,
                    dbProduct.image_url,
                    dbProduct.product_url,
                    dbProduct.source,
                    dbProduct.category,
                    dbProduct.scraped_at
                ];

                await client.query(query, values);
                savedCount++;
            }

            await client.query('COMMIT');
            console.log(`✅ Saved ${savedCount} products to database`);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error saving products to database:', error);
            throw error;
        } finally {
            client.release();
        }

        return savedCount;
    }

    // Get products from database
    async getProducts(limit: number = 20, category: string = 'electronics', maxAgeHours: number = 24): Promise<Product[]> {
        const client = await pool.connect();

        try {
            // Get products that are not older than maxAgeHours
            const query = `
                SELECT * FROM products 
                WHERE category = $1 
                AND scraped_at > NOW() - INTERVAL '${maxAgeHours} hours'
                ORDER BY rank ASC, scraped_at DESC 
                LIMIT $2;
            `;

            const result = await client.query(query, [category, limit]);

            return result.rows.map(row => this.convertFromDbProduct(row));

        } catch (error) {
            console.error('❌ Error fetching products from database:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Get a specific product by URL from database
    async getProductByUrl(productUrl: string, maxAgeHours: number = 24): Promise<Product | null> {
        const client = await pool.connect();

        try {
            // Get product by URL that is not older than maxAgeHours
            const query = `
                SELECT * FROM products 
                WHERE product_url = $1 
                AND scraped_at > NOW() - INTERVAL '${maxAgeHours} hours'
                ORDER BY scraped_at DESC 
                LIMIT 1;
            `;

            const result = await client.query(query, [productUrl]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.convertFromDbProduct(result.rows[0]);

        } catch (error) {
            console.error('❌ Error fetching product by URL from database:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Check if we have fresh data (less than specified hours old)
    async hasFreshData(category: string = 'electronics', maxAgeHours: number = 24): Promise<{ hasFresh: boolean; count: number; lastScraped?: Date }> {
        const client = await pool.connect();

        try {
            const query = `
                SELECT COUNT(*) as count, MAX(scraped_at) as last_scraped
                FROM products 
                WHERE category = $1 
                AND scraped_at > NOW() - INTERVAL '${maxAgeHours} hours';
            `;

            const result = await client.query(query, [category]);
            const count = parseInt(result.rows[0].count);
            const lastScraped = result.rows[0].last_scraped;

            return {
                hasFresh: count > 0,
                count,
                lastScraped: lastScraped ? new Date(lastScraped) : undefined
            };

        } catch (error) {
            console.error('❌ Error checking fresh data:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Create scraping session
    async createScrapingSession(source: string, category: string): Promise<string> {
        const client = await pool.connect();
        const sessionId = uuidv4();

        try {
            const query = `
                INSERT INTO scraping_sessions (session_id, source, category, started_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                RETURNING session_id;
            `;

            await client.query(query, [sessionId, source, category]);
            return sessionId;

        } catch (error) {
            console.error('❌ Error creating scraping session:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Update scraping session
    async updateScrapingSession(sessionId: string, success: boolean, productsFound: number, errorMessage?: string): Promise<void> {
        const client = await pool.connect();

        try {
            const query = `
                UPDATE scraping_sessions 
                SET success = $1, products_found = $2, error_message = $3, completed_at = CURRENT_TIMESTAMP
                WHERE session_id = $4;
            `;

            await client.query(query, [success, productsFound, errorMessage, sessionId]);

        } catch (error) {
            console.error('❌ Error updating scraping session:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Get database statistics
    async getStats(): Promise<{ totalProducts: number; categoryCounts: any[]; recentSessions: ScrapingSession[] }> {
        const client = await pool.connect();

        try {
            // Get total products
            const totalResult = await client.query('SELECT COUNT(*) as total FROM products');
            const totalProducts = parseInt(totalResult.rows[0].total);

            // Get category counts
            const categoryResult = await client.query(`
                SELECT category, COUNT(*) as count, MAX(scraped_at) as last_scraped
                FROM products 
                GROUP BY category 
                ORDER BY count DESC;
            `);

            // Get recent sessions
            const sessionResult = await client.query(`
                SELECT * FROM scraping_sessions 
                ORDER BY started_at DESC 
                LIMIT 10;
            `);

            return {
                totalProducts,
                categoryCounts: categoryResult.rows,
                recentSessions: sessionResult.rows
            };

        } catch (error) {
            console.error('❌ Error fetching database stats:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Clean old data
    async cleanOldData(daysOld: number = 7): Promise<number> {
        const client = await pool.connect();

        try {
            const query = `
                DELETE FROM products 
                WHERE scraped_at < NOW() - INTERVAL '${daysOld} days';
            `;

            const result = await client.query(query);
            const deletedCount = result.rowCount || 0;

            console.log(`🧹 Cleaned ${deletedCount} old products from database`);
            return deletedCount;

        } catch (error) {
            console.error('❌ Error cleaning old data:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

export const dbService = new DatabaseService(); 