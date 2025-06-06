import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest, User, RateLimitOptions } from '../types';

// Authentication middleware
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization;

    if (!token) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authorization header is required',
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Check Bearer token format
    if (!token.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Token must be in Bearer format',
            timestamp: new Date().toISOString()
        });
        return;
    }

    const actualToken = token.slice(7);

    // Simple token validation (replace with proper JWT validation in production)
    if (actualToken === 'valid-token' || actualToken === 'demo-token') {
        const user: User = {
            id: 1,
            name: 'Demo User',
            email: 'demo@example.com',
            username: 'demo-user',
            role: 'user',
            authenticated: true
        };
        req.user = user;
        next();
    } else {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid or expired token',
            timestamp: new Date().toISOString()
        });
    }
};

// Admin authentication middleware
export const authenticateAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    authenticate(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required',
                timestamp: new Date().toISOString()
            });
        }
    });
};

// Rate limiting middleware (basic implementation)
const requestCounts = new Map<string, number[]>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const clientId = req.ip || req.connection?.remoteAddress || 'unknown';
        const now = Date.now();

        if (!requestCounts.has(clientId)) {
            requestCounts.set(clientId, []);
        }

        const requests = requestCounts.get(clientId)!;

        // Remove old requests outside the time window
        const validRequests = requests.filter(time => now - time < windowMs);

        if (validRequests.length >= maxRequests) {
            res.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000} seconds`,
                retryAfter: Math.ceil(windowMs / 1000),
                timestamp: new Date().toISOString()
            });
            return;
        }

        validRequests.push(now);
        requestCounts.set(clientId, validRequests);

        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': (maxRequests - validRequests.length).toString(),
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });

        next();
    };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
    });

    next();
}; 