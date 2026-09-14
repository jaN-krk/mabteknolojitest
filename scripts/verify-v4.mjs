import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const out='reports/revision-v4';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const checks=[],errors=[];
const check=(name,ok,detail)=>{checks.push({name,ok,...(detail?{detail}:{})});if(!ok)throw Error(name)};
for(const lang of ['tr','en','ar','ru'])for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/'+lang);await page.waitForFunction(()=>!document.documentElement.dataset.intro);await page.waitForTimeout(300);
 check(`${lang}-${width} heading and layout`,await page.evaluate(()=>document.querySelectorAll('h1').length===1&&document.querySelector('.hero-highlight')?.textContent.length>0&&document.documentElement.scrollWidth<=innerWidth));
 check(`${lang}-${width} no footer sitemap`,await page.locator('.footer-bottom a[href*="sitemap"],.footer-bottom a[href*="site-haritasi"]').count()===0);
 if(lang==='tr')await page.screenshot({path:`${out}/hero-${width}.png`});
 await page.evaluate(()=>scrollTo({top:850,behavior:'instant'}));await page.waitForTimeout(1000);
 check(`${lang}-${width} bottom blur`,await page.locator('.scroll-edge-blur').evaluate(el=>{const s=getComputedStyle(el);return s.opacity==='1'&&s.backdropFilter.includes('blur')&&s.pointerEvents==='none'&&s.position==='fixed'}));
 if(lang==='tr')await page.screenshot({path:`${out}/scroll-${width}.png`});
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(600);
 check(`${lang}-${width} footer visible`,await page.locator('.scroll-edge-blur').evaluate(el=>getComputedStyle(el).opacity==='0'));
 await page.locator('.theme-toggle').click();await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(400);
 check(`${lang}-${width} dark heading contrast`,await page.locator('.hero-highlight').evaluate(el=>{const s=getComputedStyle(el);return s.color==='rgb(28, 34, 32)'&&s.backgroundColor==='rgb(226, 190, 54)'}));
 if(lang==='tr')await page.screenshot({path:`${out}/hero-dark-${width}.png`});
 if(width===390){const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();check(`${lang} dark accessibility`,a.violations.length===0,a.violations)}
 await context.close();
}
await browser.close();await fs.writeFile(out+'/browser-checks.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.ok).length,errors}));
