"""Build local reference packs. Run deliberately; never downloads during play."""
import urllib.request, json, re, hashlib, pathlib, html, time
from html.parser import HTMLParser
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'public'/'content';out.mkdir(parents=True,exist_ok=True)
class Paragraphs(HTMLParser):
 def __init__(self): super().__init__();self.main=False;self.depth=0;self.current=None;self.text=[];self.items=[];self.skip=0
 def handle_starttag(self,t,a):
  attrs=dict(a)
  if t=='main' or attrs.get('role')=='main':self.main=True
  if not self.main:return
  if t in ('script','style','nav'):self.skip+=1
  if t in ('p','h1','h2','h3') and not self.skip:self.current=t;self.text=[]
 def handle_endtag(self,t):
  if t in ('script','style','nav') and self.skip:self.skip-=1
  if self.current==t:
   value=re.sub(r'\s+',' ',''.join(self.text)).strip().replace('¶','')
   if value:self.items.append((t,value))
   self.current=None;self.text=[]
 def handle_data(self,d):
  if self.current and not self.skip:self.text.append(d)
def fetch(url):
 cache=pathlib.Path('/tmp/finding-game-source-cache');cache.mkdir(exist_ok=True)
 path=cache/hashlib.sha256(url.encode()).hexdigest()
 if path.exists():return path.read_text()
 for attempt in range(4):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'ArchiveGameContentBuild/1.0'})
   with urllib.request.urlopen(req,timeout=25) as r:data=r.read().decode('utf-8-sig')
   path.write_text(data);return data
  except Exception:
   if attempt==3:raise
   time.sleep(1+attempt)
def chunk(paragraphs):
 result=[];section='Retained extract';parts=[];count=0
 def flush():
  nonlocal parts,count
  if parts:result.append({'section':section[:150],'text':'\n\n'.join(parts)})
  parts=[];count=0
 for tag,p in paragraphs:
  if tag.startswith('h'):
   if count>=65:flush()
   section=p;continue
  n=len(p.split())
  if n<12:continue
  if count+n>210 and count>=65:flush()
  # Keep full paragraphs. Oversized paragraphs remain intact rather than cutting sentences.
  parts.append(p);count+=n
  if count>=150:flush()
 flush();return [e for e in result if len(e['text'].split())>=35]
books=[('babbage',4238,'On the Economy of Machinery and Manufactures','Charles Babbage','1832 / Project Gutenberg transcription'),('origin',1228,'On the Origin of Species','Charles Darwin','1859 / Project Gutenberg transcription'),('worms',2355,'The Formation of Vegetable Mould through the Action of Worms','Charles Darwin','1881 / Project Gutenberg transcription'),('candle',14474,'The Chemical History of a Candle','Michael Faraday','1861 / Project Gutenberg transcription'),('beagle',944,'The Voyage of the Beagle','Charles Darwin','1839 / Project Gutenberg transcription')]
manifest=[]
for sid,num,title,author,edition in books:
 print('Reading',sid,flush=True)
 if (out/(sid+'.json')).exists():
  excerpts=json.loads((out/(sid+'.json')).read_text())['excerpts']
 else:
  raw=fetch(f'https://www.gutenberg.org/ebooks/{num}.txt.utf-8')
  if 'Copyrighted' in raw[:5000]:raise RuntimeError('Restricted work: '+sid)
  start=re.search(r'\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*',raw,re.I)
  end=re.search(r'\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK',raw,re.I)
  if not start or not end:raise RuntimeError('Cannot identify source boundary: '+sid)
  raw=raw[start.end():end.start()]
  raw=raw.replace('\r\n','\n')
  paras=[]
  for p in re.split(r'\n\s*\n',raw):
   p=re.sub(r'\s+',' ',p).strip()
   if len(p)<8:continue
   if len(p.split())<12:paras.append(('h2',p))
   else:paras.append(('p',p))
  excerpts=chunk(paras)
 pack={'id':sid,'excerpts':excerpts};payload=json.dumps(pack,ensure_ascii=False,separators=(',',':')).encode()
 (out/(sid+'.json')).write_bytes(payload)
 manifest.append({'id':sid,'title':title,'author':author,'edition':edition,'url':f'https://www.gutenberg.org/ebooks/{num}','license':'Public-domain original; source assessed individually','licenseUrl':'https://www.gutenberg.org/policy/permission','notice':f'Original author: {author}. Original work published before 1900; author died before 1930. Project Gutenberg wrapper and trademarks excluded. Source headers reviewed during import.','file':f'content/{sid}.json','sha256':hashlib.sha256(payload).hexdigest(),'excerpts':len(excerpts),'words':sum(len(e['text'].split()) for e in excerpts)})
 time.sleep(1)
# Python's own tutorial; retain the complete license and copyright notices.
pylicense=fetch('https://docs.python.org/3.14/license.html')
(out/'python-license.html').write_text(pylicense)
parser=Paragraphs();parser.feed(pylicense)
notice='\n\n'.join(t for _,t in parser.items)
clean=re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>', '', pylicense, flags=re.S|re.I)
license_text=html.unescape(re.sub(r'<[^>]+>', '', clean))
(out/'python-license.txt').write_text(license_text)
(out/'python-license.html').write_text('<!doctype html><meta charset="utf-8"><title>Python documentation license notices</title><pre style="white-space:pre-wrap">'+html.escape(license_text)+'</pre>')
entries=[]
for slug in ['introduction','controlflow','datastructures','modules','inputoutput','errors','classes','stdlib','stdlib2','venv','floatingpoint']:
 print('Reading Python',slug,flush=True)
 p=Paragraphs();p.feed(fetch(f'https://docs.python.org/3.14/tutorial/{slug}.html'));entries.extend(chunk(p.items))
pack={'id':'python','excerpts':entries};payload=json.dumps(pack,ensure_ascii=False,separators=(',',':')).encode();(out/'python.json').write_bytes(payload)
manifest.append({'id':'python','title':'Python Tutorial','author':'Python Software Foundation','edition':'Python 3.14 documentation, captured for archive content version 2','url':'https://docs.python.org/3.14/tutorial/','license':'Python Software Foundation License Version 2 and included historical notices','licenseUrl':'https://docs.python.org/3.14/license.html','notice':'Copyright © Python Software Foundation. License and copyright notices retained in content/python-license.html and content/python-license.txt. Excerpts are reformatted as fictional archive attachments; Python documentation itself is not endorsed or altered in meaning.','file':'content/python.json','sha256':hashlib.sha256(payload).hexdigest(),'excerpts':len(entries),'words':sum(len(e['text'].split()) for e in entries)})
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(root/'src'/'content'/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps([{'id':m['id'],'excerpts':m['excerpts'],'words':m['words']} for m in manifest],indent=2))
