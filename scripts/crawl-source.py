"""Read-only public source capture. No forms or authenticated routes are requested."""
import requests, json, re, hashlib, time
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor

BASE='https://mabteknoloji.com.tr'
OUT=Path('source-archive'); OUT.mkdir(exist_ok=True)
(OUT/'html').mkdir(exist_ok=True)
(OUT/'originals').mkdir(exist_ok=True)
session=requests.Session()
session.headers['User-Agent']='MAB-Website-Content-Migration/1.0 (read-only public pages)'
pages={}; assets={}; queue=[BASE+'/',BASE+'/robots.txt',BASE+'/sitemap.xml']
def fetch(url):
    for attempt in range(3):
        try:
            r=session.get(url, timeout=35)
            if r.status_code>=500 and attempt<2: continue
            return r
        except requests.RequestException:
            if attempt==2: return None
def save():
    (OUT/'pages.json').write_text(json.dumps(list(pages.values()),ensure_ascii=False,indent=2),encoding='utf8')
    (OUT/'assets.json').write_text(json.dumps(list(assets.values()),ensure_ascii=False,indent=2),encoding='utf8')
while queue:
    url=queue.pop(0)
    if url in pages: continue
    r=fetch(url)
    if r is None:
        pages[url]={'url':url,'status':0,'error':'Failed after 3 attempts'}; continue
    key=hashlib.sha256(url.encode()).hexdigest()[:16]
    (OUT/'html'/f'{key}.html').write_text(r.text,encoding='utf8')
    soup=BeautifulSoup(r.text,'html.parser')
    links=[{'href':urljoin(r.url,a.get('href','')),'text':a.get_text(' ',strip=True)} for a in soup.select('a[href]')]
    images=[]
    for img in soup.select('img'):
        candidates=[img.get('src'),img.get('data-src')]
        candidates += [s.strip().split(' ')[0] for s in img.get('srcset','').split(',') if s.strip()]
        for src in candidates:
            if not src or src.startswith('data:'):continue
            src=urljoin(r.url,src)
            images.append({'url':src,'alt':img.get('alt',''),'srcset':img.get('srcset','')})
            assets.setdefault(src,{'url':src,'pages':[],'alt':img.get('alt','')})['pages'].append(url)
    for src in re.findall(r'url\([\"\']?([^\)\"\']+)',r.text):
        if src.startswith('data:'):continue
        src=urljoin(r.url,src)
        if urlparse(src).netloc==urlparse(BASE).netloc:
            assets.setdefault(src,{'url':src,'pages':[],'alt':''})['pages'].append(url)
    main=soup.select_one('main') or soup.select_one('body') or soup
    clean=BeautifulSoup(str(main),'html.parser')
    for el in clean.select('script,style,nav,footer,header'):el.decompose()
    pages[url]={'url':url,'finalUrl':r.url,'status':r.status_code,'archive':f'html/{key}.html','title':soup.title.get_text(strip=True) if soup.title else '', 'lang':soup.html.get('lang') if soup.html else '', 'headings':[{'level':h.name,'text':h.get_text(' ',strip=True)} for h in main.select('h1,h2,h3,h4')], 'text':clean.get_text('\n',strip=True), 'mainHtml':str(clean),'tables':[[[c.get_text(' ',strip=True) for c in row.select('th,td')] for row in t.select('tr')] for t in main.select('table')], 'images':images,'links':links, 'meta':[dict(x.attrs) for x in soup.select('meta')], 'alternates':[dict(x.attrs) for x in soup.select('link[rel=alternate],link[rel=canonical]')], 'schema':[x.get_text() for x in soup.select('script[type="application/ld+json"]')]}
    found=[x['href'] for x in links]+re.findall(r'<loc>(.*?)</loc>',r.text)+re.findall(r'(?im)^Sitemap:\s*(\S+)',r.text)
    for target in found:
        target=urldefrag(target)[0]
        parsed=urlparse(target)
        if parsed.netloc!=urlparse(BASE).netloc or re.search(r'/(admin|login|logout|register|storage|build|vendor)/',parsed.path):continue
        if re.search(r'\.(jpg|jpeg|png|webp|svg|css|js|ico|pdf|zip)$',parsed.path,re.I):continue
        if target not in pages and target not in queue:queue.append(target)
    print(r.status_code,url,flush=True); save()
def download(item):
    url=item['url']; r=fetch(url)
    item['status']=r.status_code if r is not None else 0
    if r is not None and r.ok:
        suffix=Path(urlparse(url).path).suffix or '.bin'
        name=hashlib.sha256(url.encode()).hexdigest()[:12]+suffix
        (OUT/'originals'/name).write_bytes(r.content)
        item['original']='originals/'+name; item['bytes']=len(r.content)
    return item
with ThreadPoolExecutor(max_workers=5) as pool:
    list(pool.map(download,assets.values()))
save()
print(json.dumps({'pages':len(pages),'successful':sum(x['status']==200 for x in pages.values()),'assets':len(assets)}),flush=True)
