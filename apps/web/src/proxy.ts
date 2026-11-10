import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_DEMO_USER, DEMO_COOKIE } from '@/lib/api';

/**
 * Makes sure a demo persona exists before the first server render, so pages
 * never have to guess who is looking at them.
 */
export function proxy(request: NextRequest): NextResponse {
  if (request.cookies.get(DEMO_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(DEMO_COOKIE, DEFAULT_DEMO_USER, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|maplibre-gl-worker.mjs).*)'],
};
