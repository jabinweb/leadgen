import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only protect dashboard routes - auth check is done client-side
  // This is a lightweight middleware that doesn't include heavy dependencies
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}
