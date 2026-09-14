import requests,json,re,csv,os
from pathlib import Path
from urllib.parse import urlparse,urljoin
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
BASE=os.environ.get('TEST_BASE','http://localhost:5173');ORIGIN='https://mabteknoloji.com.tr'
out=Path('reports');out.mkdir(exist_ok=True)
source=json.loads(Path('content/source.json').read_text(encoding='utf8'))
blog=json.loads(Path('content/blog.json').read_text(encoding='utf8'))
paths=[p['path'] for p in source+blog]
for lang in ['tr','en','ar','ru']:
 paths += [f'/{lang}/'+p for p in (['ozel-cozumler','blog','site-haritasi','gizlilik','kvkk','cerez-politikasi'] if lang=='tr' else ['solutions','blog','sitemap','privacy','kvkk','cookies'])]
report=[];links=set()
def check(path):
 r=requests.get(BASE+path,timeout=45);s=BeautifulSoup(r.text,'html.parser')
 canonical=s.select_one('link[rel=canonical]');robots=s.select_one('meta[name=robots]');description=s.select_one('meta[name=description]')
 alternate={e.get('hreflang'):e.get('href') for e in s.select('link[rel=alternate][hreflang]')}
 schema=[json.loads(x.string or x.get_text()) for x in s.select('script[type="application/ld+json"]')]
 local=[]
 for a in s.select('a[href]'):
  target=urljoin(BASE+path,a['href']);u=urlparse(target)
  if u.netloc==urlparse(BASE).netloc:local.append(u.path+('?' + u.query if u.query else ''))
 for im in s.select('img[src]'):local.append(im['src'])
 return {'path':path,'status':r.status_code,'title':s.title.get_text() if s.title else '', 'description':description.get('content') if description else None,'h1':[h.get_text(' ',strip=True) for h in s.select('h1')],'lang':s.html.get('lang'),'dir':s.html.get('dir'),'canonical':canonical.get('href') if canonical else None,'alternates':alternate,'robots':robots.get('content') if robots else '', 'schema':schema,'links':local,'externalImages':[im['src'] for im in s.select('img[src]') if im['src'].startswith('http')]}
with ThreadPoolExecutor(max_workers=4) as pool:report=list(pool.map(check,paths))
errors=[];titles=set()
for p in report:
 if p['status']!=200:errors.append([p['path'],'status',p['status']])
 if len(p['h1'])!=1:errors.append([p['path'],'h1',p['h1']])
 if p['canonical']!=ORIGIN+p['path']:errors.append([p['path'],'canonical',p['canonical']])
 if len(p['alternates'])!=5:errors.append([p['path'],'hreflang-count',p['alternates']])
 for lang,url in p['alternates'].items():
  if lang=='x-default':continue
  counterpart=next((r for r in report if ORIGIN+r['path']==url),None)
  if not counterpart or counterpart['alternates'].get(p['lang'])!=ORIGIN+p['path']:errors.append([p['path'],'reciprocal',url])
 if p['title'] in titles:errors.append([p['path'],'duplicate-title',p['title']])
 titles.add(p['title'])
 if not p['description']:errors.append([p['path'],'missing-description'])
 if p['externalImages']:errors.append([p['path'],'hotlinked-images'])
 links.update(p.pop('links'))
xml=requests.get(BASE+'/sitemap.xml').text
sitemap=re.findall(r'<loc>(.*?)</loc>',xml)
for url in sitemap:
 p=next((x for x in report if ORIGIN+x['path']==url),None)
 if not p or p['status']!=200 or 'noindex' in p['robots']:errors.append([url,'invalid-sitemap-entry'])
for p in report:
 if 'noindex' not in p['robots'] and ORIGIN+p['path'] not in sitemap:errors.append([p['path'],'missing-sitemap-entry'])
def linkcheck(path):
 try:r=requests.get(BASE+path,timeout=45,allow_redirects=False);return {'path':path,'status':r.status_code}
 except Exception:return {'path':path,'status':0}
with ThreadPoolExecutor(max_workers=4) as pool:linkresults=list(pool.map(linkcheck,sorted(links)))
broken=[r for r in linkresults if r['status']>=400 or r['status']==0]
raw=json.loads(Path('source-archive/pages.json').read_text(encoding='utf8'))
with (out/'url-map.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['Source URL','Source status','New URL','Behavior'])
 for p in raw:
  u=urlparse(p['url']);path=u.path or '/';new=path+('?' + u.query if u.query else '')
  w.writerow([p['url'],p['status'],ORIGIN+('/tr' if path=='/' else new),'301' if path=='/' else '200; URL retained / fixed'])
result={'base':BASE,'pages':len(report),'indexable':len(sitemap),'drafts':sum('noindex' in p['robots'] and not p['path'].endswith(('/sitemap','/site-haritasi')) for p in report),'noindex':sum('noindex' in p['robots'] for p in report),'checkedLinks':len(linkresults),'errors':errors,'brokenLinks':broken,'records':report,'links':linkresults}
(out/'seo-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:result[k] for k in ['pages','indexable','drafts','checkedLinks','errors','brokenLinks']},ensure_ascii=False))
