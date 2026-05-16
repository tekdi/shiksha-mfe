import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1. Skip if it's a WebSocket upgrade request (HMR)
  if (request.headers.get('upgrade') === 'websocket') {
    return NextResponse.next();
  }

  // 2. Skip internal Next.js paths and telemetry
  if (
    url.pathname.startsWith('/_next/') || 
    url.pathname.includes('/webpack-hmr') ||
    url.pathname.includes('/v1/telemetry')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any path containing webpack-hmr
     */
    '/((?!_next/static|_next/image|favicon.ico|.*webpack-hmr.*).*)',
  ],
};
