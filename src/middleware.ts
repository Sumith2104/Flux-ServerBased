import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const userId = await getCurrentUserId();
  const { pathname } = request.nextUrl;

  const isPublicPage = ['/login', '/signup', '/'].includes(pathname);

  // If user is logged in...
  if (userId) {
    // and tries to access a public page (like login, signup, or landing)
    // redirect them to the dashboard.
    if (isPublicPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  // If user is not logged in...
  else {
    // and tries to access a protected page, redirect to login.
    if (!isPublicPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
