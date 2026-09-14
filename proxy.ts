import {platform} from '@/lib/runtime-env';
import {validAdminCredentials} from './lib/admin-credentials';
import { NextRequest, NextResponse } from 'next/server';
export function proxy(request: NextRequest) {
 const path=request.nextUrl.pathname;
 if(platform==='node'&&(path==='/admin'||path.startsWith('/api/admin'))){if(!validAdminCredentials(request.headers.get('authorization')))return new NextResponse('Yetkili yönetici girişi gerekli.',{status:401,headers:{'WWW-Authenticate':'Basic realm="MAB Yonetim", charset="UTF-8"','Cache-Control':'no-store','X-Robots-Tag':'noindex'}})}
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
