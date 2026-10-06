#!/usr/bin/env python3
"""Build verified POTA geometries and a small map overview from official sources.
Only exact source IDs or unique exact names near the POTA coordinate are accepted.
Failed updates retain the last verified copy. No runtime source requests are needed.
"""
import argparse, concurrent.futures, datetime, hashlib, json, math, re, time, unicodedata
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
from xml.sax.saxutils import escape
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.geometry-source-cache'
SOURCES={
 'VV':('https://kart.miljodirektoratet.no/arcgis/rest/services/vern/FeatureServer/0/query','naturvernId','navn','verneform','Miljødirektoratets Naturbase – verneområder'),
 'FS':('https://kart.miljodirektoratet.no/arcgis/rest/services/friluftsliv_statlig_sikra/MapServer/0/query','friluftId','omraadeNavn',None,'Miljødirektoratets Naturbase – statlig sikrede friluftslivsområder'),
 'FK':('https://kart.miljodirektoratet.no/arcgis/rest/services/friluftsliv_kartlagt/MapServer/0/query','kartlagt_foid','omraadenavn',None,'Miljødirektoratets Naturbase – kartlagte friluftslivsområder')}
DATE=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
def norm(v):return re.sub(r'[^a-z0-9]+',' ',''.join(c for c in unicodedata.normalize('NFD',str(v or '').lower().replace('ø','o').replace('æ','ae')) if not unicodedata.combining(c))).strip()
def request(base,params):
 url=base+'?'+urllib.parse.urlencode(params);CACHE.mkdir(exist_ok=True);f=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.json')
 if f.exists() and time.time()-f.stat().st_mtime<86400:return json.loads(f.read_text())
 for n in range(3):
  try:
   r=urllib.request.urlopen(url,timeout=90);raw=r.read();d=json.loads(raw)
   if d.get('error'):raise ValueError(d['error'])
   f.write_bytes(raw);return d
  except Exception:
   if n==2:raise
   time.sleep(1+n)
def source_id(p):
 try:
  u=urllib.parse.urlsplit(p.get('website') or '')
  if u.hostname=='faktaark.naturbase.no':
   v=urllib.parse.parse_qs(u.query).get('id',[''])[0].upper()
   if re.fullmatch(r'(VV|FS|FK)\d{8}',v):return v
 except Exception:pass
 return ''
def get_no(prefix,ids):
 url,field,name,typ,label=SOURCES[prefix];out={}
 def chunk(values):
  where=field+' IN ('+','.join("'"+v+"'" for v in values)+')'
  d=request(url,dict(f='geojson',where=where,outFields=','.join(x for x in [field,name,typ] if x),returnGeometry='true',outSR='4326',geometryPrecision=6,resultRecordCount=2000))
  if d.get('exceededTransferLimit'):raise ValueError('Truncated source response')
  return d.get('features',[])
 batches=[ids[i:i+60] for i in range(0,len(ids),60)]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for fs in pool.map(chunk,batches):
   for f in fs:
    pr=f['properties'];k=pr[field];out.setdefault(k,[]).append(f)
 print(prefix,len(out),'source IDs',flush=True);return out

def se_official_name(p):
 return re.sub(r'\s+(National Park|Nature Reserve|Natural Reserve|Protected Landscape|National Heritage Area|Natura 2000.*|National Reserve|Conservation Reserve|Nature Park|Park Reserve|Natural Monument|Wilderness Area|Nature Refuge|Landscape Area)$','',p['name'],flags=re.I)

def se_catalog(kind,parks):
 base='https://geodata.naturvardsverket.se/'+('n2000' if kind=='n2000' else 'naturvardsregistret')+'/wfs'
 typ='N2000_WFS:N2000' if kind=='n2000' else 'Naturvardsregistret_WFS:SkyddadeOmraden'
 if kind=='national':
  # This endpoint truncates unfiltered results and does not reliably page them.
  # Bounded exact-name/ID filters avoid its pagination altogether.
  names=sorted({se_official_name(p) for p in parks if 'natura 2000' not in p['name'].lower()})
  clauses=[('NAMN',name) for name in names]+[('NVRID','2000583'),('NVRID','2000370'),('NAMN','Tanumskusten'),('NAMN','Gökstenen')]
  def batch(values):
   parts=['<fes:PropertyIsEqualTo matchCase="false"><fes:ValueReference>'+field+'</fes:ValueReference><fes:Literal>'+escape(value)+'</fes:Literal></fes:PropertyIsEqualTo>' for field,value in values]
   f='<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">'+('<fes:Or>'+''.join(parts)+'</fes:Or>' if len(parts)>1 else parts[0])+'</fes:Filter>'
   d=request(base,dict(service='WFS',version='2.0.0',request='GetFeature',typeNames=typ,outputFormat='GEOJSON',srsName='EPSG:4326',count=500,filter=f))
   fs=d.get('features',[])
   if len(fs)>=500:
    if len(values)==1:raise ValueError('Single name exceeded the source feature limit')
    mid=len(values)//2;return batch(values[:mid])+batch(values[mid:])
   return fs
  out={}
  groups=[clauses[i:i+20] for i in range(0,len(clauses),20)]
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
   for fs in pool.map(batch,groups):
    for feature in fs:
     key=feature.get('properties',{}).get('GmlID') or json.dumps(feature)
     out[key]=feature
  print(kind,len(out),'filtered source features',flush=True);return list(out.values())
 out=[];start=0
 while True:
  d=request(base,dict(service='WFS',version='2.0.0',request='GetFeature',typeNames=typ,outputFormat='GEOJSON',srsName='EPSG:4326',count=500,startIndex=start))
  fs=d.get('features',[]);out.extend(fs);print(kind,len(out),'source features',flush=True)
  if len(fs)!=500:break
  start+=len(fs)
  if start>25000:raise ValueError('Unexpectedly large catalogue')
 return out

def pick(pr,keys):
 low={norm(k).replace(' ',''):v for k,v in pr.items()}
 return next((low[norm(k).replace(' ','')] for k in keys if low.get(norm(k).replace(' ','')) not in (None,'')),None)
def vertices(g):
 if g.get('type')=='GeometryCollection':
  for x in g.get('geometries',[]):yield from vertices(x)
 else:
  def walk(v):
   if isinstance(v,list) and len(v)>=2 and isinstance(v[0],(float,int)):yield v[:2]
   elif isinstance(v,list):
    for x in v:yield from walk(x)
  yield from walk(g.get('coordinates',[]))
def valid(g):
 pts=list(vertices(g)) if isinstance(g,dict) else []
 return bool(pts) and g.get('type') in ['Polygon','MultiPolygon','LineString','MultiLineString','Point','MultiPoint','GeometryCollection'] and all(len(p)==2 and all(isinstance(v,(int,float)) and math.isfinite(v) for v in p) and -180<=p[0]<=180 and -90<=p[1]<=90 for p in pts)
def bounds(g):
 pts=list(vertices(g));return [min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)]
def merge(fs):
 gs=[f['geometry'] for f in fs if valid(f.get('geometry'))]
 if len(gs)!=len(fs) or not gs:raise ValueError('Missing or invalid geometry')
 if len(gs)==1:return gs[0]
 if all(g['type'] in ('Polygon','MultiPolygon') for g in gs):return dict(type='MultiPolygon',coordinates=[p for g in gs for p in ([g['coordinates']] if g['type']=='Polygon' else g['coordinates'])])
 return dict(type='GeometryCollection',geometries=gs)
def rdp(a,tol):
 if len(a)<=2:return a
 x,y=a[0];dx,dy=a[-1][0]-x,a[-1][1]-y;den=dx*dx+dy*dy
 best=tol*tol;at=0
 for i in range(1,len(a)-1):
  px,py=a[i];t=max(0,min(1,((px-x)*dx+(py-y)*dy)/den)) if den else 0;d=(px-x-t*dx)**2+(py-y-t*dy)**2
  if d>best:best=d;at=i
 if not at:return [a[0],a[-1]]
 return rdp(a[:at+1],tol)[:-1]+rdp(a[at:],tol)
def simplify(g):
 def ring(a):
  v=rdp(a,.001)
  return v if len(v)>=4 else a
 typ=g['type'];c=g.get('coordinates')
 if typ=='Polygon':return dict(type=typ,coordinates=[ring(a) for a in c])
 if typ=='MultiPolygon':return dict(type=typ,coordinates=[[ring(a) for a in p] for p in c])
 if typ=='LineString':return dict(type=typ,coordinates=rdp(c,.001))
 if typ=='MultiLineString':return dict(type=typ,coordinates=[rdp(a,.001) for a in c])
 if typ=='GeometryCollection':return dict(type=typ,geometries=[simplify(x) for x in g['geometries']])
 return g

def se_match(p,catalogue):
 name=se_official_name(p)
 want=norm(name);candidates=[]
 url=urllib.parse.unquote(p.get('website') or '')
 ids=re.findall(r'(?:NVRID[=/]|nvrid[=/]|omrade/)(\d{6,})|\b(SE\d{7})\b',url,re.I)
 confirmed={v.upper() for pair in ids for v in pair if v}
 override={'SE-0245':'2000583','SE-0266':'2000370','SE-1418':'SE0520187'}
 if p['reference'] in override:confirmed={override[p['reference']]}
 pool=[]
 for key in (['id:'+v for v in confirmed] if confirmed else ['name:'+want]):pool.extend(catalogue.get(key,[]))
 for f in pool:
  pr=f.get('properties') or {};fid=pick(pr,['NVRID','NVR_ID','OMRADESKOD','SITE_CODE']);nm=pick(pr,['NAMN','OMRADESNAMN','SITE_NAME','NAME'])
  if not valid(f.get('geometry')):continue
  explicit=bool(confirmed and str(fid).upper() in confirmed)
  if not explicit and norm(nm)!=want:continue
  b=bounds(f['geometry']);lat=float(p['latitude']);lon=float(p['longitude'])
  if not explicit and not (b[0]-.03<=lon<=b[2]+.03 and b[1]-.03<=lat<=b[3]+.03):continue
  candidates.append((f,fid,nm,explicit))
 unique={str(x[1]) for x in candidates}
 if len(unique)!=1 or not candidates:raise ValueError('No unique exact name/ID and position match')
 return dict(source='national',sourceLabel='Naturvårdsverkets register',id=candidates[0][1],name=candidates[0][2],geometry=merge([x[0] for x in candidates]),officialType=pick(candidates[0][0]['properties'],['SKYDDSTYP']) or '',verifiedDate=DATE)

def build(country,entries,errors):
 out=ROOT/'data'/'geometries';out.mkdir(exist_ok=True);overview=[];index={};refs=sorted(entries)
 for n in range(0,len(refs),40):
  batch=refs[n:n+40];shard=f'{country}-{n//40:03}.json';records={ref:entries[ref] for ref in batch}
  (out/shard).write_text(json.dumps(records,ensure_ascii=False,separators=(',',':')))
  for ref in batch:
   r=entries[ref];index[ref]={k:v for k,v in r.items() if k!='geometry'};index[ref].update(bbox=bounds(r['geometry']),shard=shard)
   overview.append(dict(type='Feature',properties={'reference':ref},geometry=simplify(r['geometry'])))
 (out/f'{country}-overview.geojson').write_text(json.dumps(dict(type='FeatureCollection',features=overview),ensure_ascii=False,separators=(',',':')))
 (out/f'{country}-index.json').write_text(json.dumps(dict(schemaVersion=1,country=country,generatedDate=DATE,parks=index,missing=errors),ensure_ascii=False,separators=(',',':')))
 print(country,len(entries),'geometries;',len([r for r in errors if r not in entries]),'point fallbacks',flush=True)
def previous(cc):
 p=ROOT/'data/geometries'/f'{cc}-index.json';out={}
 if p.exists():
  d=json.loads(p.read_text());shards={}
  for ref,meta in d['parks'].items():
   s=meta['shard']
   if s not in shards:shards[s]=json.loads((p.parent/s).read_text())
   r=shards[s].get(ref)
   if r and valid(r.get('geometry')):out[ref]=r
 return out

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--country',choices=['NO','SE','ALL'],default='ALL');args=parser.parse_args()
 for cc in (['NO','SE'] if args.country=='ALL' else [args.country]):
  parks=json.loads((ROOT/'data'/f'pota-{cc}.json').read_text());old=previous(cc);entries={p['reference']:old[p['reference']] for p in parks if p['reference'] in old and old[p['reference']].get('sourceWebsite')==p.get('website')};errors={};source_errors={}
  catalogs={}
  if cc=='NO':
   for prefix in SOURCES:
    ids=sorted({source_id(p) for p in parks if source_id(p).startswith(prefix)})
    try:catalogs[prefix]=get_no(prefix,ids)
    except Exception as e:source_errors[prefix]=str(e);catalogs[prefix]={}
  else:
   for kind in ['national','n2000']:
    try:
     rows=se_catalog(kind,parks);catalogs[kind]={}
     for f in rows:
      pr=f.get('properties') or {}
      if pr.get('BESLUTSSTATUS') not in (None,'Gällande'):continue
      fid=pick(pr,['NVRID','NVR_ID','OMRADESKOD','SITE_CODE']);nm=pick(pr,['NAMN','OMRADESNAMN','SITE_NAME','NAME'])
      for key in ['id:'+str(fid).upper(),'name:'+norm(nm)]:catalogs[kind].setdefault(key,[]).append(f)
    except Exception as e:source_errors[kind]=str(e);catalogs[kind]={}
  print('Source errors:',source_errors,flush=True)
  for p in parks:
   ref=p['reference']
   try:
    if cc=='NO':
     sid=source_id(p);prefix=sid[:2]
     if prefix in SOURCES:
      url,field,name,typ,label=SOURCES[prefix];fs=catalogs[prefix].get(sid,[])
      if not fs:raise ValueError('Source ID missing or source unavailable')
      r=dict(source='norway',sourceLabel=label,id=sid,name=fs[0]['properties'][name],officialType=fs[0]['properties'].get(typ,'') if typ else '',geometry=merge(fs),verifiedDate=DATE)
     elif 'kulturminnesok.no' in (p.get('website') or ''):
      u=urllib.parse.urlsplit(p['website']);sid=urllib.parse.parse_qs(u.query).get('id',[''])[0] or (re.search(r'/lokalitet/(\d+)',u.path).group(1) if re.search(r'/lokalitet/(\d+)',u.path) else '')
      f=json.loads((ROOT/'data/kulturminner'/f'{sid}.geojson').read_text())
      if str(f.get('properties',{}).get('kulturminneId') or f.get('id'))!=sid:raise ValueError('Heritage ID mismatch')
      r=dict(source='norway',sourceLabel='Riksantikvarens kulturminneregister',id=sid,name=f['properties']['navn'],geometry=f['geometry'],verifiedDate=f.get('cacheMetadata',{}).get('verifiedDate',DATE),geometryNote='Registergeometrien dekker ikke nødvendigvis hele POTA-området.')
     elif ref=='NO-2542':
      d=request('https://kart.analyseabo.no/arcgis/rest/services/Turkart/RegFriluft_innsyn/MapServer/15/query',dict(f='geojson',where='1=1',outFields='OBJECTID,Navn',returnGeometry='true',outSR=4326,resultRecordCount=2000))
      if d.get('exceededTransferLimit'):raise ValueError('Truncated trail')
      r=dict(source='notrail',sourceLabel='Kyststien Østfold – offisielt rutelag',id='NO-2542 fallback',name='Kyststien Østfold',geometry=merge(d['features']),verifiedDate=DATE)
     else:raise ValueError('No verified source ID')
    else:
     kind='n2000' if 'natura 2000' in p['name'].lower() else 'national';r=se_match(p,catalogs[kind]);r['source']=kind
    if not valid(r.get('geometry')):raise ValueError('Invalid geometry')
    r['sourceWebsite']=p.get('website');entries[ref]=r
   except Exception as e:
    errors[ref]=str(e)
    if ref in entries:entries[ref]['updateWarning']=str(e)
  entries={ref:r for ref,r in entries.items() if any(p['reference']==ref for p in parks)}
  build(cc,entries,errors)
if __name__=='__main__':main()
