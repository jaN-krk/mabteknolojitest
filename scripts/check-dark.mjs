import {chromium} from '@playwright/test';
const b=await chromium.launch(); const p=await b.newPage(); await p.addInitScript(()=>{localStorage.setItem('mab-theme-v2','dark');sessionStorage.setItem('mab-visited-v2','1')});await p.goto('http://127.0.0.1:4173/tr');await p.waitForTimeout(1000);console.log(await p.locator('.small,[data-slot=accordion-trigger]').evaluateAll(es=>es.map(e=>({html:e.outerHTML.slice(0,250),color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor,op:getComputedStyle(e).opacity}))));await b.close();

