import json
from pathlib import Path
from PIL import Image,ImageOps,ImageEnhance,ImageFilter
p=Path('content/media.json');data=json.loads(p.read_text(encoding='utf8'))
for stem,a in data.items():
 im=ImageOps.exif_transpose(Image.open('source-archive/'+a['original'])).convert('RGB');im=ImageEnhance.Contrast(im).enhance(1.025);im=im.filter(ImageFilter.UnsharpMask(radius=1,percent=65,threshold=3))
 sizes=sorted(set(min(im.width,x) for x in [480,768,960,1600]))
 for w in sizes:
  small=im.resize((w,round(im.height*w/im.width)),Image.Resampling.LANCZOS);small.save(f'public/media/{stem}-{w}.webp','WEBP',quality=80,method=6)
 a['srcSet']=', '.join(f'/media/{stem}-{w}.webp {w}w' for w in sizes)
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
