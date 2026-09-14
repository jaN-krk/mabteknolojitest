import requests,json,re,hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin,urlparse,urldefrag
from bs4 import BeautifulSoup
old=json.loads(Path('source-archive/pages.json').read_text(encoding='utf8'));known={x['url'] for x in old};seen={};pending={'https://mabteknoloji.com.tr/','https://mabteknoloji.com.tr/robots.txt','https://mabteknoloji.com.tr/sitemap.xml'};out=Path('source-archive/recheck-v3');out.mkdir(exist_ok=True)
def fetch(url):
 try:
  r=requests.get(url,timeout=20);s=BeautifulSoup(r.text,'html.parser');links=[urljoin(r.url,a['href']) for a in s.select('a[href]')]+re.findall(r'<loc>(.*?)</loc>',r.text);main=s.select_one('main') or s
  (out/(hashlib.sha256(url.encode()).hexdigest()[:16]+'.html')).write_text(r.text,encoding='utf8')
  return {'url':url,'status':r.status_code,'title':s.title.get_text() if s.title else '', 'text':main.get_text(' ',strip=True),'links':links,'images':[urljoin(r.url,x.get('src','')) for x in s.select('img[src]')]}
 except Exception as e:return {'url':url,'status':0,'error':str(e),'links':[]}
while pending and len(seen)<150:
 with ThreadPoolExecutor(max_workers=8) as pool:rows=list(pool.map(fetch,sorted(pending)))
 pending=set()
 for row in rows:seen[row['url']]=row
 for row in rows:
  for u in row['links']:
   u=urldefrag(u)[0];p=urlparse(u)
   if p.netloc=='mabteknoloji.com.tr' and not re.search(r'\.(jpg|png|webp|svg|css|js|pdf)$',p.path) and u not in seen:pending.add(u)
report={'checked':len(seen),'newURLs':sorted(set(seen)-known),'statuses':{str(code):sum(x['status']==code for x in seen.values()) for code in set(x['status'] for x in seen.values())},'pages':list(seen.values())};Path('reports/revision-v3').mkdir(exist_ok=True);Path('reports/revision-v3/source-recheck.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print({k:v for k,v in report.items() if k!='pages'})
