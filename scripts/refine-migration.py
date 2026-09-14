import json,requests
from pathlib import Path
from bs4 import BeautifulSoup
raw=json.loads(Path('source-archive/pages.json').read_text(encoding='utf8')); data=json.loads(Path('content/source.json').read_text(encoding='utf8'))
for p in data:
 if p['id'] in ['quote','survey','contact']:
  original=next(x for x in raw if x['url']==p['source']);s=BeautifulSoup(original['mainHtml'],'html.parser');p['blocks']=[]
  for el in s.select('.site-lead-sidebar__card h3,.site-lead-sidebar__card p,.site-inquiry-box__content h2,.site-inquiry-box__content p'):
   p['blocks'].append({'type':'h2' if el.name.startswith('h') else 'p','text':el.get_text(' ',strip=True).replace('⚡','').strip()})
Path('content/source.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
for lang in ['tr','en','ar','ru']:
 p=next(x for x in raw if x['url']=='https://mabteknoloji.com.tr/'+lang)
 print(lang, 'home alternates',p['alternates']);print('schema',p['schema'])
assets=json.loads(Path('source-archive/assets.json').read_text(encoding='utf8'))
for asset in assets:
 if asset['status']!=200:
  statuses=[asset['status']]
  for i in range(2):
   try:statuses.append(requests.get(asset['url'],timeout=20).status_code)
   except requests.RequestException:statuses.append(0)
  asset['attempts']=statuses
Path('source-archive/assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf8')
