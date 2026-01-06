import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiErrors } from './api-error-handler';

/**
 * Require authentication for API routes
 * Usage: const session = await requireAuth(request);
 */
export async function requireAuth(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    throw ApiErrors.unauthorized();
  }
  
  return session;
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest) {
  const session = await requireAuth(request);
  
  if (session.user.role !== 'ADMIN') {
    throw ApiErrors.forbidden();
  }
  
  return session;
}

/**
 * Check if user owns the resource
 */
export async function requireOwnership(
  request: NextRequest,
  resourceUserId: string
) {
  const session = await requireAuth(request);
  
  // Admins can access any resource
  if (session.user.role === 'ADMIN') {
    return session;
  }
  
  // Check if user owns the resource
  if (session.user.id !== resourceUserId) {
    throw ApiErrors.forbidden();
  }
  
  return session;
}

/**
 * Optional authentication - doesn't throw if not authenticated
 */
export async function optionalAuth(request: NextRequest) {
  const session = await auth();
  return session || null;
}
