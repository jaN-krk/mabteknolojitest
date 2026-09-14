import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch();const ctx=await browser.newContext();const p=await ctx.newPage();
p.setDefaultTimeout(15000);
const checks=[];const record=(test,pass)=>{checks.push({test,pass});console.log(pass?'PASS':'FAIL',test)};
const pages=JSON.parse(fs.readFileSync('content/source.json','utf8'));
try{
 for(const lang of ['tr','en','ar','ru']){
  const path=pages.find(x=>x.id==='quote'&&x.lang===lang).path;
  await p.goto('http://127.0.0.1:4173'+path,{waitUntil:'networkidle'});
  record(lang+' metadata is in initial document head',await p.locator('head meta[name=description]').count()===1);
  await p.locator('[name=email]').fill('bad-email');record(lang+' invalid email rejected by form',!(await p.locator('[name=email]').evaluate(e=>e.checkValidity())));
  for(const [key,value] of Object.entries({name:'Local acceptance',email:'acceptance@example.test',phone:'05550000000',message:'LOCAL TEST ONLY - configuration error verification.'}))await p.locator(`[name=${key}]`).fill(value);
  await p.locator('[name=consent]').check();await p.waitForTimeout(1300);await p.locator('button[type=submit]').click();await expect(p.locator('[role=alert]')).toBeVisible();
  record(lang+' unconfigured delivery shows error and preserves inputs',(await p.locator('[name=name]').inputValue())==='Local acceptance'&&await p.locator('.form-status.success').count()===0);
 }
 await p.goto('http://localhost:5173/signin-with-chatgpt?return_to=/admin',{waitUntil:'networkidle'});await expect(p.locator('.json-editor')).toBeVisible();
 const data=await ctx.request.get('http://localhost:5173/api/admin').then(r=>r.json());const current=data.entries.find(e=>e.key==='tr:about').draft;
 if(current.title==='LOCAL PREVIEW ACCEPTANCE')current.title=pages.find(x=>x.id==='about'&&x.lang==='tr').title;
 const send=content=>ctx.request.post('http://localhost:5173/api/admin',{headers:{Origin:'http://localhost:5173'},data:{key:'tr:about',action:'save',content}});
 try{
  const r=await send({...current,title:'LOCAL PREVIEW ACCEPTANCE'});record('Authorized preview draft saved',r.status()===200);
  await p.goto('http://localhost:5173/tr/hakkimizda?preview=1');record('Authorized draft preview renders unpublished title',(await p.locator('h1').textContent())==='LOCAL PREVIEW ACCEPTANCE');
  record('Private draft preview is noindex',(await p.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
  const anonymous=await browser.newContext();const r2=await anonymous.request.get('http://localhost:5173/tr/hakkimizda?preview=1');record('Anonymous private preview rejected',r2.status()===404);await anonymous.close();
  await p.goto('http://localhost:5173/tr/hakkimizda');record('Ordinary page keeps published title',(await p.locator('h1').textContent())!=='LOCAL PREVIEW ACCEPTANCE');
 }finally{await send(current)}
}finally{await browser.close();fs.writeFileSync('reports/acceptance-extra.json',JSON.stringify({date:new Date().toISOString(),delivery:'UNCONFIGURED - NO EMAIL SENT',checks},null,2))}
if(checks.some(x=>!x.pass))process.exitCode=1;
