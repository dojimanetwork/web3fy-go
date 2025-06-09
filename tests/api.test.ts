import request from 'supertest';
import app from '../src/index';
import * as dbService from '../src/services/database';
import * as fs from 'fs';
import * as path from 'path';

describe('API Endpoints', () => {

    describe('GET /', () => {
        it('should return welcome message', async () => {
            const res = await request(app)
                .get('/')
                .expect(200);

            expect(res.body).toHaveProperty('message', 'Welcome to Web3FyGo!');
            expect(res.body).toHaveProperty('version', '1.0.0');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('endpoints');
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app)
                .get('/health')
                .expect(200);

            expect(res.body).toHaveProperty('status', 'healthy');
            expect(res.body).toHaveProperty('uptime');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('memory');
            expect(res.body).toHaveProperty('environment');
        });
    });

    describe('API Routes', () => {

        describe('GET /api/status', () => {
            it('should return API status', async () => {
                const res = await request(app)
                    .get('/api/status')
                    .expect(200);

                expect(res.body).toHaveProperty('status', 'success');
                expect(res.body).toHaveProperty('message', 'API is operational');
                expect(res.body).toHaveProperty('version', '1.0.0');
            });
        });

        describe('GET /api/info', () => {
            it('should return API information', async () => {
                const res = await request(app)
                    .get('/api/info')
                    .expect(200);

                expect(res.body).toHaveProperty('name', 'Web3FyGo API');
                expect(res.body).toHaveProperty('version', '1.0.0');
                expect(res.body).toHaveProperty('description');
                expect(res.body).toHaveProperty('endpoints');
                expect(Array.isArray(res.body.endpoints)).toBe(true);
            });
        });

        describe('POST /api/echo', () => {
            it('should echo the request body', async () => {
                const testData = { message: 'Hello World', number: 42 };

                const res = await request(app)
                    .post('/api/echo')
                    .send(testData)
                    .expect(200);

                expect(res.body).toHaveProperty('message', 'Echo successful');
                expect(res.body).toHaveProperty('received');
                expect(res.body.received).toEqual(testData);
            });
        });

        describe('GET /api/users', () => {
            it('should return list of users', async () => {
                const res = await request(app)
                    .get('/api/users')
                    .expect(200);

                expect(res.body).toHaveProperty('users');
                expect(res.body).toHaveProperty('count');
                expect(Array.isArray(res.body.users)).toBe(true);
                expect(res.body.count).toBe(res.body.users.length);
            });
        });

        describe('POST /api/users', () => {
            it('should create a new user with valid data', async () => {
                const newUser = {
                    name: 'Test User',
                    email: 'test@example.com'
                };

                const res = await request(app)
                    .post('/api/users')
                    .send(newUser)
                    .expect(201);

                expect(res.body).toHaveProperty('message', 'User created successfully');
                expect(res.body).toHaveProperty('user');
                expect(res.body.user).toHaveProperty('name', newUser.name);
                expect(res.body.user).toHaveProperty('email', newUser.email);
                expect(res.body.user).toHaveProperty('id');
                expect(res.body.user).toHaveProperty('created');
            });

            it('should return 400 for missing name', async () => {
                const invalidUser = {
                    email: 'test@example.com'
                };

                const res = await request(app)
                    .post('/api/users')
                    .send(invalidUser)
                    .expect(400);

                expect(res.body).toHaveProperty('error', 'Bad Request');
                expect(res.body).toHaveProperty('message', 'Name and email are required');
            });

            it('should return 400 for missing email', async () => {
                const invalidUser = {
                    name: 'Test User'
                };

                const res = await request(app)
                    .post('/api/users')
                    .send(invalidUser)
                    .expect(400);

                expect(res.body).toHaveProperty('error', 'Bad Request');
                expect(res.body).toHaveProperty('message', 'Name and email are required');
            });
        });


    });

    describe('Error Handling', () => {

        describe('GET /nonexistent', () => {
            it('should return 404 for non-existent routes', async () => {
                const res = await request(app)
                    .get('/nonexistent')
                    .expect(404);

                expect(res.body).toHaveProperty('error', 'Route not found');
                expect(res.body).toHaveProperty('path', '/nonexistent');
                expect(res.body).toHaveProperty('method', 'GET');
            });
        });

        describe('POST /api/nonexistent', () => {
            it('should return 404 for non-existent API routes', async () => {
                const res = await request(app)
                    .post('/api/nonexistent')
                    .send({ data: 'test' })
                    .expect(404);

                expect(res.body).toHaveProperty('error', 'Route not found');
                expect(res.body).toHaveProperty('path', '/api/nonexistent');
                expect(res.body).toHaveProperty('method', 'POST');
            });
        });

    });

}); 