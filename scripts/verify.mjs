import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const BASE=process.env.TEST_BASE||'http://localhost:5173';
fs.mkdirSync('reports/screenshots',{recursive:true});
const source=JSON.parse(fs.readFileSync('content/source.json','utf8'));
const articles=JSON.parse(fs.readFileSync('content/blog.json','utf8'));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const report={base:BASE,date:new Date().toISOString(),responsive:[],axe:[],interaction:[],pageErrors:errors};
const route=(lang,id)=>source.find(p=>p.lang===lang&&p.id===id).path;
async function go(path){await page.goto(BASE+path,{waitUntil:'networkidle'});await page.locator('main h1').waitFor();}
for(const width of [360,390,768,1440,1920]){
 await page.setViewportSize({width,height:960});
 for(const [lang,id] of [['tr','home'],['tr','piping'],['tr','stainless'],['tr','quote'],['ar','home'],['ar','melting']]){
  await go(route(lang,id));
  await page.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(im=>im.loading='eager'));await page.waitForFunction(()=>[...document.images].every(im=>im.complete));
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,lang:document.documentElement.lang,dir:document.documentElement.dir,brokenImages:[...document.images].filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.src)}));
  report.responsive.push({width,lang,id,...dimensions,pass:dimensions.scroll<=width&&dimensions.lang===lang&&dimensions.dir===(lang==='ar'?'rtl':'ltr')&&dimensions.brokenImages.length===0});
  if((id==='home'&&['360','1440','1920'].includes(String(width)))||(width===390&&id==='melting'))await page.screenshot({path:`reports/screenshots/${lang}-${id}-${width}.png`,fullPage:true});
 }
}
await page.setViewportSize({width:1440,height:1000});
for(const lang of ['tr','en','ar','ru']){
 for(const id of ['home','quote','piping','stainless']){
  await go(route(lang,id));const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.axe.push({lang,id,violations:results.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
 }
 await go(route(lang,'stainless'));const imageButtons=page.locator('.gallery-item');await imageButtons.first().click();await page.getByRole('dialog').waitFor();const before=await page.locator('.gallery-controls span').textContent();await page.locator('.gallery-controls button').last().click();const after=await page.locator('.gallery-controls span').textContent();await page.keyboard.press('Escape');report.interaction.push({lang,test:'gallery next and escape',pass:before!==after&&await page.getByRole('dialog').count()===0});
 await page.locator('.language-trigger').click();for(const target of ['tr','en','ar','ru']){const actual=await page.locator(`.language-options a[lang="${target}"]`).getAttribute('href');report.interaction.push({lang,test:'same project language '+target,pass:actual===route(target,'stainless')})}
 await go(route(lang,'projects'));await page.locator('.filter-buttons button').filter({hasText:'2024'}).click();report.interaction.push({lang,test:'year filter',pass:await page.locator('.project-card').count()===1});
 await go(route(lang,'quote')+'?service=piping');report.interaction.push({lang,test:'prefilled service',pass:await page.locator('select[name=service]').inputValue()==='piping'});
 await go(route(lang,'melting'));await page.locator('input[name=material]').fill('Test material');await page.locator('input[name=capacity]').fill('Test volume');await page.locator('#needs button[type=submit]').click();await page.waitForURL('**/*needs=*');report.interaction.push({lang,test:'cabin requirements to quote',pass:(await page.locator('select[name=service]').inputValue())==='melting'&&(await page.locator('.request-summary').innerText()).includes('Test material')});
 await page.setViewportSize({width:390,height:900});await go(route(lang,'home'));await page.locator('.mobile-menu-trigger').click();report.interaction.push({lang,test:'mobile menu',pass:await page.locator('.mobile-nav a').count()===9});await page.keyboard.press('Escape');await page.setViewportSize({width:1440,height:1000});
}
await go(articles[0].path);report.interaction.push({test:'approved article indexable and contents',pass:!(await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex')&&await page.locator('.toc a').count()===4});
const notfound=await page.goto(BASE+'/ar/missing-page');report.interaction.push({test:'localized real 404',pass:notfound.status()===404&&await page.locator('html').getAttribute('dir')==='rtl'});
const unauthorized=await context.request.get(BASE+'/api/admin');report.interaction.push({test:'admin unauthenticated denied',pass:unauthorized.status()===403});
await browser.close();fs.writeFileSync('reports/browser-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify({responsive:report.responsive.length,responsiveFailures:report.responsive.filter(x=>!x.pass),axeViolations:report.axe.filter(x=>x.violations.length),interactions:report.interaction.length,interactionFailures:report.interaction.filter(x=>!x.pass),pageErrors:errors},null,2));
