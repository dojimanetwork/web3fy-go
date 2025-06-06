import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ValidationResult, AsyncRequestHandler } from '../types';

// Generate a random ID
export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Format response with consistent structure
export const formatResponse = <T>(
    success: boolean,
    data: T | null,
    message: string | null = null,
    error: string | null = null
): ApiResponse<T> => {
    return {
        success,
        timestamp: new Date().toISOString(),
        message,
        data,
        error
    };
};

// Success response helper
export const successResponse = <T>(
    data: T,
    message: string = 'Operation successful'
): ApiResponse<T> => {
    return formatResponse(true, data, message, null);
};

// Error response helper
export const errorResponse = (
    error: string,
    message: string = 'Operation failed'
): ApiResponse<null> => {
    return formatResponse(false, null, message, error);
};

// Async error wrapper
export const asyncHandler = (fn: AsyncRequestHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Validate required fields
export const validateRequiredFields = (
    obj: Record<string, any>,
    requiredFields: string[]
): ValidationResult => {
    const missing = requiredFields.filter(field => !obj[field]);
    return {
        isValid: missing.length === 0,
        missingFields: missing
    };
};

// Web3 address validation (basic)
export const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Convert Wei to Ether (mock function for web3 projects)
export const weiToEther = (wei: string | number): number => {
    return parseFloat(wei.toString()) / Math.pow(10, 18);
};

// Convert Ether to Wei (mock function for web3 projects)
export const etherToWei = (ether: string | number): number => {
    return Math.floor(parseFloat(ether.toString()) * Math.pow(10, 18));
};

// Delay function for testing/mocking
export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Sanitize input string
export const sanitizeString = (str: any): string => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
};

// Format date to readable string
export const formatDate = (date: Date | string | number = new Date()): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    }).format(new Date(date));
}; 