// Small client index: full editorial records and source archives stay on the server.
import routes from '@/content/routes.json';
import rawMedia from '@/content/media.json';
import {copy,type Lang} from './i18n';
import type {ContentPage} from './content';
export type {ContentPage};
export const getPage=(id:string,lang:Lang)=>routes.find(p=>p.id===id&&p.lang===lang)!;
export const href=(id:string,lang:Lang)=>getPage(id,lang)?.path||`/${lang}`;
export const media=rawMedia as Record<string,{src:string;srcSet:string;width:number;height:number;source:string;original:string}>;
const keys=['1-44-kspMeuvS','1-38-pvQ8DSzu','1-27-ceoK89re','1-11-6FCPOeYc','1-12-LSRvMWXf','1-14-swPI4ROa','1-41-trk2Yeua','1-29-d4pyra1Y'];
export const imageAlt=(key:string,lang:Lang)=>copy[lang].imageAlts.split('|')[keys.indexOf(key)]||copy[lang].gallery;
export const projectYear=(p:ContentPage)=>p.id==='stainless'?'2024':'2023';
export const projectCategory=(p:ContentPage)=>p.meta[0]?.value||getPage('piping',p.lang).title;
