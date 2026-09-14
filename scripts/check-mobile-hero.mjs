import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const dir='reports/mobile-hero';await fs.mkdir(dir,{recursive:true});const b=await chromium.launch();const results=[];const p=await b.newPage();
for(const lang of ['tr','en','ar','ru'])for(const width of [320,360,390,430,768]){
 await p.setViewportSize({width,height:850});await p.goto('http://127.0.0.1:4173/'+lang,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!document.documentElement.dataset.intro);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 const data=await p.evaluate(()=>{const spans=[...document.querySelectorAll('.hero-title-line')];return{width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,lines:spans.map(el=>{const r=document.createRange();r.selectNodeContents(el);return{rects:r.getClientRects().length,left:r.getBoundingClientRect().left,right:r.getBoundingClientRect().right}}),labels:document.querySelectorAll('.image-credit,.enhanced-note').length}});
 results.push({lang,...data});if(data.overflow||data.labels||data.lines.length!==2||data.lines.some(l=>l.rects!==1||l.left<0||l.right>width))throw Error(JSON.stringify(results.at(-1)));
 if(lang==='tr'&&width===390)await p.screenshot({path:dir+'/hero-390.png'});
}
for(const url of ['/tr/blog','/tr/blog/endustriyel-borulama-proje-planlamasi','/tr/iletisim']){
 await p.goto('http://127.0.0.1:4173'+url);const labels=await p.locator('.image-credit,.enhanced-note,.article-cover figcaption').count();if(labels)throw Error(url+' captions remain');
}
await b.close();await fs.writeFile(dir+'/checks.json',JSON.stringify(results,null,2));console.log('20 responsive hero checks and 3 page caption checks passed.');
