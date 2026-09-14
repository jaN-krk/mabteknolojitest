import json,re,hashlib,requests,html
from pathlib import Path
from urllib.parse import urljoin,urlparse
from bs4 import BeautifulSoup
from PIL import Image,ImageOps,ImageEnhance,ImageFilter

ROOT=Path('source-archive'); DATA=Path('content'); DATA.mkdir(exist_ok=True)
PUBLIC=Path('public/media'); PUBLIC.mkdir(parents=True,exist_ok=True)
pages=json.loads((ROOT/'pages.json').read_text(encoding='utf8'))
assets=json.loads((ROOT/'assets.json').read_text(encoding='utf8'))
assetmap={a['url']:a for a in assets}
for p in pages:
    soup=BeautifulSoup((ROOT/p['archive']).read_text(encoding='utf8'),'html.parser')
    extra=[]
    for source in soup.select('source[srcset]'):
        extra += [x.strip().split(' ')[0] for x in source['srcset'].split(',')]
    extra += re.findall(r"openGalleryLightbox\('([^']+)'",str(soup))
    for src in extra:
        url=urljoin(p['url'],src)
        if url in assetmap:continue
        a={'url':url,'pages':[p['url']],'alt':'','discovery':'picture source / gallery original'}
        try:
            r=requests.get(url,timeout=25);a['status']=r.status_code
            if r.ok:
                name=hashlib.sha256(url.encode()).hexdigest()[:12]+Path(urlparse(url).path).suffix
                (ROOT/'originals'/name).write_bytes(r.content);a['original']='originals/'+name;a['bytes']=len(r.content)
        except requests.RequestException:a['status']=0
        assetmap[url]=a

groups={}
for a in assetmap.values():
    if a.get('status')!=200 or not a.get('original'):continue
    try:
        im=Image.open(ROOT/a['original']); stem=Path(urlparse(a['url']).path).stem
        if stem not in groups or im.width*im.height>groups[stem][0]:groups[stem]=(im.width*im.height,a)
    except Exception:pass
media={}
for stem,(_,a) in groups.items():
    im=ImageOps.exif_transpose(Image.open(ROOT/a['original'])).convert('RGB')
    # Conservative non-generative treatment: intact geometry, mild contrast and sharpening.
    im=ImageEnhance.Contrast(im).enhance(1.025)
    im=im.filter(ImageFilter.UnsharpMask(radius=1,percent=65,threshold=3))
    sizes=sorted(set([min(im.width,x) for x in [480,960,1600]]))
    for w in sizes:
        small=im.resize((w,round(im.height*w/im.width)),Image.Resampling.LANCZOS)
        small.save(PUBLIC/f'{stem}-{w}.webp','WEBP',quality=85,method=6)
    media[stem]={'src':f'/media/{stem}-{sizes[-1]}.webp','srcSet':', '.join(f'/media/{stem}-{w}.webp {w}w' for w in sizes),'width':im.width,'height':im.height,'original':a['original'],'source':a['url']}
    for b in assetmap.values():
        if Path(urlparse(b['url']).path).stem==stem:b['local']=media[stem]['src']
(ROOT/'assets.json').write_text(json.dumps(list(assetmap.values()),ensure_ascii=False,indent=2),encoding='utf8')
(DATA/'media.json').write_text(json.dumps(media,ensure_ascii=False,indent=2),encoding='utf8')

def txt(e):return html.unescape(html.unescape(e.get_text(' ',strip=True))) if e else ''
def blocks(e):
    if not e:return []
    for br in e.select('br'):br.replace_with('\n')
    result=[]
    for ch in e.children:
        if not getattr(ch,'name',None):
            if str(ch).strip():result.append({'type':'p','text':html.unescape(str(ch).strip())})
            continue
        if ch.name in ['h2','h3','p','li']:result.append({'type':ch.name,'text':txt(ch)})
        elif ch.name in ['ul','ol']:result.append({'type':'list','items':[txt(x) for x in ch.select('li')]})
        else:result+=blocks(ch)
    return result
mainpages=[p for p in pages if p['status']==200 and '?' not in p['url'] and urlparse(p['url']).path.strip('/') and p.get('lang') in ['tr','en','ar','ru']]
detailIds={}
for lang in ['tr','en','ar','ru']:
    s=[p for p in mainpages if p['lang']==lang and re.search('/(hizmetler|services)/',p['url'])]
    for idx,p in enumerate(s):detailIds[p['url']]='piping' if idx==0 else 'thermal'
    s=[p for p in mainpages if p['lang']==lang and re.search('/(projeler|projects)/',p['url'])]
    for idx,p in enumerate(s):detailIds[p['url']]=['stainless','coil','steel'][idx]
content=[]
for p in mainpages:
    lang=p['lang'];path=urlparse(p['url']).path;parts=path.strip('/').split('/');s=BeautifulSoup(p['mainHtml'],'html.parser')
    if len(parts)==1:id='home';kind='home'
    elif p['url'] in detailIds:
        id=detailIds[p['url']];kind='service' if id in ['piping','thermal'] else 'project'
    elif len(parts)==3:id='melting';kind='solution'
    else:
        id={'hakkimizda':'about','hizmetler':'services','projeler':'projects','iletisim':'contact','teklif-al':'quote','kesif-talep-et':'survey','request-quote':'quote','request-site-survey':'survey'}.get(parts[1],parts[1]);kind=id
    title=txt(s.select_one('h1'));desc=txt(s.select_one('.site-page-header__lead, .site-hero__lead'))
    b=[]
    if kind=='about':b=blocks(s.select_one('.site-about-main .site-prose'))
    elif kind=='service':b=blocks(s.select_one('.site-detail-main .site-prose'))
    elif kind=='solution':b=blocks(s.select_one('.site-detail-main .site-prose'))
    elif kind=='project':
        for section in s.select('.site-project-narrative__block'):
            b.extend([{'type':'h2','text':txt(section.select_one('h2'))},{'type':'p','text':txt(section.select_one('.site-project-narrative__body'))}])
    elif kind in ['quote','survey','contact']:
        for el in s.select('.site-form-sidebar, .site-request-sidebar, .site-contact-info-section'):
            b+=blocks(el)
    images=[]
    selector='.site-project-featured-image img, .site-gallery-item img' if kind=='project' else 'img'
    for im in s.select(selector):
        stem=Path(urlparse(im.get('src','')).path).stem
        if stem in media and not any(x['key']==stem for x in images):
            images.append({'key':stem,'alt':im.get('alt',''),'caption':txt(im.find_parent('figure').select_one('figcaption')) if im.find_parent('figure') else ''})
    options=[{'title':txt(x.select_one('h3')),'description':txt(x.select_one('p')),'items':[txt(i) for i in x.select('li')]} for x in s.select('.site-option-card')]
    values=[{'title':txt(x.select_one('h3')),'description':txt(x.select_one('p'))} for x in s.select('.site-value-card')]
    meta=[{'key':txt(x.select_one('[class$="__meta-key"], [class$="__key"]')),'value':txt(x.select_one('[class$="__meta-val"], [class$="__val"]'))} for x in s.select('.site-detail-sidebar__meta-list li, .site-about-sidebar__list li')]
    forms=[]
    for f in s.select('form'):
        forms.append({'fields':[{'name':x.get('name'),'type':x.get('type',x.name),'label':txt(s.find('label',attrs={'for':x.get('id')})),'options':[txt(o) for o in x.select('option')]} for x in f.select('input:not([type=hidden]),select,textarea')]})
    content.append({'id':id,'kind':kind,'lang':lang,'path':path,'source':p['url'],'title':title,'description':desc,'blocks':b,'images':images,'tables':p['tables'],'options':options,'values':values,'meta':meta,'forms':forms,'seoTitle':html.unescape(p['title']),'status':'published','modified':'2026-09-13'})
(DATA/'source.json').write_text(json.dumps(content,ensure_ascii=False,indent=2),encoding='utf8')
# Original header is a text wordmark, not a raster logo.
home=next(p for p in pages if p['url'].endswith('/tr'))
s=BeautifulSoup((ROOT/home['archive']).read_text(encoding='utf8'),'html.parser')
(ROOT/'original-logo.html').write_text(str(s.select_one('.site-logo')),encoding='utf8')
(ROOT/'footer.txt').write_text(txt(s.select_one('footer')),encoding='utf8')
print(json.dumps({'contentPages':len(content),'assetUrls':len(assetmap),'uniquePhotos':len(media),'downloaded':sum(a.get('status')==200 for a in assetmap.values())}))
