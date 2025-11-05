export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth pages
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|auth).*)',
  ],
}
