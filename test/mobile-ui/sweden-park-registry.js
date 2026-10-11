// Extracted from app-core.js; preserve original functions and behavior.
function unwrapList(d){
  if(Array.isArray(d)) return d;
  if(d&&Array.isArray(d.features)) return d.features;
  for(const k of ['items','results','data','omraden','områden','content']) if(d&&Array.isArray(d[k])) return d[k];
  return [];
}
function propsOf(x){return x&&x.type==='Feature'?(x.properties||{}):(x||{})}
function pick(o,keys){const p=propsOf(o), low={};for(const [k,v] of Object.entries(p))low[norm(k)]=v;for(const k of keys){const v=low[norm(k)];if(v!==undefined&&v!==null&&v!=='')return v}return null}
function officialNameOf(o){return pick(o,['Namn','Omradesnamn','områdesnamn','name','namn','siteName','site_name','titel','title'])||''}
function nationalIdOf(o){return pick(o,['Nvrid','NVRID','NvrId','nvr_id','NVR-id','nvr id','OmradesId','OmrådeId','omradeId','id','Id','ID'])}
function n2000IdOf(o){return pick(o,['Omradeskod','områdeskod','SITE_CODE','siteCode','site_code','SiteCode','id','Id','ID'])}
function officialIdOf(o,source){return source==='n2000'?n2000IdOf(o):nationalIdOf(o)}
function geomOf(o){if(o&&o.type==='Feature'&&o.geometry)return o.geometry;const p=propsOf(o);return p.geometry||p.geometri||null}

async function fetchJsonLoose(url){
  const r=await fetch(url,{headers:{'Accept':'application/json, application/geo+json, */*'}});
  if(!r.ok)throw Error(`HTTP ${r.status}`);
  const txt=await r.text();
  try{return JSON.parse(txt)}catch(e){throw Error(`REST svarte ikke med JSON (${txt.slice(0,80).replace(/\s+/g,' ')})`)}
}
async function fetchText(url){const r=await fetch(url,{headers:{'Accept':'text/plain, application/json, */*'}});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.text()}

async function catalog(source,base){
  if(restCatalogCache[source])return restCatalogCache[source];
  const tries=[`${base}/omrade`,`${base}/område`];
  let last;
  for(const u of tries){try{const d=await fetchJsonLoose(u);const a=unwrapList(d);if(a.length){restCatalogCache[source]=a;return a}}catch(e){last=e}}
  throw last||Error('Fant ingen områdeliste i REST-tjenesten');
}
function scoreCandidate(o,link,p){
  const a=norm(officialNameOf(o)), b=norm(link.officialName); let score=0;
  if(a===b)score=100; else if(a.includes(b)||b.includes(a))score=80; else {const A=new Set(a.split(' ')),B=new Set(b.split(' '));let n=0;for(const x of A)if(B.has(x))n++;score=n*5}
  const typ=norm(pick(o,['Skyddstyp','Typ','type','skyddsform','siteType'])||'');
  const want=norm(link.type); if(typ&&want&&(typ.includes(want)||want.includes(typ)))score+=10;
  return score;
}

const N2000_WFS='https://geodata.naturvardsverket.se/n2000/wfs';
function pointInRing(pt,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];const hit=((yi>pt[1])!==(yj>pt[1]))&&(pt[0]<(xj-xi)*(pt[1]-yi)/((yj-yi)||1e-15)+xi);if(hit)inside=!inside}return inside}
function pointInGeom(g,lon,lat){if(!g)return false;const pt=[lon,lat];if(g.type==='Polygon')return g.coordinates.length?pointInRing(pt,g.coordinates[0]):false;if(g.type==='MultiPolygon')return g.coordinates.some(p=>p.length&&pointInRing(pt,p[0]));return false}
function n2000WfsNameOf(f){return officialNameOf(f)||pick(f,['OMRADESNAMN','OMR_NAMN','SITE_NAME','SITENAME','Namn','name'])||''}
function n2000WfsCodeOf(f){return n2000IdOf(f)||pick(f,['OMRADESKOD','SITE_CODE','SITECODE','sitecode','site_code'])}
async function resolveN2000Fallback(link,p,expectedCode=null){
  const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('POTA-referansen mangler koordinat');
  const d=.35;
  const bbox4326=[lat-d,lon-d,lat+d,lon+d].join(',');
  const crs4326='urn:ogc:def:crs:EPSG::4326';
  const urls=[
    `${N2000_WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=N2000_WFS:N2000&outputFormat=GEOJSON&srsName=${encodeURIComponent(crs4326)}&bbox=${bbox4326},${encodeURIComponent(crs4326)}`,
    `${N2000_WFS}?service=WFS&version=1.1.0&request=GetFeature&typeName=N2000_WFS:N2000&outputFormat=GEOJSON&srsName=${encodeURIComponent(crs4326)}&bbox=${bbox4326},${encodeURIComponent(crs4326)}`
  ];
  let last;
  for(const u of urls){
    try{
      const j=await fetchJsonLoose(u),fs=(j.features||[]).filter(f=>f&&f.geometry);
      if(!fs.length)continue;
      if(expectedCode){
        const wantCode=String(expectedCode).trim().toUpperCase();
        const exact=fs.filter(f=>String(n2000WfsCodeOf(f)||'').trim().toUpperCase()===wantCode);
        if(!exact.length)continue;
        const best=exact.map(f=>({f,name:n2000WfsNameOf(f),inside:pointInGeom(f.geometry,lon,lat),dist:geomDistKm(f.geometry,lat,lon)}))
          .sort((a,b)=>(b.inside-a.inside)||(a.dist-b.dist))[0];
        return {id:wantCode,name:best.name||link.officialName,source:'n2000',officialType:'Natura 2000',geometry:best.f.geometry,fallback:'WFS verifisert SITE_CODE'};
      }
      const want=norm(link.officialName);
      const ranked=fs.map(f=>{const name=n2000WfsNameOf(f),a=norm(name);let score=0;if(a===want)score=120;else if(a.includes(want)||want.includes(a))score=90;else{const A=new Set(a.split(' ')),B=new Set(want.split(' '));let n=0;for(const x of A)if(B.has(x))n++;score=n*8}const inside=pointInGeom(f.geometry,lon,lat);const dist=inside?0:geomDistKm(f.geometry,lat,lon);if(inside)score+=60;else if(dist<1)score+=30;else if(dist<5)score+=15;return {f,name,score,dist,inside}}).sort((a,b)=>b.score-a.score||a.dist-b.dist);
      const best=ranked[0];
      if(!best||best.score<80||best.dist>10)continue;
      return {id:n2000WfsCodeOf(best.f),name:best.name||link.officialName,source:'n2000',officialType:'Natura 2000',geometry:best.f.geometry,fallback:'WFS navn+koordinat'};
    }catch(e){last=e}
  }
  if(expectedCode)throw last||Error(`Fant ikke Natura 2000-geometri med SITE_CODE ${expectedCode} for «${link.officialName}»`);
  throw last||Error(`Fant ikke en sikker Natura 2000-geometri for «${link.officialName}» via sekundært navn+koordinat-oppslag`);
}

async function resolveOfficial(link,p){
  const source=(link.layer==='hab'||link.layer==='bird')?'n2000':'national';
  const base=source==='n2000'?N2REST:NVREST;
  if(link.officialId){
    const idenc=encodeURIComponent(String(link.officialId)), status=encodeURIComponent('Gällande');
    const urls=[`${base}/omrade/${idenc}/${status}/wkt`,`${base}/omrade/${idenc}/G%C3%A4llande/wkt`,`${base}/omrade/${idenc}/wkt`];
    let last;
    for(const u of urls){try{const g=parseGeometryResponse(await fetchText(u));if(g)return {id:link.officialId,name:link.officialName,source,geometry:g}}catch(e){last=e}}
    // For Natura 2000 brukes SITE_CODE som verifisering i fallbacken, men vi
    // beholder den stabile REST-flyten som førstevalg.
    if(source==='n2000')return await resolveN2000Fallback(link,p,link.officialId);
    throw last||Error(`Klarte ikke å hente geometrien for register-ID ${link.officialId}`);
  }
  const queryUrls=[`${base}/omrade?namn=${encodeURIComponent(link.officialName)}`,`${base}/omrade?name=${encodeURIComponent(link.officialName)}`];
  let candidates=[];
  for(const u of queryUrls){try{const a=unwrapList(await fetchJsonLoose(u));if(a.length){candidates=a;break}}catch(e){}}
  if(!candidates.length)candidates=await catalog(source,base);
  let ranked=candidates.map(o=>({o,score:scoreCandidate(o,link,p)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(!ranked.length)throw Error(`Fant ikke «${link.officialName}» i Naturvårdsverkets REST-data`);
  const best=ranked[0].o, id=officialIdOf(best,source), name=officialNameOf(best)||link.officialName;
  const directGeom=geomOf(best);
  if(directGeom){
    // Når REST allerede returnerer geometri beholder vi denne stabile flyten.
    return {id,name,source,geometry:directGeom};
  }
  if(id===null||id===undefined){
    if(source==='n2000')return await resolveN2000Fallback(link,p);
    throw Error(`Fant «${name}», men ingen NVR-ID ble returnert`);
  }
  const idenc=encodeURIComponent(String(id));
  const status=encodeURIComponent('Gällande');
  const urls=source==='national'?
    [`${base}/omrade/${idenc}/${status}/wkt`,`${base}/omrade/${idenc}/G%C3%A4llande/wkt`,`${base}/omrade/${idenc}/wkt`]:
    [`${base}/omrade/${idenc}/wkt`,`${base}/omrade/${idenc}/${status}/wkt`,`${base}/n2000/${idenc}/wkt`,`${base}/site/${idenc}/wkt`];
  let last;
  for(const u of urls){try{const txt=await fetchText(u);const g=parseGeometryResponse(txt);if(g)return {id,name,source,geometry:g}}catch(e){last=e}}
  if(source==='n2000')return await resolveN2000Fallback(link,p,id);
  throw last||Error(`Fant ${name} (${id}), men klarte ikke å hente geometrien`);
}


