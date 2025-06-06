import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HealthCheckResponse } from './types';
import { testConnection, initializeDatabase, closeDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import apiRoutes from './routes/api';

// Use routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req: Request, res: Response): void => {
    res.json({
        message: 'Welcome to Web3FyGo!',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            api: '/api',
            products: '/api/products?trending=amazon'
        }
    });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
    const healthCheck: HealthCheckResponse = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(healthCheck);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req: Request, res: Response): void => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Initialize database and start server
const startServer = async (): Promise<void> => {
    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        const dbConnected = await testConnection();

        if (dbConnected) {
            // Initialize database tables
            console.log('🏗️ Initializing database tables...');
            await initializeDatabase();
        } else {
            console.warn('⚠️ Database connection failed - running without database caching');
        }

        // Start the server
        app.listen(PORT, (): void => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Visit: http://localhost:${PORT}`);
            console.log(`📊 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
            if (dbConnected) {
                console.log(`🔧 pgAdmin: http://localhost:8080 (admin@web3fygo.com / admin123)`);
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
    console.log('\n🛑 Graceful shutdown initiated...');
    try {
        await closeDatabase();
        console.log('✅ Database connections closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}

export default app; 