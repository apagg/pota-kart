// Extracted from app-core.js; preserve original functions and behavior.
const NVREST='https://geodata.naturvardsverket.se/naturvardsregistret/rest/v3';
const N2REST='https://geodata.naturvardsverket.se/n2000/rest/v3';
const restCatalogCache={national:null,n2000:null};

// Eksplisitte koblinger trumfer automatisk navnetolkning.
const OVERRIDES={
  'SE-0245':{officialName:'Kosteröarna',officialId:'2000583',layer:'nr',type:'Naturreservat',confidence:'bekreftet overstyring'},
  'SE-0266':{officialName:'Kragenäs',officialId:'2000370',layer:'nr',type:'Naturreservat',confidence:'bekreftet NVR-ID-overstyring'},
  'SE-1418':{officialName:'Tjurpannan',officialId:'SE0520187',layer:'hab',type:'Natura 2000 habitat',confidence:'bekreftet SITE_CODE'},
  'SE-1741':{officialName:'Gökstenen',layer:'auto',type:'Naturminne',recognized:true,confidence:'bekreftet navneoverstyring'}
};

// Bekreftede navnekoblinger brukes når REST-søket finner riktig navn, men ikke returnerer ID-feltet.
const NAME_OVERRIDES={
  'tanumskusten':{officialName:'Tanumskusten',officialId:'2000957',layer:'nvo',type:'Naturvårdsområde',confidence:'bekreftet navnekobling'}
};

const SUFFIX_RULES=[
  {rx:/\s+(national park)$/i,layer:'np',type:'Nationalpark'},
  {rx:/\s+(nature reserve|natural reserve)$/i,layer:'nr',type:'Naturreservat'},
  {rx:/\s+(nature conservation area|nature conservation zone|protected landscape)$/i,layer:'nvo',type:'Naturvårdsområde'},
  {rx:/\s+(cultural reserve|culture reserve|national heritage area)$/i,layer:'kr',type:'Kulturreservat'},
  {rx:/\s+(natura 2000.*|sac|sci)$/i,layer:'hab',type:'Natura 2000 habitat'},
  {rx:/\s+(spa|bird protection area)$/i,layer:'bird',type:'Natura 2000 fugl'},
  {rx:/\s+(world heritage site|world heritage)$/i,layer:'world',type:'World Heritage',recognized:true,geometryNote:'offisiell World Heritage-geometri fra Naturvårdsverket'},
  {rx:/\s+(historic site)$/i,layer:'historic',type:'Historic Site',recognized:true,geometryNote:'offisiell geometri fra Riksantikvarieämbetets Kulturhistoriska lämningar'},
  {rx:/\s+(state trail)$/i,layer:'trail',type:'State Trail',recognized:true,geometryNote:'offisiell ledgeometri fra Naturvårdsverket'},
  {rx:/\s+(heritage site)$/i,layer:'historic',type:'Historic Site',recognized:true,geometryNote:'offisiell geometri fra Riksantikvarieämbetets Kulturhistoriska lämningar'},
  {rx:/\s+(natural monument)$/i,layer:'auto',type:'Naturminne',recognized:true,geometryNote:'slås opp automatisk i Naturvårdsverkets register'},
  {rx:/\s+(national reserve)$/i,layer:'auto',type:'Automatisk svensk vernetype',recognized:true,geometryNote:'POTA-betegnelsen verifiseres mot Naturvårdsverkets faktiske objekttype'},
  {rx:/\s+(conservation reserve)$/i,layer:'auto',type:'Automatisk svensk vernetype',recognized:true,geometryNote:'POTA-betegnelsen verifiseres mot Naturvårdsverkets faktiske objekttype'},
  {rx:/\s+(nature park)$/i,layer:'auto',type:'Automatisk svensk vernetype',recognized:true,geometryNote:'POTA-betegnelsen verifiseres mot Naturvårdsverkets faktiske objekttype'},
  {rx:/\s+(park reserve)$/i,layer:'auto',type:'Automatisk svensk vernetype',recognized:true,geometryNote:'POTA-betegnelsen verifiseres mot Naturvårdsverkets faktiske objekttype'},
  {rx:/\s+(wilderness area)$/i,layer:'auto',type:'Automatisk svensk vernetype',recognized:true,geometryNote:'POTA-betegnelsen verifiseres mot Naturvårdsverkets faktiske objekttype'},
  {rx:/\s+(nature refuge)$/i,layer:'auto',type:'Automatisk svensk vernetype',recognized:true,geometryNote:'POTA-betegnelsen verifiseres mot Naturvårdsverkets faktiske objekttype'},
  {rx:/\s+(landscape area)$/i,layer:'auto',type:'Automatisk svensk vernetype',recognized:true,geometryNote:'POTA-betegnelsen verifiseres mot Naturvårdsverkets faktiske objekttype'}
];
function applyNameOverride(link){
  const o=NAME_OVERRIDES[norm(link.officialName)];
  return o?Object.assign({},link,o):link;
}
const NO_FRILUFT_KARTLAGT='https://kart.miljodirektoratet.no/arcgis/rest/services/friluftsliv_kartlagt/MapServer/0/query';
const NO_FRILUFT='https://kart.miljodirektoratet.no/arcgis/rest/services/friluftsliv_statlig_sikra/MapServer/0/query';
const NO_VERN='https://kart.miljodirektoratet.no/arcgis/rest/services/vern/FeatureServer/0/query';
const NO_KYSTSTI='https://kart.analyseabo.no/arcgis/rest/services/Turkart/RegFriluft_innsyn/MapServer/15/query';
const NO_TURWFS='https://wfs.geonorge.no/skwms1/wfs.turogfriluftsruter';
const potaParkDetailCache={};
const NO_SUFFIX_RULES=[
  {rx:/\s+(national military park|national historic site|historic site|national battlefield)$/i,type:'Kulturminnelokalitet',layer:'nokultur'},
  {rx:/\s+(national recreation area)$/i,type:'Friluftslivsområde',layer:'nofriluft'},
  {rx:/\s+(national recreation trail)$/i,type:'National Recreation Trail',layer:'notrail'},
  {rx:/\s+(national park)$/i,type:'Nasjonalpark'},
  {rx:/\s+(nature reserve|natural reserve)$/i,type:'Naturreservat'},
  {rx:/\s+(protected landscape|landscape protection area|landscape conservation area)$/i,type:'Landskapsvernområde'},
  {rx:/\s+(marine protected area|marine reserve)$/i,type:'Marint verneområde'},
  {rx:/\s+(nature conservation area|protected area)$/i,type:'Verneområde'}
];
function countryOf(p){return (p.reference||'').split('-')[0].toUpperCase()}
function inferNorwayLink(p){
  const name=(p.name||'').trim();
  const kulturId=kulturminneIdFromPota(p);
  if(kulturId)return {reference:p.reference,potaName:name,officialName:name.replace(/\s+(national military park|national historic site|historic site|national battlefield|national monument)$/i,'').trim(),officialId:kulturId,layer:'nokultur',type:'Kulturminnelokalitet',recognized:true,confidence:'Kulturminne-ID fra POTA-kildelenke'};
  const id=naturbaseFriluftId(p)|| (p.reference==='NO-3198'?'FS00000814':'');
  if(id)return {reference:p.reference,potaName:name,officialName:name.replace(/\s+national recreation area$/i,'').trim(),officialId:id,layer:'nofriluft',type:id.startsWith('FK')?'Kartlagt friluftslivsområde':'Statlig sikret friluftslivsområde',recognized:true,confidence:'Naturbase-ID fra POTA-kildelenke'};
  for(const r of NO_SUFFIX_RULES)if(r.rx.test(name))return {reference:p.reference,potaName:name,officialName:name.replace(r.rx,'').trim(),layer:r.layer||'novern',type:r.type,recognized:true,confidence:'norsk POTA-type'};
  return {reference:p.reference,potaName:name,officialName:name,layer:'novern',type:'Norsk POTA-område',recognized:true,confidence:'verifiseres mot Naturbase'};
}


function kulturminneIdFromPota(p){
  try{
    const u=new URL(p.website||'');
    if(!['http:','https:'].includes(u.protocol)||!['kulturminnesok.no','www.kulturminnesok.no'].includes(u.hostname))return '';
    const id=u.searchParams.get('id')||u.pathname.match(/^\/ra\/lokalitet\/(\d+)\/?$/)?.[1]||'';
    return /^\d+$/.test(id)?id:'';
  }catch(e){return ''}
}
async function resolveNorwayKulturminne(link,p){
  const id=link.officialId||kulturminneIdFromPota(p);
  if(!/^\d+$/.test(id))throw Error('Denne POTA-parken trenger en bekreftet Kulturminnesøk-ID før registergeometrien kan vises');
  let f,usedCache=false;
  try{
    f=await getJSON('data/kulturminner/'+encodeURIComponent(id)+'.geojson');
    usedCache=true;
  }catch(cacheError){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('https://api.ra.no/LokaliteterEnkeltminnerOgSikringssoner/collections/lokaliteter/items/'+encodeURIComponent(id)+'?f=json',{signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      f=await response.json();
    }catch(directError){throw Error('Ingen tilgjengelig lagret kulturminnegeometri for ID '+id+', og direkteoppslaget hos Riksantikvaren feilet')}
    finally{clearTimeout(timer)}
  }
  const pr=f.properties||{},g=f.geometry;
  if(f.type!=='Feature'||String(pr.kulturminneId||f.id)!==id)throw Error('Riksantikvarens svar matcher ikke den bekreftede kulturminne-ID-en');
  if(!g||!['Polygon','MultiPolygon','Point','MultiPoint','LineString','MultiLineString'].includes(g.type)||!Array.isArray(g.coordinates)||!g.coordinates.length)throw Error('Kulturminnelokaliteten mangler tilgjengelig registergeometri');
  const parts=g.type==='MultiPolygon'?g.coordinates.length:g.type==='Polygon'?1:null;
  let note='Viser Riksantikvarens registrerte kulturminnegeometri'+(parts?' ('+parts+' delområde'+(parts===1?'':'r')+')':'')+'. Avgrensningen dekker ikke nødvendigvis hele POTA-området.';
  if(usedCache)note+=' Viser lagret geometri'+(f.cacheMetadata?.verifiedDate?', verifisert '+f.cacheMetadata.verifiedDate:'')+'.';
  else note+=' Hentet direkte fra Riksantikvaren; lagret kopi er ennå ikke tilgjengelig.';
  return {source:'norway',sourceLabel:'Riksantikvarens kulturminneregister',name:pr.navn||link.officialName,id,geometry:g,officialType:'Kulturminnelokalitet',geometryNote:note};
}

function naturbaseFriluftId(p){
  try{
    const u=new URL(p.website||'');
    if(u.protocol!=='https:'||u.hostname!=='faktaark.naturbase.no')return '';
    const id=(u.searchParams.get('id')||'').toUpperCase();
    return /^(FS|FK)\d{8}$/.test(id)?id:'';
  }catch(e){return ''}
}
async function resolveNorwayFriluft(link,p){
  const id=link.officialId||naturbaseFriluftId(p);
  const kartlagt=id.startsWith('FK');
  const idField=kartlagt?'kartlagt_foid':'friluftId';
  const nameField=kartlagt?'omraadenavn':'omraadeNavn';
  const areaType=kartlagt?'Kartlagt friluftslivsområde':'Statlig sikret friluftslivsområde';
  const areaDataset=kartlagt?'kartlagte friluftslivsområder':'statlig sikrede friluftslivsområder';
  const quote=x=>String(x).replace(/'/g,"''");
  const where=id?`${idField}='${quote(id)}'`:`UPPER(${nameField})=UPPER('${quote(link.officialName)}')`;
  const params=new URLSearchParams({f:'geojson',where,outFields:`${idField},${nameField},faktaark`,returnGeometry:'true',outSR:'4326'});
  const d=await getJSON((kartlagt?NO_FRILUFT_KARTLAGT:NO_FRILUFT)+'?'+params);
  if(d.error)throw Error(d.error.message||'Naturbase returnerte en feil');
  const fs=(d.features||[]).filter(f=>{
    const pr=f.properties||{};
    return id?pr[idField]===id:norm(pr[nameField])===norm(link.officialName);
  });
  const ids=new Set(fs.map(f=>(f.properties||{})[idField]).filter(Boolean));
  if(!fs.length)throw Error('Fant ikke en verifisert kobling til '+areaDataset+' i Naturbase');
  if(ids.size!==1)throw Error('Flere områder har samme navn; en bekreftet Naturbase-ID er nødvendig');
  const polygons=[];
  for(const f of fs){
    const g=f.geometry;
    if(g?.type==='Polygon')polygons.push(g.coordinates);
    else if(g?.type==='MultiPolygon')polygons.push(...g.coordinates);
    else throw Error('Naturbase-området mangler gyldig områdegeometri');
  }
  if(!polygons.length)throw Error('Naturbase-området mangler områdegrense');
  const pr=fs[0].properties;
  return {source:'norway',sourceLabel:'Miljødirektoratets Naturbase – '+areaDataset,geometry:{type:'MultiPolygon',coordinates:polygons},name:String(pr[nameField]||link.officialName).trim(),id:pr[idField],officialType:areaType};
}

function noNameValues(pr){return [pr.navn,pr.offisieltNavn,pr.offisielt_navn].filter(Boolean).map(norm)}
function noNameMatch(expected,pr){
  const e=norm(expected);if(!e)return false;
  return noNameValues(pr).some(n=>n===e || (e.length>=6&&n.length>=6&&(n.includes(e)||e.includes(n))));
}
async function resolveNorwayOfficial(link,p){
  const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('POTA-referansen mangler gyldig posisjon');
  const params=new URLSearchParams({f:'geojson',where:'1=1',geometry:`${lon},${lat}`,geometryType:'esriGeometryPoint',inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'naturvernId,navn,offisieltNavn,verneform',returnGeometry:'true',outSR:'4326'});
  const d=await getJSON(`${NO_VERN}?${params}`), fs=(d&&d.features)||[];
  if(!fs.length)throw Error('POTA-punktet traff ikke et verifisert verneområde i Naturbase');
  let matches=fs.filter(f=>noNameMatch(link.officialName,f.properties||{}));
  if(matches.length!==1){
    // If the point hits exactly one official area, accept only when its name is still reasonably related to the POTA name.
    if(fs.length===1&&noNameMatch(p.name,fs[0].properties||{}))matches=fs;
  }
  if(matches.length!==1)throw Error(matches.length>1?'Flere Naturbase-områder matcher; ingen geometri vises uten entydig treff':'Naturbase-treffet kunne ikke verifiseres sikkert mot POTA-navnet');
  const f=matches[0],pr=f.properties||{};
  return {source:'norway',geometry:f.geometry,name:pr.offisieltNavn||pr.navn||link.officialName,id:pr.naturvernId||'',officialType:pr.verneform||link.type};
}
