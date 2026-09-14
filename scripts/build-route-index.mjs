import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('content/source.json','utf8'));
const blog=JSON.parse(fs.readFileSync('content/blog.json','utf8'));
const routes=[...source,...blog].map(({id,lang,path,title})=>({id,lang,path,title}));
for(const lang of ['tr','en','ar','ru'])for(const id of ['solutions','blog','sitemap','privacy','kvkk','cookies'])routes.push({id,lang,path:`/${lang}/${lang==='tr'?({solutions:'ozel-cozumler',sitemap:'site-haritasi',privacy:'gizlilik',cookies:'cerez-politikasi'})[id]||id:id}`,title:id});
fs.writeFileSync('content/routes.json',JSON.stringify(routes));
console.log(`Generated ${routes.length} immutable route identities.`);
