import { NextRequest, NextResponse } from 'next/server';
import { logWarning } from './logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  message?: string;
}

/**
 * Rate limiting middleware for API routes
 * Usage: await rateLimit(request, { windowMs: 60000, maxRequests: 10 })
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message = 'Too many requests, please try again later.',
  } = options;

  // Get client identifier (IP address or user ID from session)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  
  const key = `ratelimit:${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();

  // Clean up old entries
  if (store[key] && store[key].resetTime < now) {
    delete store[key];
  }

  // Initialize or get current count
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  store[key].count += 1;

  // Check if limit exceeded
  if (store[key].count > maxRequests) {
    const resetIn = Math.ceil((store[key].resetTime - now) / 1000);
    
    logWarning('Rate limit exceeded', {
      ip,
      path: request.nextUrl.pathname,
      count: store[key].count,
      resetIn,
    });

    return NextResponse.json(
      {
        error: message,
        retryAfter: resetIn,
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetIn.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const remaining = maxRequests - store[key].count;
  
  return null; // Allow request to proceed
}

/**
 * Get rate limit headers for adding to responses
 */
export function getRateLimitHeaders(request: NextRequest, options: RateLimitOptions = {}): Record<string, string> {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  } = options;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const key = `ratelimit:${ip}:${request.nextUrl.pathname}`;

  const current = store[key];
  if (!current) {
    return {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': maxRequests.toString(),
    };
  }

  const remaining = Math.max(0, maxRequests - current.count);
  
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
  };
}

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean every minute
