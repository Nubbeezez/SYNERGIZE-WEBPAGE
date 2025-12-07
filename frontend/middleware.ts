import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
  '/admin',
  '/profile',
  '/shop/purchase',
]

// Routes that require admin role (checked client-side for full validation,
// but we can do a basic check here using the session cookie presence)
const adminRoutes = [
  '/admin',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Check for session cookie (Laravel Sanctum uses this cookie name)
    const sessionCookie = request.cookies.get('synergize_session') ||
                          request.cookies.get('laravel_session') ||
                          request.cookies.get('XSRF-TOKEN')

    // If no session cookie, redirect to home with login prompt
    if (!sessionCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('login', 'required')
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled by backend)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
