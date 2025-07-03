import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add any paths that should be protected here
const protectedPaths = ['/dashboard', '/profile', '/settings']

// Add any paths that should redirect authenticated users (like login/signup pages)
const authPaths = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the token from the request headers or cookies
  // Note: This is a basic implementation. In production, you might want to
  // verify the token's validity by checking with your backend
  const token = request.cookies.get('access_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // Check if current path is an auth path (login/signup)
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  // If trying to access protected route without token, redirect to login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated user tries to access login/signup, redirect to home
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
