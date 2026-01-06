import * as Sentry from '@sentry/nextjs';

/**
 * Instrumentation file for Next.js
 * This runs once when the Next.js server starts
 */

export async function register() {
  // Initialize Sentry only in production to avoid dev issues
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('./sentry.edge.config');
    }
  }

  // Environment validation on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env-validation');
    const { logInfo, logError } = await import('./lib/logger');

    try {
      logInfo('Validating environment variables...', {});
      validateEnv();
      logInfo('Environment validation passed ✓', {});
    } catch (error) {
      logError(error, { context: 'Environment validation failed' });
      
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}

export const onRequestError = Sentry.captureRequestError;
