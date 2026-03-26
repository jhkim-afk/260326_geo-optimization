// Next.js 16 Proxy — 인증 보호 라우트 설정 (middleware.ts에서 리네임)

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// 인증이 필요한 경로
const PROTECTED_PATHS = ['/dashboard', '/simulator', '/optimizer', '/keywords', '/onboarding'];
// 인증된 사용자가 접근 불가한 경로
const AUTH_PATHS = ['/login', '/register'];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
