export interface ApiResponse {
    success: boolean;
    timestamp: string;
    message: string;
    error?: string;
    data?: any;
}

export function successResponse(message: string, data?: any): ApiResponse {
    return {
        success: true,
        timestamp: new Date().toISOString(),
        message,
        data
    };
}

export function errorResponse(error: string, message: string): ApiResponse {
    return {
        success: false,
        timestamp: new Date().toISOString(),
        error,
        message
    };
} 