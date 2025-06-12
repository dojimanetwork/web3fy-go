import request from 'supertest';
import express from 'express';
import router from '../src/routes/api';
import { pool } from '../src/config/database';
import { MetadataService } from '../src/services/metadata';

// Create test app
const app = express();
app.use(express.json());
app.use('/api', router);

// Mock database pool
jest.mock('../src/config/database', () => ({
    pool: {
        connect: jest.fn()
    }
}));

describe('Metadata API Endpoints', () => {
    let mockClient: any;
    const metadataService = new MetadataService();

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock client
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    describe('GET /api/metadata', () => {
        const mockMetadata = [
            {
                id: 1,
                type: 'amazon',
                category: 'electronics',
                url: 'https://www.amazon.com/gp/bestsellers/electronics/',
                description: 'Amazon Electronics Best Sellers',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                type: 'amazon',
                category: 'books',
                url: 'https://www.amazon.com/gp/bestsellers/books/',
                description: 'Amazon Books Best Sellers',
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        it('should return metadata for a specific type', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: mockMetadata });

            const response = await request(app)
                .get('/api/metadata')
                .query({ type: 'amazon' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data.metadata).toHaveLength(2);
            expect(response.body.data.metadata[0]).toHaveProperty('type', 'amazon');
            expect(response.body.data.metadata[0]).toHaveProperty('category', 'electronics');
        });

        it('should return metadata for a specific type and category', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [mockMetadata[0]] });

            const response = await request(app)
                .get('/api/metadata')
                .query({ type: 'amazon', category: 'electronics' });

            expect(response.status).toBe(200);
            expect(response.body.data.metadata).toHaveLength(1);
            expect(response.body.data.metadata[0]).toHaveProperty('category', 'electronics');
        });

        it('should return 400 when type is missing', async () => {
            const response = await request(app)
                .get('/api/metadata');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Missing required parameter');
        });

        it('should handle database errors gracefully', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/api/metadata')
                .query({ type: 'amazon' });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Service unavailable');
        });
    });

    describe('POST /api/metadata', () => {
        const mockMetadata = {
            type: 'amazon',
            category: 'electronics',
            url: 'https://www.amazon.com/gp/bestsellers/electronics/',
            description: 'Amazon Electronics Best Sellers'
        };

        it('should create new metadata', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [{ ...mockMetadata, id: 1 }] });

            const response = await request(app)
                .post('/api/metadata')
                .send(mockMetadata);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data.metadata).toMatchObject(mockMetadata);
        });

        it('should update existing metadata', async () => {
            const updatedMetadata = {
                ...mockMetadata,
                description: 'Updated description'
            };
            mockClient.query.mockResolvedValueOnce({ rows: [{ ...updatedMetadata, id: 1 }] });

            const response = await request(app)
                .post('/api/metadata')
                .send(updatedMetadata);

            expect(response.status).toBe(200);
            expect(response.body.data.metadata).toMatchObject(updatedMetadata);
        });

        it('should return 400 when required fields are missing', async () => {
            const response = await request(app)
                .post('/api/metadata')
                .send({ type: 'amazon' }); // Missing category and url

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Missing required fields');
        });

        it('should handle database errors gracefully', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/api/metadata')
                .send(mockMetadata);

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Service unavailable');
        });
    });

    describe('DELETE /api/metadata', () => {
        it('should delete metadata', async () => {
            mockClient.query.mockResolvedValueOnce({ rowCount: 1 });

            const response = await request(app)
                .delete('/api/metadata')
                .query({ type: 'amazon', category: 'electronics' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.message).toContain('Successfully deleted metadata');
        });

        it('should return 400 when type or category is missing', async () => {
            const response = await request(app)
                .delete('/api/metadata')
                .query({ type: 'amazon' }); // Missing category

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Missing required parameters');
        });

        it('should handle database errors gracefully', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .delete('/api/metadata')
                .query({ type: 'amazon', category: 'electronics' });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Service unavailable');
        });
    });

    describe('GET /api/categories', () => {
        const mockMetadata = [
            {
                id: 1,
                type: 'amazon',
                category: 'electronics',
                url: 'https://www.amazon.com/gp/bestsellers/electronics/',
                description: 'Amazon Electronics Best Sellers',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                type: 'amazon',
                category: 'books',
                url: 'https://www.amazon.com/gp/bestsellers/books/',
                description: 'Amazon Books Best Sellers',
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        it('should return categories for a specific type', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: mockMetadata });

            const response = await request(app)
                .get('/api/categories')
                .query({ type: 'amazon' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data.categories).toHaveLength(2);
            expect(response.body.data.categories[0]).toHaveProperty('category', 'electronics');
            expect(response.body.data.categories[0]).toHaveProperty('url');
            expect(response.body.data.categories[0]).toHaveProperty('description');
        });

        it('should return 400 when type is missing', async () => {
            const response = await request(app)
                .get('/api/categories');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Missing required parameter');
        });

        it('should handle database errors gracefully', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/api/categories')
                .query({ type: 'amazon' });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Service unavailable');
        });
    });
}); 