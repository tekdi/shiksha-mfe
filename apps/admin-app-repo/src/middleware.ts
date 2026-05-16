import { NextResponse } from 'next/server';

export function middleware(request: { nextUrl: { clone: () => any } }) {
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith('/mfe_workspace')) {
    url.hostname = 'localhost';
    url.port = '4104';
    return NextResponse.rewrite(url);
  }
  if (url.pathname.startsWith('/sbplayer')) {
    url.hostname = 'localhost';
    url.port = '4106';
    return NextResponse.rewrite(url);
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
