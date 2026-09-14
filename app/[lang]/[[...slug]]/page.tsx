import {notFound} from 'next/navigation';
import {env} from '@/lib/runtime-env';
import {Layout,Home} from '@/components/site';
import {ContentPageView} from '@/components/content-pages';
import {loadPages,loadDraft} from '@/lib/server-content';
import {adminUser} from '@/lib/admin';
import {metadata,schemas,escapeJson} from '@/lib/seo';
import {languages,type Lang} from '@/lib/i18n';
type Props={params:Promise<{lang:string;slug?:string[]}>;searchParams:Promise<Record<string,string|undefined>>};
export async function generateMetadata({params,searchParams}:Props){const p=await params;const all=await loadPages();const page=all.find(x=>x.path==='/'+p.lang+(p.slug?.length?'/'+p.slug.join('/'):''));if(!page)return{title:'404 — MAB Teknoloji',robots:{index:false,follow:false}};const meta=metadata(page,all);const q=await searchParams;if(q.kategori||q.year)meta.robots={index:false,follow:true};if(q.preview)meta.robots={index:false,follow:false};return meta}
export default async function Page({params,searchParams}:Props){const [p,query,all]=await Promise.all([params,searchParams,loadPages()]);if(!languages.includes(p.lang as Lang))notFound();const lang=p.lang as Lang;let page=all.find(x=>x.path==='/'+lang+(p.slug?.length?'/'+p.slug.join('/'):''));if(!page)notFound();if(query.preview==='1'){if(!await adminUser())notFound();page=await loadDraft(lang+':'+page.id)||page;}const enabled=!!(env.DB&&env.BUCKET&&env.FORM_SECRET);return <Layout lang={lang} id={page.id}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:escapeJson(schemas(page,all))}}/>{page.id==='home'?<Home lang={lang} page={page} all={all}/>:<ContentPageView page={page} all={all} query={query} formsEnabled={enabled}/>}</Layout>}
