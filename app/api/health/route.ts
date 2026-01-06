import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint for monitoring and uptime checks
 * GET /api/health
 */
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      sentry: 'configured',
    }
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = 'unhealthy';
    
    return NextResponse.json(checks, { status: 503 });
  }

  // Check Sentry configuration
  if (!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    checks.checks.sentry = 'not_configured';
  }

  return NextResponse.json(checks, { status: 200 });
}
