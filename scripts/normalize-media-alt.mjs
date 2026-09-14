import fs from 'node:fs';
import {copy} from '../lib/i18n.ts';
const keys=['1-44-kspMeuvS','1-38-pvQ8DSzu','1-27-ceoK89re','1-11-6FCPOeYc','1-12-LSRvMWXf','1-14-swPI4ROa','1-41-trk2Yeua','1-29-d4pyra1Y'];
const pages=JSON.parse(fs.readFileSync('content/source.json','utf8'));
for(const p of pages)for(const im of p.images)im.alt=copy[p.lang].imageAlts.split('|')[keys.indexOf(im.key)]||im.alt;
fs.writeFileSync('content/source.json',JSON.stringify(pages,null,2));
