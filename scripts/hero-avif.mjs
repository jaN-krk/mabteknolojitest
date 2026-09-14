import sharp from 'sharp';import fs from 'node:fs';
for(const width of [480,768,960,1448])await sharp('source-archive/generated-v2/piping-enhanced.png').resize(width).avif({quality:48,effort:6}).toFile(`public/media/enhanced/piping-enhanced-${width}.avif`);
const file='content/media.json',m=JSON.parse(fs.readFileSync(file,'utf8'));const item=m['piping-enhanced'];item.src=item.src.replace('.webp','.avif');item.srcSet=item.srcSet.replaceAll('.webp','.avif');fs.writeFileSync(file,JSON.stringify(m,null,2));
