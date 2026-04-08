import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Only protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('sb-access-token')
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // Redirect logged users from login
  if (pathname === '/login') {
    const authCookie = request.cookies.get('sb-access-token')
    if (authCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}