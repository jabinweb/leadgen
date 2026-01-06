import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';
import { logError } from './lib/logger';

/**
 * Proxy runs on every request
 * - Handles rate limiting for API routes
 * - Can add authentication checks, logging, etc.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Skip rate limiting for auth endpoints to prevent lockouts
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // Different limits for different endpoints
    let rateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per window
    };

    // Stricter limits for email sending endpoints
    if (pathname.includes('/email/send') || pathname.includes('/campaigns')) {
      rateLimitConfig = {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 50, // 50 emails per hour
      };
    }

    // Stricter limits for scraping endpoints
    if (pathname.includes('/scraping')) {
      rateLimitConfig = {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20, // 20 scraping requests per hour
      };
    }

    // Very strict limits for payment endpoints
    if (pathname.includes('/payment') || pathname.includes('/subscription')) {
      rateLimitConfig = {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10, // 10 payment requests per hour
      };
    }

    try {
      await rateLimit(request, rateLimitConfig);
    } catch (error) {
      // Rate limit exceeded - rateLimit function already returned 429 response
      // This catch block is for unexpected errors in the rate limiting logic
      logError(error, { context: 'Rate limiting error' });
    }
  }

  return NextResponse.next();
}

/**
 * Configure which paths the proxy should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html).*)',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
