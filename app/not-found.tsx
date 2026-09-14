import {headers} from 'next/headers';
import {Layout} from '@/components/site';
import {copy,type Lang} from '@/lib/i18n';
import {href} from '@/lib/content';
export default async function NotFound(){const h=await headers();const lang=(h.get('x-site-lang')||'tr') as Lang;const t=copy[lang];return <Layout lang={lang} id="home" cta={false}><div className="container not-found"><strong>404</strong><h1>{t.notFound}</h1><p>{t.notFoundLead}</p><a className="button yellow" href={href('home',lang)}>{t.back}</a></div></Layout>}
