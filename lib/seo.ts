import type {Metadata} from 'next';
import {ORIGIN,media,contact,type ContentPage} from './content';
import {languages,copy} from './i18n';

export const isIndexable=(page:ContentPage)=>page.status==='published'&&page.id!=='sitemap'&&(page.kind!=='article'||page.reviewed===true);
export const pageImage=(page:ContentPage)=>media[page.id==='home'?'piping-enhanced':page.images[0]?.key]||media['1-44-kspMeuvS'];
const locales={tr:'tr_TR',en:'en_US',ar:'ar_AR',ru:'ru_RU'};
export function metadata(page:ContentPage,all:ContentPage[]):Metadata{
 const pic=pageImage(page),alternatives=all.filter(x=>x.id===page.id);
 const defaultPage=alternatives.find(x=>x.lang==='tr')||page;
 return {
  title:page.seoTitle,description:page.description,
  alternates:{canonical:page.path,languages:Object.fromEntries([...alternatives.map(x=>[x.lang,ORIGIN+x.path]),['x-default',ORIGIN+defaultPage.path]])},
  robots:{index:isIndexable(page),follow:true},
  openGraph:{title:page.seoTitle,description:page.description,url:ORIGIN+page.path,siteName:'MAB Teknoloji',
   ...(page.kind==='article'?{type:'article' as const,modifiedTime:page.modified}:{type:'website' as const}),
   locale:locales[page.lang],alternateLocale:languages.filter(l=>l!==page.lang).map(l=>locales[l]),
   images:[{url:ORIGIN+pic.src,width:pic.width,height:pic.height,alt:page.title}]},
  twitter:{card:'summary_large_image',title:page.seoTitle,description:page.description,images:[ORIGIN+pic.src]}
 };
}
export function schemas(page:ContentPage,all:ContentPage[]){
 const org={'@type':'Organization','@id':ORIGIN+'/#organization',name:'MAB Teknoloji',url:ORIGIN,logo:{'@type':'ImageObject',url:ORIGIN+'/media/brand/mark.webp',width:160,height:160},foundingDate:'2023-04',founder:{'@type':'Person',name:'Mehmet Adil Baran'},telephone:contact.phone,email:contact.email};
 const graph:unknown[]=[];
 if(page.id==='home')graph.push(org,{'@type':'WebSite','@id':ORIGIN+'/#website',url:ORIGIN,name:'MAB Teknoloji',inLanguage:languages,publisher:{'@id':ORIGIN+'/#organization'}});
 else {
  const trail=[{name:copy[page.lang].home,item:ORIGIN+'/'+page.lang}];
  const blog=all.find(p=>p.id==='blog'&&p.lang===page.lang);
  if(page.kind==='article'&&blog)trail.push({name:blog.title,item:ORIGIN+blog.path});
  trail.push({name:page.title,item:ORIGIN+page.path});
  graph.push({'@type':'BreadcrumbList',itemListElement:trail.map((p,i)=>({'@type':'ListItem',position:i+1,...p}))});
 }
 if(page.kind==='service'||page.kind==='solution')graph.push({'@type':'Service',name:page.title,description:page.description,url:ORIGIN+page.path,provider:org});
 if(page.kind==='article'&&isIndexable(page)){
  const pic=pageImage(page);
  graph.push({'@type':'BlogPosting','@id':ORIGIN+page.path+'#article',headline:page.title,description:page.description,inLanguage:page.lang,dateModified:page.modified,mainEntityOfPage:{'@type':'WebPage','@id':ORIGIN+page.path},image:{'@type':'ImageObject',url:ORIGIN+pic.src,width:pic.width,height:pic.height},author:org,publisher:org});
 }
 return {'@context':'https://schema.org','@graph':graph};
}
export const escapeJson=(data:unknown)=>JSON.stringify(data).replace(/</g,'\\u003c');
