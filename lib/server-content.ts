import {env} from '@/lib/runtime-env';
import {cache} from 'react';
import {pages,type ContentPage} from './content';
export const loadPages=cache(async():Promise<ContentPage[]>=>{
 if(!env.DB)return pages;
 try{const result=await env.DB.prepare('SELECT key,published FROM documents').all<{key:string;published:string|null}>();const map=new Map(result.results.map(r=>[r.key,r.published]));return pages.map(p=>{const saved=map.get(p.lang+':'+p.id);return saved?JSON.parse(saved):p})}catch(e){console.error('CMS read unavailable',e instanceof Error?e.message:'database');return pages;}
});
export async function loadDraft(key:string){if(!env.DB)return null;const row=await env.DB.prepare('SELECT draft FROM documents WHERE key=?').bind(key).first<{draft:string}>();return row?JSON.parse(row.draft) as ContentPage:null}
