// Swedish heritage source lookups.
const RAA_WMS='https://pub.raa.se/visning/lamningar_v1/wms';
const RAA_LAYERS=['lamningar_v1:fornlamning','lamningar_v1:mojligfornlamning','lamningar_v1:ovrkulthistlamning','lamningar_v1:ingenantikvariskbedomning','lamningar_v1:ejkulthistlamning'];
function geoPointDistKm(lat,lon,x,y){const kx=111.32*Math.cos(lat*Math.PI/180),ky=110.57;return Math.hypot((lon-x)*kx,(lat-y)*ky)}
function historicGeomDistKm(g,lat,lon){if(!g)return Infinity;if(g.type==='Point')return geoPointDistKm(lat,lon,g.coordinates[0],g.coordinates[1]);return geomDistKm(g,lat,lon)}
function historicTokens(name){
  const raw=(name||'').replace(/\s+Historic Site$/i,'').trim(),ids=[];
  const l=raw.match(/\bL\d{4}:\d+\b/i);if(l)ids.push(l[0]);
  const r=raw.match(/\b[\p{L}][\p{L}\- ]+\s\d+(?::\d+)?\b/u);if(r)ids.push(r[0].trim());
  const clean=raw.replace(/\b(fornborg|borg|borgruin|skansberget|historic site)\b/ig,' ').replace(/\s+/g,' ').trim();return {raw,ids,clean};
}
function historicScore(f,link,p){
  const pr=f.properties||{},tok=historicTokens(link.potaName||link.officialName),vals=[pr.lamningsnummer,pr.raa_nummer,pr.namn,pr.lamningsnamn,pr.lamningstyp].filter(Boolean).map(String),nv=vals.map(norm),raw=norm(tok.raw),clean=norm(tok.clean);let score=0;
  for(const id of tok.ids){const n=norm(id);if(nv.some(v=>v===n))score=Math.max(score,200);else if(nv.some(v=>v.includes(n)||n.includes(v)))score=Math.max(score,160)}
  if(raw&&nv.some(v=>v===raw))score=Math.max(score,140);if(clean&&clean.length>3){if(nv.some(v=>v===clean))score=Math.max(score,135);else if(nv.some(v=>v.includes(clean)||clean.includes(v)))score=Math.max(score,105)}
  const d=historicGeomDistKm(f.geometry,+p.latitude,+p.longitude);if(Number.isFinite(d))score+=Math.max(0,50-Math.min(50,d*25));return {score,d};
}
async function raaFeatureInfo(lat,lon,d,i,j){
  // WMS 1.3 + EPSG:4326 uses latitude,longitude axis order in BBOX.
  const bbox=[lat-d,lon-d,lat+d,lon+d].join(','),layers=RAA_LAYERS.join(',');
  const q=new URLSearchParams({SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetFeatureInfo',LAYERS:layers,QUERY_LAYERS:layers,STYLES:'',CRS:'EPSG:4326',BBOX:bbox,WIDTH:'101',HEIGHT:'101',I:String(i),J:String(j),FEATURE_COUNT:'50',INFO_FORMAT:'application/json'});
  const r=await fetch(`${RAA_WMS}?${q}`);if(!r.ok)throw Error(`RAÄ WMS svarte ${r.status}`);const ct=(r.headers.get('content-type')||'').toLowerCase(),txt=await r.text();if(!ct.includes('json')&&!txt.trim().startsWith('{'))throw Error('RAÄ WMS svarte ikke med GeoJSON');const jn=JSON.parse(txt);return (jn.features||[]).filter(f=>f&&f.geometry);
}
async function resolveHistoricSite(link,p){
  const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('POTA-referansen mangler koordinat');let all=[],last=null;
  // Query the POTA point first, then nearby pixels. This supports polygons, lines and points.
  for(const d of [0.01,0.03,0.08]){const seen=new Set();all=[];for(const xy of [[50,50],[40,50],[60,50],[50,40],[50,60],[40,40],[60,40],[40,60],[60,60]]){try{for(const f of await raaFeatureInfo(lat,lon,d,xy[0],xy[1])){const pr=f.properties||{},k=pr.id||pr.lamningsnummer||pr.raa_nummer||f.id||JSON.stringify(f.geometry);if(!seen.has(k)){seen.add(k);all.push(f)}}}catch(e){last=e}}if(all.length)break}
  if(!all.length)throw last||Error('Fant ingen kulturhistoriske lämningar ved POTA-punktet i RAÄ WMS');
  const ranked=all.map(f=>({f,...historicScore(f,link,p)})).sort((a,b)=>b.score-a.score||a.d-b.d),best=ranked[0];if(!best||best.score<45||best.d>12)throw Error('Fant ingen tilstrekkelig sikker RAÄ-match nær POTA-punktet');
  const pr=best.f.properties||{},name=pr.namn||pr.lamningsnamn||pr.raa_nummer||pr.lamningsnummer||link.officialName;
  return {id:pr.lamningsnummer||pr.raa_nummer||pr.id||best.f.id,name,source:'historic',officialType:pr.lamningstyp||pr.antikvarisk_bedomning||pr.antikvariskbedomning||'Kulturhistorisk lämning',geometry:best.f.geometry,url:pr.url||''};
}

// Egen resolver for alternative POTA-betegnelser. Denne er isolert fra den stabile
// resolveren over, slik at nye typeforsøk ikke kan påvirke parker som allerede virker.
async function resolveOfficialAuto(link,p){
  const source='national', base=NVREST;
  const queryUrls=[`${base}/omrade?namn=${encodeURIComponent(link.officialName)}`,`${base}/omrade?name=${encodeURIComponent(link.officialName)}`];
  let candidates=[];
  for(const u of queryUrls){try{const a=unwrapList(await fetchJsonLoose(u));if(a.length){candidates=a;break}}catch(e){}}
  if(!candidates.length)candidates=await catalog(source,base);
  const ranked=candidates.map(o=>{
    const a=norm(officialNameOf(o)), b=norm(link.officialName); let score=0;
    if(a===b)score=100; else if(a.includes(b)||b.includes(a))score=80; else {const A=new Set(a.split(' ')),B=new Set(b.split(' '));let n=0;for(const x of A)if(B.has(x))n++;score=n*5}
    return {o,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(!ranked.length)throw Error(`Fant ikke «${link.officialName}» i Naturvårdsverkets REST-data`);
  const best=ranked[0].o;
  const id=officialIdOf(best,source), name=officialNameOf(best)||link.officialName;
  const officialType=pick(best,['Skyddstyp','Typ','type','skyddsform','siteType'])||'';
  const directGeom=geomOf(best); if(directGeom)return {id,name,source,officialType,geometry:directGeom};
  if(id===null||id===undefined)throw Error(`Fant «${name}», men ingen NVR-ID ble returnert`);
  const idenc=encodeURIComponent(String(id)), status=encodeURIComponent('Gällande');
  const urls=[`${base}/omrade/${idenc}/${status}/wkt`,`${base}/omrade/${idenc}/G%C3%A4llande/wkt`,`${base}/omrade/${idenc}/wkt`];
  let last;
  for(const u of urls){try{const txt=await fetchText(u);const g=parseGeometryResponse(txt);if(g)return {id,name,source,officialType,geometry:g}}catch(e){last=e}}
  throw last||Error(`Fant ${name} (${id}), men klarte ikke å hente geometrien`);
}

