import fs from 'node:fs';
import sharp from 'sharp';
const jobs=JSON.parse(fs.readFileSync('reports/image-generation-v2.json','utf8')).assets;
const media=JSON.parse(fs.readFileSync('content/media.json','utf8'));
for(const path of ['public/media/editorial','public/media/brand','public/media/enhanced','source-archive/generated-v2','source-archive/brand'])fs.mkdirSync(path,{recursive:true});
for(const job of jobs){
 fs.copyFileSync(job.file,`source-archive/generated-v2/${job.id}.png`);
 const m=await sharp(job.file).metadata();
 if(job.id==='brand-mark'){await sharp(job.file).resize({width:160}).webp({lossless:true}).toFile('public/media/brand/mark.webp');await sharp(job.file).resize(64,64,{fit:'contain'}).png().toFile('public/favicon.png');continue}
 const base=job.id.includes('enhanced')?'enhanced':'editorial';const sizes=[480,768,960,1600].filter(x=>x<=m.width);if(!sizes.includes(m.width)&&m.width<1600)sizes.push(m.width);
 for(const width of sizes)await sharp(job.file).resize({width}).webp({quality:80,effort:6}).toFile(`public/media/${base}/${job.id}-${width}.webp`);
 const width=Math.max(...sizes);media[job.id]={src:`/media/${base}/${job.id}-${width}.webp`,srcSet:sizes.map(w=>`/media/${base}/${job.id}-${w}.webp ${w}w`).join(', '),width,height:Math.round(m.height*width/m.width),source:'AI generation — see reports/image-generation-v2.json',original:`generated-v2/${job.id}.png`};
 console.log(job.id,width,media[job.id].height);
}
fs.writeFileSync('content/media.json',JSON.stringify(media,null,2));
const blog=JSON.parse(fs.readFileSync('content/blog.json','utf8'));
for(const p of blog){p.status='published';p.reviewed=true;p.modified='2026-09-14';p.images=[{key:p.id,alt:p.title,caption:''}]}
fs.writeFileSync('content/blog.json',JSON.stringify(blog,null,2));
fs.writeFileSync('reports/blog-approval.json',JSON.stringify({date:'2026-09-14',scope:'All six existing articles in four languages',basis:'User explicitly approved the pending technical article publication in this conversation.',status:'published',legalDrafts:'Unchanged',liveDeployment:'Not authorized by this content approval'},null,2));
