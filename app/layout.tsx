import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {Experience} from '@/components/experience';
import type {Lang} from '@/lib/i18n';
import './fonts.css';
import './globals.css';
import './redesign.css';
import './revision-v3.css';
import './lead-flow.css';
export const metadata: Metadata = { metadataBase: new URL('https://mabteknoloji.com.tr'), icons: { icon: '/favicon.png' } };
const bootstrap=`(()=>{const r=document.documentElement;try{r.dataset.theme=localStorage.getItem('mab-theme-v3')==='dark'?'dark':'light'}catch{r.dataset.theme='light'}r.dataset.intro='show';const finish=()=>setTimeout(()=>delete r.dataset.intro,matchMedia('(prefers-reduced-motion: reduce)').matches?120:700);if(document.readyState==='complete')finish();else addEventListener('load',finish,{once:true});setTimeout(()=>delete r.dataset.intro,4500);addEventListener('pageshow',e=>{if(e.persisted){delete r.dataset.intro;delete r.dataset.navigating}})})()`;
export default async function RootLayout({ children }: { children: React.ReactNode }) {
 const h = await headers(); const lang = h.get('x-site-lang') || 'tr';
 return <html lang={lang} dir={lang==='ar'?'rtl':'ltr'} suppressHydrationWarning><head><link rel="preload" href="/fonts/manrope-5.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>{lang==='tr'&&<link rel="preload" href="/fonts/manrope-4.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>}{lang==='ru'&&<link rel="preload" href="/fonts/manrope-1.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>}<script dangerouslySetInnerHTML={{__html:bootstrap}}/></head><body><Experience lang={lang as Lang}/>{children}</body></html>;
}
