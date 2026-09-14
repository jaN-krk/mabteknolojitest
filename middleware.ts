import { NextRequest, NextResponse } from 'next/server';
export function middleware(request: NextRequest) {
 const path=request.nextUrl.pathname;
 if(path==='/') return NextResponse.redirect(new URL('/tr',request.url),301);
 if(path.length>1 && path.endsWith('/'))return NextResponse.redirect(new URL(path.slice(0,-1)+request.nextUrl.search,request.url),301);
 const headers=new Headers(request.headers);
 const lang=path.split('/')[1];headers.set('x-site-lang',['tr','en','ar','ru'].includes(lang)?lang:'tr');
 const response=NextResponse.next({request:{headers}});
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 response.headers.set('X-Frame-Options','SAMEORIGIN');
 if(path.startsWith('/admin')||path.startsWith('/api/'))response.headers.set('Cache-Control','no-store');
 return response;
}
export const config={matcher:['/((?!_next|media|favicon.svg).*)']};
