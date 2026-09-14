export const dynamic='force-dynamic';
import {loadPages} from '@/lib/server-content';
import {ORIGIN,type ContentPage} from '@/lib/content';
import {isIndexable,pageImage} from '@/lib/seo';
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export async function GET(){
 const all=await loadPages();
 const published=[...new Map(all.filter(isIndexable).map(p=>[p.path,p])).values()];
 const groups=new Map<string,ContentPage[]>();
 for(const p of published)groups.set(p.id,[...(groups.get(p.id)||[]),p]);
 const entries=published.map(p=>{
  const versions=groups.get(p.id)!;
  const defaultPage=versions.find(x=>x.lang==='tr')||versions[0];
  const date=/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(p.modified)&&Number.isFinite(Date.parse(p.modified))?`    <lastmod>${esc(p.modified)}</lastmod>\n`:'';
  const alternates=[...versions.map(x=>`    <xhtml:link rel="alternate" hreflang="${x.lang}" href="${esc(ORIGIN+x.path)}"/>`),`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(ORIGIN+defaultPage.path)}"/>`].join('\n');
  const picture=p.images.length||p.id==='home'?`\n    <image:image><image:loc>${esc(ORIGIN+pageImage(p).src)}</image:loc></image:image>`:'';
  return `  <url>\n    <loc>${esc(ORIGIN+p.path)}</loc>\n${date}${alternates}${picture}\n  </url>`;
 });
 const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join('\n')}\n</urlset>\n`;
 return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
}
