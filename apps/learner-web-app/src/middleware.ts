import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/login-simple",
  "/registration",
  "/password-forget",
  "/reset-Password",
  "/logout",
  "/",
  "/home",
  "/faqs",
  "/explore",
  "/unauthorized",
  // POS routes (public)
  "/pos",
  "/pos/about-us",
  "/pos/content",
  "/pos/search",
  "/pos/life",
  "/pos/work",
  "/pos/school",
  "/pos/program",
  "/pos/player",
  // Thematic routes (public)
  "/themantic",
  "/themantic/search",
  "/themantic/player",
  "/themantic/content-details",
  "/themantic/HomeCards",
  "/themantic/themanticCard",
];

// Check if route is public
const isPublicRoute = (pathname: string): boolean => {
  // Check exact matches
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  
  // Check if pathname starts with any public route
  return publicRoutes.some((route) => pathname.startsWith(route));
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Proxy sunbird-plugins to Player MFE
  if (pathname.startsWith("/sunbird-plugins")) {
    url.hostname = "localhost";
    url.port = "4108";
    return NextResponse.rewrite(url);
  }

  // Proxy sbplayer routes to Player MFE
  if (pathname.startsWith("/sbplayer")) {
    url.hostname = "localhost";
    url.port = "4108";
    return NextResponse.rewrite(url);
  }

  // Proxy forget-password routes
  if (pathname.startsWith("/forget-password")) {
    url.hostname = "localhost";
    url.port = "4109";
    return NextResponse.rewrite(url);
  }

  // Check authentication for protected routes
  // Note: Since localStorage is not available in middleware, we check cookies
  // The client-side AuthGuard will provide additional protection
  if (!isPublicRoute(pathname)) {
    const token = request.cookies.get("token")?.value;
    
    // If no token in cookies, redirect to login
    // Client-side AuthGuard will handle localStorage-based checks
    if (!token) {
      // Allow the request to proceed - client-side AuthGuard will handle the redirect
      // This prevents server-side redirects that might interfere with client-side routing
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
