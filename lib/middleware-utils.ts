import { NextRequest, NextResponse } from 'next/server';
import { ApiException } from './api-error-handler';
import { logError } from './logger';

/**
 * Wrap API route handler with error handling
 * Automatically catches and formats errors
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Handle ApiException (our custom errors)
      if (error instanceof ApiException) {
        return NextResponse.json(
          {
            error: error.message,
            statusCode: error.statusCode,
            code: error.code,
            ...(error.details && { details: error.details }),
          },
          { status: error.statusCode }
        );
      }

      // Handle unexpected errors
      logError(error, { 
        context: 'Unhandled API error',
        path: request.nextUrl.pathname,
        method: request.method,
      });

      // Don't expose internal errors in production
      const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error ? error.message : 'Unknown error';

      return NextResponse.json(
        {
          error: message,
          statusCode: 500,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  ...middlewares: Array<(request: NextRequest, context?: any) => Promise<any>>
) {
  return async (request: NextRequest, context?: any) => {
    let result: any;
    
    for (const middleware of middlewares) {
      result = await middleware(request, context);
      
      // If middleware returns a NextResponse, short-circuit
      if (result instanceof NextResponse) {
        return result;
      }
    }
    
    return result;
  };
}
