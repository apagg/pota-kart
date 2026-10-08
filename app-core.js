// Hvaler trail source: hvaler_tillegg (generated from backed-up GeoPackage).
let gpsMarker=null,gpsAccuracy=null,lastGps=null,gpsWatchId=null,gpsGeneration=0,gpsFollowing=false;
function gpsIcon(){return L.divIcon({className:'',html:'<div class="gps-marker" aria-label="Min posisjon"></div>',iconSize:[18,18],iconAnchor:[9,9]})}
function gpsInsideSelected(lat,lon){
  if(typeof turf==='undefined')return[];const pt=turf.point([lon,lat]),hits=[];
  const entries=[...selectedParks];
  if(!multiMode.checked&&lastSelectedRef&&selectedGeo)entries.push([lastSelectedRef,{geo:selectedGeo,link:linkTable[lastSelectedRef]}]);
  for(const [ref,x] of entries){if(!x.geo)continue;let hit=false;
    for(const f of featuresOfGeoJson(x.geo.toGeoJSON())){const g=f.geometry;if(!g)continue;try{
      if(g.type==='Polygon'||g.type==='MultiPolygon')hit=turf.booleanPointInPolygon(pt,f);
      else if(isTrailLink(x.link)&&(g.type==='LineString'||g.type==='MultiLineString')){const b=turf.buffer(f,TRAIL_BUFFER_M/1000,{units:'kilometers',steps:12});hit=!!b&&turf.booleanPointInPolygon(pt,b)}
    }catch(e){}if(hit)break}
    if(hit)hits.push(ref);
  }return hits;
}
function updateGpsStatus(lat,lon,accuracy){
  const hits=gpsInsideSelected(lat,lon);gpsStatus.classList.add('visible');
  gpsStatus.innerHTML=`<b>GPS:</b> ${lat.toFixed(5)}, ${lon.toFixed(5)}${Number.isFinite(accuracy)?` · nøyaktighet ca. ${Math.round(accuracy)} m`:''}${hits.length?`<br><b>Innenfor valgt POTA:</b> ${hits.map(esc).join(', ')}`:'<br>Ikke innenfor noen valgt POTA-geometri.'}`;
}
function syncGpsControl(waiting=false){
  const active=gpsWatchId!==null;
  locateBtn.disabled=false;locateBtn.classList.toggle('locating',active&&waiting);locateBtn.classList.toggle('gps-active',active);
  const state=active?(gpsFollowing?'following':'paused'):'off';
  locateBtn.dataset.gpsState=state;
  locateBtn.textContent=active?(gpsFollowing?'Stopp GPS':'Følg posisjon'):'Min posisjon';locateBtn.setAttribute('aria-pressed',String(active));
  locateBtn.title=active?(gpsFollowing?'GPS følger posisjonen – trykk for å slå av GPS':'GPS er på, følging er pauset – trykk for å følge igjen'):'Slå på GPS og følg posisjonen';
  document.dispatchEvent(new CustomEvent('pota:gps',{detail:{active,following:active&&gpsFollowing,waiting:active&&waiting}}));
}
function stopGps(){
  gpsGeneration++;
  if(gpsWatchId!==null)navigator.geolocation.clearWatch(gpsWatchId);
  gpsWatchId=null;lastGps=null;gpsFollowing=false;
  if(gpsMarker)map.removeLayer(gpsMarker);if(gpsAccuracy)map.removeLayer(gpsAccuracy);
  gpsMarker=null;gpsAccuracy=null;syncGpsControl();updateGpsParkColors();
}
function locateUser(){
  if(gpsWatchId!==null){
    if(!gpsFollowing){gpsFollowing=true;if(lastGps)map.panTo([lastGps.lat,lastGps.lon],{animate:false});syncGpsControl(!lastGps);return}
    stopGps();gpsStatus.textContent='GPS er slått av.';return;
  }
  gpsStatus.classList.add('visible');
  if(!navigator.geolocation){gpsStatus.textContent='GPS/geolokasjon støttes ikke av denne nettleseren.';return}
  const generation=++gpsGeneration;let firstPosition=true;gpsFollowing=true;
  gpsStatus.textContent='Henter posisjon…';
  const fail=err=>{
    if(generation!==gpsGeneration)return;
    if(err.code===1){stopGps();gpsStatus.textContent='Posisjonstilgang er avslått. Tillat posisjon i nettleseren og trykk Min posisjon igjen.';return}
    syncGpsControl();gpsStatus.textContent='Venter på GPS-posisjon. '+(lastGps?'Siste posisjon vises i kartet. ':'')+'Oppfølgingen fortsetter.';
  };
  try{
    gpsWatchId=navigator.geolocation.watchPosition(pos=>{
      if(generation!==gpsGeneration)return;
      const {latitude:lat,longitude:lon,accuracy}=pos.coords;lastGps={lat,lon,accuracy};
      const radius=Number.isFinite(accuracy)?Math.max(0,accuracy):0;
      if(gpsAccuracy)gpsAccuracy.setLatLng([lat,lon]).setRadius(radius);
      else gpsAccuracy=L.circle([lat,lon],{pane:'overlapPane',radius,color:'#2563eb',weight:1,fillColor:'#60a5fa',fillOpacity:.08,interactive:false}).addTo(map);
      if(gpsMarker)gpsMarker.setLatLng([lat,lon]);
      else gpsMarker=L.marker([lat,lon],{pane:'gpsPane',icon:gpsIcon(),zIndexOffset:1000}).addTo(map).bindTooltip('Min posisjon',{pane:'topTooltipPane',direction:'top',offset:[0,-8],className:'pota-hover-tooltip'});
      if(gpsFollowing){if(firstPosition&&map.getZoom()<12)map.setView([lat,lon],14);else map.panTo([lat,lon],{animate:false})}
      firstPosition=false;
      syncGpsControl();updateGpsStatus(lat,lon,accuracy);updateGpsParkColors();
    },fail,{enableHighAccuracy:true,timeout:15000,maximumAge:0});
    syncGpsControl(true);
  }catch(err){stopGps();gpsStatus.textContent='Kunne ikke starte GPS. Sjekk nettleserens posisjonstilgang.'}
}
map.on('dragstart',()=>{if(gpsWatchId!==null&&gpsFollowing){gpsFollowing=false;syncGpsControl(!lastGps)}});
locateBtn.addEventListener('click',locateUser);syncGpsControl();
// Refresh membership when the user changes the selection without moving.
document.addEventListener('pota:selection',()=>{if(lastGps)updateGpsStatus(lastGps.lat,lastGps.lon,lastGps.accuracy);updateGpsParkColors()});
function rawPolygonClippingInputFromLayer(layer){
  if(!layer||!layer.toGeoJSON)return [];
  const gj=layer.toGeoJSON(), polys=[];
  function addGeometry(g){
    if(!g)return;
    if(g.type==='Polygon'){polys.push(g.coordinates);return}
    if(g.type==='MultiPolygon'){for(const p of g.coordinates||[])polys.push(p);return}
    if(g.type==='GeometryCollection')for(const part of g.geometries||[])addGeometry(part);
  }
  function add(x){
    if(!x)return;
    if(x.type==='FeatureCollection'){for(const f of x.features||[])add(f);return}
    if(x.type==='Feature'){addGeometry(x.geometry);return}
    addGeometry(x);
  }
  add(gj);return polys;
}
function topologicalPolygonsFromLayer(layer){
  const encoded=rawPolygonClippingInputFromLayer(layer), polygons=[];
  let sourceRings=0;
  for(const coords of encoded){
    sourceRings+=coords.length;
    const rebuilt=reconstructPolygonRings(coords);
    for(const p of rebuilt)polygons.push(p);
  }
  return {encoded,polygons,sourceRings};
}
function rawLayerGeometryInfo(layer){
  const topo=topologicalPolygonsFromLayer(layer);
  let rings=0,holes=0,areaM2=0;
  for(const coords of topo.polygons){
    rings+=coords.length;
    holes+=Math.max(0,coords.length-1);
    if(typeof turf!=='undefined'){
      try{areaM2+=turf.area({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:coords}})||0}catch(e){}
    }
  }
  return {polygons:topo.polygons,rings,holes,areaHa:areaM2/10000,encodedPolygons:topo.encoded.length,sourceRings:topo.sourceRings};
}
function polygonFeaturesFromLayer(layer){
  const r=rawLayerGeometryInfo(layer);
  return r.polygons.map(coords=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:coords}}));
}
function isSelectedTrail(x){return !!(x&&x.link&&isTrailLink(x.link));}
function lineFeaturesFromLayer(layer){
  const out=[];
  if(!layer||!layer.toGeoJSON)return out;
  const gj=layer.toGeoJSON();
  function walk(o){
    if(!o)return;
    if(o.type==='FeatureCollection'){for(const f of o.features||[])walk(f);return;}
    if(o.type==='Feature'){walk(o.geometry);return;}
    if(o.type==='GeometryCollection'){for(const g of o.geometries||[])walk(g);return;}
    if(o.type==='LineString'&&Array.isArray(o.coordinates)&&o.coordinates.length>1){out.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:o.coordinates}});return;}
    if(o.type==='MultiLineString'){for(const c of o.coordinates||[])if(c&&c.length>1)out.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:c}});}
  }
  walk(gj);return out;
}
function trailCorridorPolygonsFromLayer(layer){
  if(typeof turf==='undefined')return [];
  const polys=[];
  for(const line of lineFeaturesFromLayer(layer)){
    try{
      const b=turf.buffer(line,TRAIL_BUFFER_M/1000,{units:'kilometers',steps:12});
      if(!b)continue;
      const g=b.type==='Feature'?b.geometry:b;
      if(!g)continue;
      if(g.type==='Polygon')polys.push(g.coordinates);
      else if(g.type==='MultiPolygon')for(const c of g.coordinates||[])if(c&&c.length)polys.push(c);
    }catch(e){}
  }
  return polys;
}
function isKyststienPark(p){
  return /^(NO|LA)-2542$/i.test((p&&p.reference)||'')||/kyststien/i.test((p&&p.name)||'');
}
function addKyststienCorridor(layer){
  // Samme geometri og radius som GPS-sjekk og overlappsberegning: 30,5 m på hver side.
  const polygons=trailCorridorPolygonsFromLayer(layer);
  if(!polygons.length)throw Error('Kunne ikke beregne Kyststiens 61 meter brede belte');
  const corridor=L.geoJSON({type:'Feature',properties:{corridorWidthM:TRAIL_CORRIDOR_WIDTH_M},geometry:{type:'MultiPolygon',coordinates:polygons}},{
    pane:'trailCorridorPane',interactive:false,
    style:{color:'#1d4ed8',weight:1,opacity:.65,fillColor:'#1d4ed8',fillOpacity:.28}
  });
  // Beltet følger stiens livsløp ved flervalg, fjerning og bytte av park.
  layer.addLayer(corridor);
}
function overlapPolygonsForSelected(x){
  return isSelectedTrail(x)?trailCorridorPolygonsFromLayer(x&&x.geo):rawLayerGeometryInfo(x&&x.geo).polygons;
}
function overlapAreaHaForPolygons(polygons){
  if(typeof turf==='undefined')return 0;
  let area=0;
  for(const coords of polygons||[])try{area+=turf.area({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:coords}})||0}catch(e){}
  return area/10000;
}
function selectedGeometryMeta(x){
  const raw=rawLayerGeometryInfo(x&&x.geo);
  const trail=isSelectedTrail(x);
  const corridorPolygons=trail?trailCorridorPolygonsFromLayer(x&&x.geo):[];
  const types=new Set(), ids=new Set();
  if(x&&x.geo&&x.geo.toGeoJSON){
    const gj=x.geo.toGeoJSON();
    function walk(o){
      if(!o)return;
      if(o.type==='FeatureCollection'){for(const f of o.features||[])walk(f);return}
      if(o.type==='Feature'){
        if(o.geometry&&o.geometry.type)types.add(o.geometry.type);
        const pr=o.properties||{};for(const k of ['id','NVRID','Nvrid','nvrid','SITE_CODE','site_code','Omradeskod'])if(pr[k]!=null&&pr[k]!=='')ids.add(String(pr[k]));
        return;
      }
      if(o.type)types.add(o.type);
    }
    walk(gj);
  }
  const l=x&&x.link||{};
  for(const v of [l.officialId,l.siteCode,l.site_code])if(v!=null&&v!=='')ids.add(String(v));
  return {features:trail?corridorPolygons.map(coords=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:coords}})):polygonFeaturesFromLayer(x&&x.geo),raw,areaHa:trail?overlapAreaHaForPolygons(corridorPolygons):raw.areaHa,types:[...types],ids:[...ids],trail,corridorPolygons};
}
function pairOverlapGeometry(a,b){
  if(typeof polygonClipping==='undefined')return {geometry:null,rawParts:0,pairsHit:0,error:'polygon-clipping mangler'};
  const A=overlapPolygonsForSelected(a), B=overlapPolygonsForSelected(b);
  if(!A.length||!B.length)return {geometry:null,rawParts:0,pairsHit:0,error:null};
  const pieces=[];let pairsHit=0;
  try{
    for(const pa of A){
      for(const pb of B){
        const out=polygonClipping.intersection(pa,pb);
        if(!out||!out.length)continue;
        pairsHit++;
        for(const poly of out){if(poly&&poly.length)pieces.push(poly)}
      }
    }
    if(!pieces.length)return {geometry:null,rawParts:0,pairsHit,error:null};
    return {geometry:{type:'Feature',properties:{},geometry:{type:'MultiPolygon',coordinates:pieces}},rawParts:pieces.length,pairsHit,error:null};
  }catch(e){
    return {geometry:null,rawParts:0,pairsHit,error:e&&e.message?e.message:String(e)};
  }
}
function pairOverlapInfo(a,b){
  const ma=selectedGeometryMeta(a), mb=selectedGeometryMeta(b), r=pairOverlapGeometry(a,b);
  let areaM2=0;
  if(r.geometry&&typeof turf!=='undefined'){
    for(const coords of r.geometry.geometry.coordinates||[]){
      try{areaM2+=turf.area({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:coords}})||0}catch(e){}
    }
  }
  const areaHa=areaM2/10000;
  const maxAllowed=Math.min(ma.areaHa,mb.areaHa);
  const invalid=Number.isFinite(areaHa)&&Number.isFinite(maxAllowed)&&areaHa>maxAllowed+0.01;
  return {areaHa,parts:r.rawParts,pairsHit:r.pairsHit,geometry:r.geometry,invalid,maxAllowed};
}
function fmtHa(v){if(!Number.isFinite(v))return '–';if(v>=100)return v.toLocaleString('nb-NO',{maximumFractionDigits:1});if(v>=1)return v.toLocaleString('nb-NO',{maximumFractionDigits:2});return v.toLocaleString('nb-NO',{maximumFractionDigits:3})}
function updateSelectionDiagnostics(){
  const el=document.getElementById('overlapDiag');if(!el)return;
  const vals=[...selectedParks.values()];
  if(!vals.length){el.innerHTML='<b>Valg-/overlappsdiagnostikk</b><br>Velg minst én park for å vise geometriinformasjon.';return}
  let h='<b>Valg-/overlappsdiagnostikk</b><br><span class="small">Parkareal bruker rekonstruert ringtopologi. Stier behandles som en 61 m bred korridor (30,5 m på hver side) ved overlappsberegning.</span>';
  h+='<div style="margin-top:6px">'+vals.map(x=>{const m=selectedGeometryMeta(x);const id=m.ids.length?m.ids.join(', '):'ikke oppgitt';const typ=!x.geo?'geometri kunne ikke lastes':m.types.length?m.types.join(', '):'ukjent';const area=!x.geo?'ikke tilgjengelig':m.features.length?`${fmtHa(m.areaHa)} ha`:'ikke polygon';const topo=!x.geo?'':m.trail?` · Overlappskorridor: <b>${TRAIL_CORRIDOR_WIDTH_M} m</b>`:(m.raw?` · Kilde: ${m.raw.encodedPolygons} kodet polygon, ${m.raw.sourceRings} rå ringer → rekonstruert: ${m.raw.polygons.length} delpolygon${m.raw.polygons.length===1?'':'er'}, ${m.raw.rings} ringer, ${m.raw.holes} hull`:'');const areaLabel=m.trail?'Korridorareal':'Areal';return `<div style="margin:4px 0"><b>${esc(x.p.reference)}</b> – ${esc(x.p.name)}<br>ID/kode: ${esc(id)} · Geometri: ${esc(typ)} · ${areaLabel}: <b>${esc(area)}</b>${topo}</div>`}).join('')+'</div>';
  if(vals.length>=2){
    h+='<div style="margin-top:7px"><b>Parvis overlapp</b>';
    for(let i=0;i<vals.length;i++)for(let j=i+1;j<vals.length;j++){const o=pairOverlapInfo(vals[i],vals[j]);const warn=o.invalid?` <span class="warn">⚠ ugyldig: større enn minste park (${fmtHa(o.maxAllowed)} ha)</span>`:'';h+=`<br>${esc(vals[i].p.reference)} × ${esc(vals[j].p.reference)}: <b>${fmtHa(o.areaHa)} ha</b> (${o.parts} overlappspolygon${o.parts===1?'':'er'} fra ${o.pairsHit} treffende delpolygonpar, rekonstruert ringtopologi / 61 m stikorridor ved ruteoverlapp)${warn}`}
    h+='</div>';
  }
  el.innerHTML=h;
}

const potaActivationCache=new Map();
function getPotaActivationCount(ref){
  const cached=potaActivationCache.get(ref);
  if(cached&&cached.expires>Date.now())return cached.promise;
  const entry={expires:Date.now()+300000,promise:null};
  entry.promise=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(`https://api.pota.app/park/stats/${encodeURIComponent(ref)}`,{signal:controller.signal});
      if(!response.ok)throw Error('POTA-statistikk kunne ikke hentes');
      const stats=await response.json(),raw=stats.activations;
      const count=(typeof raw==='number'||(typeof raw==='string'&&raw.trim()!==''))?Number(raw):NaN;
      if((stats.reference&&stats.reference!==ref)||!Number.isSafeInteger(count)||count<0)throw Error('Ugyldig aktiveringstall');
      return count;
    }catch(e){entry.expires=Date.now()+60000;return null}
    finally{clearTimeout(timer)}
  })();
  potaActivationCache.set(ref,entry);return entry.promise;
}
function openParkInfo(p,link,latlng=null){
  const potaLink=`<a href="https://pota.app/#/park/${encodeURIComponent(p.reference)}" target="_blank" rel="noopener noreferrer">Åpne parken på pota.app</a>`;
  const content=`<b>${esc(p.reference)} – ${esc(p.name)}</b><br><b>Antall aktiveringer:</b> <span data-pota-activation-count aria-live="polite">Henter …</span><br>${potaLink}`;
  linkbox.style.display='block';linkbox.innerHTML=content;
  const countNodes=[linkbox.querySelector('[data-pota-activation-count]')];
  if(latlng&&!matchMedia('(max-width:700px)').matches){
    const popupContent=document.createElement('div');popupContent.innerHTML=content;
    countNodes.push(popupContent.querySelector('[data-pota-activation-count]'));
    L.popup({autoPan:false}).setLatLng(latlng).setContent(popupContent).openOn(map);
  }
  getPotaActivationCount(p.reference).then(count=>{
    const text=count===null?'ikke tilgjengelig':count.toLocaleString('nb-NO');
    for(const node of countNodes)node.textContent=text;
  });
  document.dispatchEvent(new CustomEvent('pota:park',{detail:{p,link}}));
}
function reopenSelectedPark(ref,latlng=null){
  const x=selectedParks.get(ref);if(!x)return;
  lastSelectedRef=ref;openParkInfo(x.p,x.link,latlng||x.marker?.getLatLng()||null);
}
function bindSelectedGeometry(layer,p,link){
  if(!layer||!layer.on)return;
  bindParkGeometryHover(layer,p);
  layer.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);atlasPick(e.latlng,p.reference)});
}
function openOverlapChooser(refs,latlng){
  const uniq=[...new Set(refs)].filter(r=>selectedParks.has(r));if(!uniq.length)return;
  if(uniq.length===1){reopenSelectedPark(uniq[0],latlng);return}
  const box=document.createElement('div');
  const title=document.createElement('b');title.textContent='Velg POTA-park';box.appendChild(title);
  for(const ref of uniq){const x=selectedParks.get(ref);const b=document.createElement('button');b.type='button';b.style.cssText='display:block;width:100%;margin-top:6px;text-align:left';b.textContent=`${ref} – ${x.p.name}`;b.onclick=()=>{map.closePopup();reopenSelectedPark(ref,latlng)};box.appendChild(b)}
  L.popup({autoPan:false}).setLatLng(latlng).setContent(box).openOn(map);
}
function updateOverlaps(){
  updateSelectionDiagnostics();
}
const NVREST='https://geodata.naturvardsverket.se/naturvardsregistret/rest/v3';
const N2REST='https://geodata.naturvardsverket.se/n2000/rest/v3';
const restCatalogCache={national:null,n2000:null};

function norm(s){return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function getJSON(url){const r=await fetch(url);if(!r.ok)throw Error(r.status+' '+r.statusText);return r.json()}

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
function trailCoordPair(a,b){
  // WFS EPSG:4326 uses latitude/longitude axis order. Convert to GeoJSON [lon,lat].
  if(Math.abs(a)>40&&Math.abs(b)<40)return [b,a];
  return [a,b];
}
function parseKartverketTrailGml(xml){
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.getElementsByTagName('parsererror').length)throw Error('Kartverkets Turrutebase svarte med ugyldig XML');
  const ex=[...doc.getElementsByTagNameNS('*','ExceptionReport'),...doc.getElementsByTagNameNS('*','Exception')];
  if(ex.length)throw Error('Kartverkets Turrutebase returnerte en WFS-feil');
  let members=[...doc.getElementsByTagNameNS('*','member')];
  if(!members.length)members=[...doc.getElementsByTagNameNS('*','featureMember')];
  const out=[];
  for(const m of members){
    const feat=[...m.children].find(x=>x.nodeType===1);if(!feat)continue;
    const texts=[];
    for(const el of feat.querySelectorAll('*')){
      if(el.children.length===0 && !['poslist','pos','coordinates'].includes((el.localName||'').toLowerCase())){
        const v=(el.textContent||'').trim();if(v)texts.push({key:el.localName||'',value:v});
      }
    }
    const lines=[];
    for(const el of feat.querySelectorAll('*')){
      if((el.localName||'').toLowerCase()!=='poslist')continue;
      const nums=(el.textContent||'').trim().split(/\s+/).map(Number).filter(Number.isFinite);
      const line=[];for(let i=0;i+1<nums.length;i+=2){const c=trailCoordPair(nums[i],nums[i+1]);if(Math.abs(c[0])<=180&&Math.abs(c[1])<=90)line.push(c)}
      if(line.length>1)lines.push(line);
    }
    if(!lines.length){
      const pts=[];
      for(const el of feat.querySelectorAll('*'))if((el.localName||'').toLowerCase()==='pos'){
        const a=(el.textContent||'').trim().split(/\s+/).map(Number);if(a.length>=2&&a.every(Number.isFinite))pts.push(trailCoordPair(a[0],a[1]));
      }
      if(pts.length>1)lines.push(pts);
    }
    if(lines.length)out.push({texts,lines});
  }
  return out;
}
function trailText(c){return c.texts.map(x=>x.value).join(' ')}
function trailField(c,rx){return c.texts.find(x=>rx.test((x.key||'').toLowerCase()))?.value||''}
function uniqueStrings(a){return [...new Set((a||[]).map(x=>(x||'').toString().trim()).filter(Boolean))]}
function cleanTrailAlias(s){
  return (s||'').toString().replace(/^https?:\/\//i,'').replace(/[?#].*$/,'').replace(/\.(html?|php|aspx?|pdf|gpx|kml)$/i,'').replace(/[_+]+/g,' ').replace(/[-/]+/g,' ').replace(/\b(national|recreation|trail|route|rute|tursti|turløype|turrute|sti|stien|official|map|kart|page|web)\b/gi,' ').replace(/\s+/g,' ').trim();
}
function aliasesFromUrl(u){
  const out=[];try{const x=new URL(u);const seg=x.pathname.split('/').filter(Boolean).map(decodeURIComponent);for(const z of seg.slice(-3)){const a=cleanTrailAlias(z);if(a.length>=4&&!/^\d+$/.test(a))out.push(a)}for(const [k,v] of x.searchParams){if(/name|route|rute|trail|sti|title/i.test(k)){const a=cleanTrailAlias(v);if(a.length>=4)out.push(a)}}}catch(e){}return out;
}
function extractPotaDetailHints(d){
  const urls=[],aliases=[];
  function walk(v,key='',depth=0){
    if(depth>7||v==null)return;
    if(typeof v==='string'){
      const t=v.trim();if(/^https?:\/\//i.test(t)){urls.push(t);aliases.push(...aliasesFromUrl(t));}
      else if(t.length>=4&&t.length<=180&&/name|title|label|description|website|url|link|route|trail|rute|sti|park/i.test(key)){const a=cleanTrailAlias(t);if(a.length>=4)aliases.push(a)}
    }else if(Array.isArray(v)){for(const x of v)walk(x,key,depth+1)}
    else if(typeof v==='object'){for(const [k,x] of Object.entries(v))walk(x,k,depth+1)}
  }
  walk(d);return {urls:uniqueStrings(urls),aliases:uniqueStrings(aliases)};
}
async function getPotaParkDetail(ref){
  if(potaParkDetailCache[ref]!==undefined)return potaParkDetailCache[ref];
  try{const d=await getJSON(`https://api.pota.app/park/${encodeURIComponent(ref)}`);return potaParkDetailCache[ref]=d}catch(e){potaParkDetailCache[ref]=null;return null}
}
async function getPotaTrailHints(p,link){
  const aliases=[link.officialName,p.name];let urls=[];
  const d=await getPotaParkDetail(p.reference);if(d){const h=extractPotaDetailHints(d);aliases.push(...h.aliases);urls=h.urls}
  // Behold kun nyttige og forholdsvis konkrete aliaser.
  const clean=uniqueStrings(aliases.map(cleanTrailAlias)).filter(x=>x.length>=4&&x.length<=100);
  return {aliases:clean,urls};
}
function tokenScore(text,alias){
  const a=norm(alias),t=norm(text);if(!a||!t)return 0;if(t.includes(a))return 125;
  const stop=new Set(['national','recreation','trail','route','rute','sti','stien','the','og','del','fra','til']);
  const toks=a.split(' ').filter(x=>x.length>=3&&!stop.has(x));if(!toks.length)return 0;let hits=0;for(const x of toks)if(t.includes(x))hits++;
  let sc=hits*20;if(hits===toks.length)sc+=45;else if(hits>=2)sc+=15;return sc;
}
function trailScore(c,expected,lat,lon,aliases=[]){
  const t=trailText(c);let score=tokenScore(t,expected);for(const a of aliases)score=Math.max(score,tokenScore(t,a));
  if(typeof turf!=='undefined'){
    let best=Infinity;for(const line of c.lines)try{best=Math.min(best,turf.pointToLineDistance(turf.point([lon,lat]),turf.lineString(line),{units:'kilometers'}))}catch(e){}
    if(best<.2)score+=75;else if(best<1)score+=50;else if(best<3)score+=25;else if(best<8)score+=8;else if(best>15)score-=35;c.distanceKm=best;
  }
  return score;
}
async function fetchKartverketTrailType(typeName,lat,lon,delta=.6){
  const bbox=`${lat-delta},${lon-delta},${lat+delta},${lon+delta},urn:ogc:def:crs:EPSG::4326`;
  const params=new URLSearchParams({service:'WFS',version:'2.0.0',request:'GetFeature',typeNames:typeName,bbox,count:'2500'});
  const r=await fetch(`${NO_TURWFS}?${params}`);if(!r.ok)throw Error(`Turrutebase HTTP ${r.status}`);return parseKartverketTrailGml(await r.text());
}
function cqlQuote(v){return String(v).replace(/'/g,"''")}
async function fetchKartverketTrailCql(typeName,cql,count='6000'){
  const params=new URLSearchParams({service:'WFS',version:'2.0.0',request:'GetFeature',typeNames:typeName,CQL_FILTER:cql,count});
  const r=await fetch(`${NO_TURWFS}?${params}`);if(!r.ok)throw Error(`Turrutebase HTTP ${r.status}`);return parseKartverketTrailGml(await r.text());
}
async function expandTrailByCanonicalFields(typeName,best){
  const rutenr=trailField(best,/rutenummer|rute.?nr|route.?number/), rutenavn=trailField(best,/^rutenavn$|rute.?navn|route.?name/);
  for(const [field,val] of [['rutenummer',rutenr],['rutenavn',rutenavn]])if(val){try{const a=await fetchKartverketTrailCql(typeName,`${field}='${cqlQuote(val)}'`);if(a.length)return a}catch(e){}}
  return [];
}
async function findTrailSegmentsFromPotaAliases(typeNames,hints){
  const out=[];const seen=new Set();
  // POTA-kildelenker kan beskrive flere delstrekninger. Prøv de mest konkrete aliasene globalt.
  const aliases=hints.aliases.filter(a=>a.length>=5).sort((a,b)=>b.length-a.length).slice(0,12);
  for(const a of aliases){
    const token=norm(a).split(' ').filter(x=>x.length>=4).slice(0,4).join(' ');if(!token)continue;
    for(const typ of typeNames){
      try{const rows=await fetchKartverketTrailCql(typ,`rutenavn ILIKE '%${cqlQuote(token)}%'`,'2500');for(const c of rows){const k=trailText(c)+'|'+JSON.stringify(c.lines[0]?.[0]||[]);if(!seen.has(k)){seen.add(k);out.push({c,typeName:typ})}}}catch(e){}
    }
  }
  return out;
}

function linesFromGeoJSONAny(d){
  const out=[];
  function addGeom(g,props={}){
    if(!g)return;
    if(g.type==='LineString'&&Array.isArray(g.coordinates)&&g.coordinates.length>1)out.push({line:g.coordinates,props});
    else if(g.type==='MultiLineString')for(const a of g.coordinates||[])if(a&&a.length>1)out.push({line:a,props});
    else if(g.type==='GeometryCollection')for(const x of g.geometries||[])addGeom(x,props);
  }
  if(!d)return out;
  if(d.type==='FeatureCollection')for(const f of d.features||[])addGeom(f.geometry,f.properties||{});
  else if(d.type==='Feature')addGeom(d.geometry,d.properties||{});
  else if(d.type&&d.coordinates)addGeom(d,{});
  else if(Array.isArray(d.features))for(const f of d.features)addGeom(f.geometry,f.properties||{});
  return out;
}
function parseGpxLines(txt){
  const doc=new DOMParser().parseFromString(txt,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Ugyldig GPX');
  const out=[];
  for(const seg of doc.querySelectorAll('trkseg')){const line=[];for(const pt of seg.querySelectorAll('trkpt')){const lat=+pt.getAttribute('lat'),lon=+pt.getAttribute('lon');if(Number.isFinite(lat)&&Number.isFinite(lon))line.push([lon,lat])}if(line.length>1)out.push({line,props:{name:seg.closest('trk')?.querySelector(':scope > name')?.textContent||''}})}
  for(const rte of doc.querySelectorAll('rte')){const line=[];for(const pt of rte.querySelectorAll('rtept')){const lat=+pt.getAttribute('lat'),lon=+pt.getAttribute('lon');if(Number.isFinite(lat)&&Number.isFinite(lon))line.push([lon,lat])}if(line.length>1)out.push({line,props:{name:rte.querySelector(':scope > name')?.textContent||''}})}
  return out;
}
function parseKmlLines(txt){
  const doc=new DOMParser().parseFromString(txt,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Ugyldig KML');
  const out=[];for(const ls of doc.querySelectorAll('LineString')){const c=ls.querySelector('coordinates');if(!c)continue;const line=(c.textContent||'').trim().split(/\s+/).map(x=>x.split(',').slice(0,2).map(Number)).filter(a=>a.length===2&&a.every(Number.isFinite));if(line.length>1)out.push({line,props:{name:ls.closest('Placemark')?.querySelector(':scope > name')?.textContent||''}})}return out;
}
function sourceFeatureText(x){return Object.values(x.props||{}).filter(v=>typeof v==='string'||typeof v==='number').join(' ')}
function lineDistanceKm(line,lat,lon){if(typeof turf==='undefined')return Infinity;try{return turf.pointToLineDistance(turf.point([lon,lat]),turf.lineString(line),{units:'kilometers'})}catch(e){return Infinity}}
function pickDirectSourceLines(items,hints,lat,lon){
  if(!items.length)return [];
  const scored=items.map(x=>{const t=sourceFeatureText(x);let ns=0;for(const a of hints.aliases||[])ns=Math.max(ns,tokenScore(t,a));const d=lineDistanceKm(x.line,lat,lon);let score=ns;if(d<.2)score+=80;else if(d<1)score+=55;else if(d<3)score+=30;else if(d<10)score+=12;else if(d>30)score-=40;return {...x,score,d}}).sort((a,b)=>b.score-a.score);
  const best=scored[0];if(!best)return [];
  // Direkte GPX/KML-lenker kan mangle metadata; nærhet alene er da nok. Brede GIS-lag krever navn eller tydelig nærhet.
  const threshold=best.score>=45?Math.max(25,best.score-45):best.d<3?0:45;
  return scored.filter(x=>x.score>=threshold&&(x.d<40||x.score>=70));
}
function isArcGisLayerUrl(u){return /\/(FeatureServer|MapServer)\/\d+(?:\/?(?:query)?)?(?:\?|$)/i.test(u)}
function arcGisQueryUrl(u){
  const x=new URL(u);x.hash='';x.search='';let path=x.pathname.replace(/\/$/,'');if(!/\/query$/i.test(path))path+='/query';x.pathname=path;
  x.search=new URLSearchParams({f:'geojson',where:'1=1',outFields:'*',returnGeometry:'true',outSR:'4326',resultRecordCount:'5000'}).toString();return x.toString();
}
function candidateGeometryLinksFromHtml(html,base){
  const out=[];let doc;try{doc=new DOMParser().parseFromString(html,'text/html')}catch(e){return out}
  for(const el of doc.querySelectorAll('a[href],link[href],iframe[src],script[src]')){const raw=el.getAttribute('href')||el.getAttribute('src')||'';try{const u=new URL(raw,base).toString();if(/\.(gpx|kml|geojson|json)(?:[?#]|$)/i.test(u)||/\/(FeatureServer|MapServer)\/\d+/i.test(u))out.push(u)}catch(e){}}
  const rx=/https?:\/\/[^\s"'<>]+/gi;for(const m of html.match(rx)||[]){const u=m.replace(/&amp;/g,'&');if(/\.(gpx|kml|geojson|json)(?:[?#]|$)/i.test(u)||/\/(FeatureServer|MapServer)\/\d+/i.test(u))out.push(u)}
  return uniqueStrings(out).slice(0,30);
}
async function fetchDirectTrailUrl(u,hints,lat,lon,depth=0){
  const clean=u.replace(/\\u0026/g,'&');
  try{
    if(isArcGisLayerUrl(clean)){const d=await getJSON(arcGisQueryUrl(clean));return pickDirectSourceLines(linesFromGeoJSONAny(d),hints,lat,lon)}
    const r=await fetch(clean,{headers:{'Accept':'application/geo+json, application/json, application/gpx+xml, application/vnd.google-earth.kml+xml, text/html, application/xml, text/xml, */*'}});if(!r.ok)throw Error(`HTTP ${r.status}`);
    const ct=(r.headers.get('content-type')||'').toLowerCase(), txt=await r.text();
    if(/\.gpx(?:[?#]|$)/i.test(clean)||ct.includes('gpx'))return pickDirectSourceLines(parseGpxLines(txt),hints,lat,lon);
    if(/\.kml(?:[?#]|$)/i.test(clean)||ct.includes('kml'))return pickDirectSourceLines(parseKmlLines(txt),hints,lat,lon);
    if(/geo\+json|application\/json/.test(ct)||/\.(geojson|json)(?:[?#]|$)/i.test(clean)){try{return pickDirectSourceLines(linesFromGeoJSONAny(JSON.parse(txt)),hints,lat,lon)}catch(e){}}
    if(depth<1&&(ct.includes('html')||/^\s*<!doctype|^\s*<html/i.test(txt))){const links=candidateGeometryLinksFromHtml(txt,clean);let out=[];for(const v of links){try{out.push(...await fetchDirectTrailUrl(v,hints,lat,lon,depth+1))}catch(e){}}return out}
  }catch(e){}
  return [];
}
async function resolvePotaSourceTrail(link,p){
  const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('POTA-referansen mangler gyldig posisjon');
  const hints=await getPotaTrailHints(p,link);if(!hints.urls.length)throw Error('POTA oppga ingen eksterne kildelenker for denne ruten');
  let items=[];const used=[];
  for(const u of hints.urls.slice(0,20)){try{const a=await fetchDirectTrailUrl(u,hints,lat,lon,0);if(a.length){items.push(...a);used.push(u)}}catch(e){}}
  if(!items.length)throw Error('POTA-kildene ga ingen direkte lesbar GPX/KML/GeoJSON/ArcGIS-geometri');
  const lines=[];const seen=new Set();for(const x of items){if(!x.line||x.line.length<2)continue;const key=JSON.stringify([x.line[0],x.line[x.line.length-1],x.line.length]);if(!seen.has(key)){seen.add(key);lines.push(x.line)}}
  if(!lines.length)throw Error('POTA-kildene inneholdt ingen gyldige linjesegmenter');
  return {source:'notrail',geometry:{type:'MultiLineString',coordinates:lines},name:link.officialName,id:'POTA-kildegeometri',officialType:'National Recreation Trail',segmentCount:lines.length,potaSourceUrls:hints.urls,directSourceUrls:used,aliasCount:hints.aliases.length};
}

async function resolveKartverketTrail(link,p){
  const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('POTA-referansen mangler gyldig posisjon');
  const hints=await getPotaTrailHints(p,link);const typeNames=['app:Fotrute','app:AnnenRute','app:Sykkelrute','app:Skiløype'];let all=[];let errors=[];
  for(const typ of typeNames){try{for(const c of await fetchKartverketTrailType(typ,lat,lon))all.push({c,typeName:typ})}catch(e){errors.push(e.message)}}
  if(!all.length)throw Error(errors[0]||'Kartverkets Turrutebase returnerte ingen ruter i nærheten');
  const scored=all.map(x=>({...x,score:trailScore(x.c,link.officialName,lat,lon,hints.aliases)})).sort((a,b)=>b.score-a.score);const best=scored[0];
  if(!best||best.score<48)throw Error('Fant ingen tilstrekkelig sikker navne-/posisjonsmatch i Kartverkets Turrutebase');
  let chosen=[];
  // 1) Utvid den lokale sikre matchen med samme rutenavn/rutenummer over hele datasettet.
  try{chosen.push(...(await expandTrailByCanonicalFields(best.typeName,best.c)).map(c=>({c,typeName:best.typeName})))}catch(e){}
  // 2) Bruk POTA-kildelenkenes navn til å hente flere delruter som hører til samme POTA-referanse.
  if(hints.urls.length||hints.aliases.length>2){try{chosen.push(...await findTrailSegmentsFromPotaAliases(typeNames,hints))}catch(e){}}
  // 3) Hvis global utvidelse ikke ga noe, bruk de gode lokale treffene.
  if(!chosen.length)chosen=scored.filter(x=>x.score>=Math.max(42,best.score-35));
  // Filtrer bort åpenbart irrelevante globale alias-treff: minst én POTA-alias må passe eller segmentet må være nært startpunktet.
  const filtered=[];for(const x of chosen){const txt=trailText(x.c);let aScore=0;for(const a of hints.aliases)aScore=Math.max(aScore,tokenScore(txt,a));let d=x.c.distanceKm;if(!Number.isFinite(d)&&typeof turf!=='undefined'){d=Infinity;for(const line of x.c.lines)try{d=Math.min(d,turf.pointToLineDistance(turf.point([lon,lat]),turf.lineString(line),{units:'kilometers'}))}catch(e){}}if(aScore>=45||d<8)filtered.push(x)}
  if(filtered.length)chosen=filtered;
  const lines=[];const uniq=new Set();for(const x of chosen)for(const line of x.c.lines)if(line.length>1){const key=JSON.stringify([line[0],line[line.length-1],line.length]);if(!uniq.has(key)){uniq.add(key);lines.push(line)}}
  if(!lines.length)throw Error('Turrutebasen ga treff, men ingen gyldig linjegeometri');
  const label=trailField(best.c,/^rutenavn$|rute.?navn|route.?name|navn/)||link.officialName;
  return {source:'notrail',geometry:{type:'MultiLineString',coordinates:lines},name:label,id:'Kartverket Turrutebase',officialType:'National Recreation Trail',segmentCount:lines.length,potaSourceUrls:hints.urls,aliasCount:hints.aliases.length};
}
async function resolveKyststienFallback(link,p){
  if(p.reference!=='NO-2542' && !/kyststien\s*[øo]stfold/i.test(p.name||''))throw Error('Ingen verifisert fallback for denne ruten');
  const params=new URLSearchParams({f:'geojson',where:'1=1',outFields:'OBJECTID,Kommune,Navn,Navn_pa_turrute,Rutebeskrivelse',returnGeometry:'true',outSR:'4326',resultRecordCount:'2000'});
  const d=await getJSON(`${NO_KYSTSTI}?${params}`), fs=(d&&d.features)||[];
  if(!fs.length)throw Error('Kyststien-laget returnerte ingen linjegeometri');
  const hvaler=await getJSON('data/hvaler/hvaler-tillegg.geojson').catch(()=>null);
  const hvalerReady=!!(hvaler?.features?.length);
  const lines=[];for(const f of fs){
    // Hvaler is entirely replaced by the locally edited layer.
    if(hvalerReady && /hvaler/i.test(String(f?.properties?.Kommune||'')))continue;
    const g=f&&f.geometry;if(!g)continue;
    if(g.type==='LineString'&&g.coordinates?.length>1)lines.push(g.coordinates);
    else if(g.type==='MultiLineString')for(const a of g.coordinates||[])if(a?.length>1)lines.push(a)
  }
  for(const f of hvaler?.features||[]){
    const g=f.geometry;if(!g)continue;
    if(g.type==='LineString'&&g.coordinates?.length>1)lines.push(g.coordinates);
    else if(g.type==='MultiLineString')for(const a of g.coordinates||[])if(a?.length>1)lines.push(a);
  }
  if(!lines.length)throw Error('Kyststien-laget inneholdt ingen gyldige linjesegmenter');
  return {source:'notrail',geometry:{type:'MultiLineString',coordinates:lines},name:'Kyststien Østfold',id:'NO-2542 fallback',officialType:'National Recreation Trail'};
}
async function resolveNorwayTrail(link,p){
  const ref=(p&&p.reference)||'';
  if(ref==='NO-2542'||ref==='LA-2542'||/kyststien\s*[øo]stfold/i.test((p&&p.name)||'')){
    return await resolveKyststienFallback(link,p);
  }
  throw Error('Denne norske stien har foreløpig ingen verifisert geometri i POTA Kart.');
}
function inferLink(p){
  if(countryOf(p)==='NO')return inferNorwayLink(p);
  if(OVERRIDES[p.reference]) return Object.assign({reference:p.reference,potaName:p.name},OVERRIDES[p.reference]);
  const name=(p.name||'').trim();
  for(const r of SUFFIX_RULES){if(r.rx.test(name)){return applyNameOverride({reference:p.reference,potaName:name,officialName:name.replace(r.rx,'').trim(),layer:r.layer,type:r.type,recognized:!!r.recognized,geometryNote:r.geometryNote||'',confidence:'automatisk navn/type-kobling'})}}
  // POTA-API-et varierer litt i feltnavn. Bruk program-/park-type når tilgjengelig.
  const hint=norm([p.parkType,p.parktype,p.type,p.category,p.locationName].filter(Boolean).join(' '));
  if(hint.includes('national park')) return applyNameOverride({reference:p.reference,potaName:name,officialName:name.replace(/\s+national park$/i,'').trim(),layer:'np',type:'Nationalpark',confidence:'typefelt'});
  if(hint.includes('nature reserve')) return applyNameOverride({reference:p.reference,potaName:name,officialName:name.replace(/\s+nature reserve$/i,'').trim(),layer:'nr',type:'Naturreservat',confidence:'typefelt'});
  if(hint.includes('natura 2000')) return applyNameOverride({reference:p.reference,potaName:name,officialName:name.replace(/\s+natura 2000.*$/i,'').trim(),layer:'hab',type:'Natura 2000',confidence:'typefelt'});
  return applyNameOverride({reference:p.reference,potaName:name,officialName:name,layer:null,type:'Ukjent vernetype',confidence:'kun navn'});
}
function buildLinkTable(){linkTable={};for(const p of pota)linkTable[p.reference]=inferLink(p)}

function clearSelection(){
  if(selectedMarker){map.removeLayer(selectedMarker);selectedMarker=null}
  if(selectedGeo){map.removeLayer(selectedGeo);selectedGeo=null}
  document.dispatchEvent(new CustomEvent('pota:selection'));
}
function removeSelectedPark(ref){
  const x=selectedParks.get(ref);if(!x)return;
  if(x.marker&&map.hasLayer(x.marker))map.removeLayer(x.marker);
  if(x.geo&&map.hasLayer(x.geo))map.removeLayer(x.geo);
  selectedParks.delete(ref);
  if(lastSelectedRef===ref)lastSelectedRef=[...selectedParks.keys()].pop()||null;
  renderSelectedList();updateOverlaps();fitSelected();
}
function clearSelectedParks(){
  for(const x of selectedParks.values()){if(x.marker&&map.hasLayer(x.marker))map.removeLayer(x.marker);if(x.geo&&map.hasLayer(x.geo))map.removeLayer(x.geo)}
  selectedParks.clear();lastSelectedRef=null;renderSelectedList();updateOverlaps();
}
function renderSelectedList(){
  document.dispatchEvent(new CustomEvent('pota:selection'));
  if(!multiMode.checked||!selectedParks.size){selectedBox.style.display='none';selectedList.innerHTML='';return}
  selectedBox.style.display='block';
  selectedList.innerHTML=[...selectedParks.values()].map(x=>`<div class="selitem"><span><b>${esc(x.p.reference)}</b> – ${esc(x.p.name)}</span><button class="remove" data-ref="${esc(x.p.reference)}" title="Fjern">×</button></div>`).join('');
  selectedList.querySelectorAll('button[data-ref]').forEach(b=>b.onclick=()=>removeSelectedPark(b.dataset.ref));
}
function fitSelected(){
  if(!multiMode.checked||!selectedParks.size)return;
  let bounds=null;
  for(const x of selectedParks.values()){
    if(x.geo&&x.geo.getBounds){const b=x.geo.getBounds();if(b.isValid())bounds=bounds?bounds.extend(b):L.latLngBounds(b)}
    else if(x.marker){const ll=x.marker.getLatLng();bounds=bounds?bounds.extend(ll):L.latLngBounds(ll,ll)}
  }
  // Ingen automatisk zoom/panorering ved flervalg.
}
function setLayerVisibility(k,on){document.getElementById(k).checked=on;if(on){if(!map.hasLayer(layers[k]))layers[k].addTo(map)}else if(map.hasLayer(layers[k]))map.removeLayer(layers[k])}
function hideOfficialWms(){for(const k of ['np','nr','nvo','kr','hab','bird'])setLayerVisibility(k,false)}

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


const STATE_TRAILS_GEOJSON='https://geodata.naturvardsverket.se/nedladdning/friluftsliv/Statliga_Leder.geojson';
const WORLD_WFS='https://geodata.naturvardsverket.se/inspire/ps-ic/ows';
let stateTrailsCache=null;
function pointSegDistKm(lat,lon,a,b){
  const kx=111.32*Math.cos(lat*Math.PI/180),ky=110.57,x=lon*kx,y=lat*ky,x1=a[0]*kx,y1=a[1]*ky,x2=b[0]*kx,y2=b[1]*ky;
  const dx=x2-x1,dy=y2-y1,t=dx||dy?Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy))):0;
  return Math.hypot(x-(x1+t*dx),y-(y1+t*dy));
}
function geomDistKm(g,lat,lon){let best=Infinity;function line(c){for(let i=1;i<c.length;i++)best=Math.min(best,pointSegDistKm(lat,lon,c[i-1],c[i]))}if(!g)return best;if(g.type==='LineString')line(g.coordinates);else if(g.type==='MultiLineString')g.coordinates.forEach(line);else if(g.type==='Polygon')g.coordinates.forEach(line);else if(g.type==='MultiPolygon')g.coordinates.flat().forEach(line);return best}
async function resolveStateTrail(link,p){
  if(!stateTrailsCache){const r=await fetch(STATE_TRAILS_GEOJSON);if(!r.ok)throw Error('Statliga leder svarte '+r.status);stateTrailsCache=await r.json()}
  const fs=(stateTrailsCache.features||[]).filter(f=>f&&f.geometry),lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('POTA-referansen mangler koordinat');
  const ranked=fs.map(f=>({f,d:geomDistKm(f.geometry,lat,lon)})).sort((a,b)=>a.d-b.d);if(!ranked.length||ranked[0].d>20)throw Error('Fant ingen statlig ledgeometri nær POTA-punktet');
  const near=ranked.filter(x=>x.d<=Math.max(1.5,ranked[0].d+0.8)).slice(0,12).map(x=>x.f);
  return {id:'Statliga leder',name:link.officialName,source:'trail',officialType:'Statlig led',geometry:{type:'GeometryCollection',geometries:near.map(f=>f.geometry)}};
}
async function resolveWorldHeritage(link,p){
  const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('POTA-referansen mangler koordinat');
  const d=.35,bbox=[lon-d,lat-d,lon+d,lat+d].join(',');
  const urls=[
    `${WORLD_WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=PS.ProtectedSites.WorldHeritage&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox},EPSG:4326`,
    `${WORLD_WFS}?service=WFS&version=1.1.0&request=GetFeature&typeName=PS.ProtectedSites.WorldHeritage&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox},EPSG:4326`
  ];
  let last;for(const u of urls){try{const r=await fetch(u);if(!r.ok)throw Error('World Heritage-tjenesten svarte '+r.status);const j=await r.json(),fs=(j.features||[]).filter(f=>f.geometry);if(fs.length){const ranked=fs.map(f=>({f,d:geomDistKm(f.geometry,lat,lon)})).sort((a,b)=>a.d-b.d),f=ranked[0].f,pr=f.properties||{};return {id:pr.id||pr.identifier||'World Heritage',name:pr.name||pr.NAMN||link.officialName,source:'world',officialType:'World Heritage',geometry:f.geometry}}}catch(e){last=e}}
  throw last||Error('Fant ingen World Heritage-geometri ved POTA-punktet');
}
function normalizeSpecialGeometry(g){if(g&&g.type==='GeometryCollection')return {type:'FeatureCollection',features:g.geometries.map(x=>({type:'Feature',properties:{},geometry:x}))};return {type:'Feature',properties:{},geometry:g}}


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

function stripOuter(s){s=s.trim();return s.startsWith('(')&&s.endsWith(')')?s.slice(1,-1).trim():s}
function splitTop(s){let out=[],depth=0,start=0;for(let i=0;i<s.length;i++){const c=s[i];if(c==='(')depth++;else if(c===')')depth--;else if(c===','&&depth===0){out.push(s.slice(start,i).trim());start=i+1}}out.push(s.slice(start).trim());return out.filter(Boolean)}
function swerefToWgs84(east,north){
  const axis=6378137.0, flattening=1/298.257222101, cm=15*Math.PI/180, scale=0.9996, fe=500000.0;
  const e2=flattening*(2-flattening), n=flattening/(2-flattening), ar=axis/(1+n)*(1+n*n/4+Math.pow(n,4)/64);
  const beta=[n/2-2*n*n/3+37*Math.pow(n,3)/96-Math.pow(n,4)/360,n*n/48+Math.pow(n,3)/15-437*Math.pow(n,4)/1440,17*Math.pow(n,3)/480-37*Math.pow(n,4)/840,4397*Math.pow(n,4)/161280];
  const A=e2+e2*e2+Math.pow(e2,3)+Math.pow(e2,4),B=-(7*e2*e2+17*Math.pow(e2,3)+30*Math.pow(e2,4))/6,C=(224*Math.pow(e2,3)+889*Math.pow(e2,4))/120,D=-(4279*Math.pow(e2,4))/1260;
  const xi=north/(scale*ar), eta=(east-fe)/(scale*ar);let xp=xi,ep=eta;
  for(let j=1;j<=4;j++){const b=beta[j-1];xp-=b*Math.sin(2*j*xi)*Math.cosh(2*j*eta);ep-=b*Math.cos(2*j*xi)*Math.sinh(2*j*eta)}
  const ps=Math.asin(Math.sin(xp)/Math.cosh(ep)), dl=Math.atan2(Math.sinh(ep),Math.cos(xp)), sp=Math.sin(ps);
  const lat=ps+sp*Math.cos(ps)*(A+B*sp*sp+C*Math.pow(sp,4)+D*Math.pow(sp,6)), lon=cm+dl;
  return [lon*180/Math.PI,lat*180/Math.PI];
}
function coordPair(t){const a=t.trim().split(/\s+/).map(Number);if(a.length<2||!Number.isFinite(a[0])||!Number.isFinite(a[1]))throw Error('Ugyldig koordinat i WKT');let x=a[0],y=a[1];return (Math.abs(x)>180||Math.abs(y)>90)?swerefToWgs84(x,y):[x,y]}
function ring(s){return splitTop(stripOuter(s)).map(coordPair)}
function parseWkt(wkt){
  let s=wkt.trim().replace(/^SRID=\d+;/i,'');const m=s.match(/^\s*(MULTIPOLYGON|POLYGON)\s*(.*)$/i);if(!m)return null;const type=m[1].toUpperCase(),body=stripOuter(m[2]);
  if(type==='POLYGON')return {type:'Polygon',coordinates:splitTop(body).map(ring)};
  return {type:'MultiPolygon',coordinates:splitTop(body).map(poly=>splitTop(stripOuter(poly)).map(ring))};
}
function parseGeometryResponse(txt){
  const t=txt.trim();
  if(!t)return null;
  if(t[0]==='{'||t[0]==='['){try{const d=JSON.parse(t);if(d.type==='Feature')return d.geometry;if(d.type&&d.coordinates)return d;const g=d.geometry||d.geometri||d.wkt||d.WKT;if(typeof g==='string')return parseWkt(g);if(g&&g.type)return g}catch(e){}}
  const q=t.startsWith('"')?(()=>{try{return JSON.parse(t)}catch(e){return t}})():t;
  return parseWkt(String(q));
}
function geometryLabel(g){const t=(g&&g.type)||'';if(t==='Point'||t==='MultiPoint')return 'punkt';if(t==='LineString'||t==='MultiLineString')return 'linje';if(t==='Polygon'||t==='MultiPolygon')return 'område';return t||'ukjent';}

function transformGeo(g){
  // REST kan returnere WGS84 direkte eller registerets native SWEREF 99 TM.
  function rec(x){if(Array.isArray(x)&&x.length>=2&&typeof x[0]==='number'&&typeof x[1]==='number'){return (Math.abs(x[0])>180||Math.abs(x[1])>90)?swerefToWgs84(x[0],x[1]):[x[0],x[1]]}return Array.isArray(x)?x.map(rec):x}
  return {type:g.type,coordinates:rec(g.coordinates)};
}
async function focusOfficialGeometry(link,p){
  hideOfficialWms();
  st.innerHTML=`Henter offisiell geometri for <b>${esc(link.officialName)}</b>…`;
  try{
    const r=await atlasRecord(p.reference);
    if(!r)throw Error('Ingen verifisert geometri er lagret. Parken vises som punkt.');

    const raw=(r.source==='trail'||r.source==='world')?normalizeSpecialGeometry(r.geometry):r.source==='notrail'?{type:'Feature',properties:{name:r.name,id:r.id},geometry:r.geometry}:r.source==='historic'?{type:'Feature',properties:{name:r.name,id:r.id,url:r.url||''},geometry:r.geometry}:r.source==='norway'?{type:'Feature',properties:{name:r.name,id:r.id},geometry:r.geometry}:{type:'Feature',properties:{name:r.name,id:r.id},geometry:transformGeo(r.geometry)};
    selectedGeo=L.geoJSON(raw,{style:f=>{const t=f.geometry&&f.geometry.type;if(t==='LineString'||t==='MultiLineString'){const isTrail=(r.source==='trail'||r.source==='notrail');return isTrail?{color:gpsParkColor(p.reference,true),weight:isKyststienPark(p)?2:6,opacity:.95}:{weight:6,opacity:.95};}return {color:gpsParkColor(p.reference,true),weight:3,fillColor:gpsParkColor(p.reference,true),fillOpacity:.22};},pointToLayer:(f,latlng)=>L.circleMarker(latlng,{radius:11,weight:4,color:'#2563eb',fillColor:'#60a5fa',fillOpacity:.45})}).addTo(map);
    if(isKyststienPark(p)&&isTrailLink(link))addKyststienCorridor(selectedGeo);
    st.innerHTML=`Valgt område: <b>${esc(r.name)}</b> fra ${r.source==='trail'?'Naturvårdsverkets offisielle Statliga leder-data':r.source==='world'?'Naturvårdsverkets offisielle World Heritage-data':r.source==='historic'?'Riksantikvarieämbetets offisielle Kulturhistoriska lämningar-data':r.source==='notrail'?'Kartverkets offisielle Turrutebase':r.source==='norway'?(r.sourceLabel||'Miljødirektoratets offisielle Naturbase-data'):'Naturvårdsverkets offisielle REST-data'}${r.officialType?` – offisiell type: <b>${esc(r.officialType)}</b>`:''}${r.id!=null?` (register-ID ${esc(r.id)})`:''}${r.source==='notrail'&&r.segmentCount?` · <b>${r.segmentCount}</b> linjesegmenter`:''}${r.source==='notrail'&&r.directSourceUrls?.length?` · <b>${r.directSourceUrls.length}</b> direkte POTA-geometrikilder`:r.source==='notrail'&&r.potaSourceUrls?.length?` · <b>${r.potaSourceUrls.length}</b> POTA-kildelenker brukt som rutetips`:''}.`;
    if(isKyststienPark(p)&&isTrailLink(link))st.innerHTML+=`<br><span class="small">Kyststien vises som et ${TRAIL_CORRIDOR_WIDTH_M} meter bredt belte (${TRAIL_BUFFER_M} meter på hver side av midtlinjen).</span>`;
    if(r.geometryNote)st.innerHTML+=`<br><span class="small">${esc(r.geometryNote)}</span>`;
    document.dispatchEvent(new CustomEvent('pota:geometry',{detail:{reference:p.reference,available:true}}));
    return r;
  }catch(e){
    document.dispatchEvent(new CustomEvent('pota:geometry',{detail:{reference:p.reference,available:false}}));
    st.innerHTML=`Kunne ikke hente en verifisert enkeltgeometri for <b>${esc(link.officialName)}</b>: ${esc(e.message)}. Ingen andre områder vises som en falsk match.`;
    return null;
  }
}
function isTrailLink(link){return !!(link&&(link.layer==='trail'||link.layer==='notrail'||link.type==='State Trail'||link.type==='National Recreation Trail'))}
function makeTrailIcon(selected=false){const svg=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.1" cy="4.6" r="2.2" fill="currentColor"/><path d="M11.3 7.2l-2.1 4.1 2.5 2.3-1.8 5.2M11.3 7.2l3.3 2.4 2.9-.4M11.8 13.4l3.8 5.2M9.2 11.3l-2.5 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;return L.divIcon({className:'',html:`<div class="trail-pota-icon${selected?' selected':''}" aria-label="Tursti">${svg}</div>`,iconSize:[22,22],iconAnchor:[11,11],popupAnchor:[0,-11]})}
function bindParkHover(marker,p,link){if(!marker)return marker;marker.bindTooltip(`<b>${esc(p.reference)}</b><br>${esc(p.name)}`,{pane:'topTooltipPane',direction:'top',offset:[0,-7],opacity:.96,className:'pota-hover-tooltip pota-point-tooltip',sticky:false});return marker}
function bindParkGeometryHover(layer,p){if(!layer)return layer;layer.bindTooltip(`<b>${esc(p.reference)}</b><br>${esc(p.name)}`,{pane:'topTooltipPane',sticky:true,opacity:.96,className:'pota-hover-tooltip'});return layer}
let parkSelectionQueue=Promise.resolve();
function showLink(p,openPopup=true,centerOnSearch=false,popupLatLng=null){
 const task=parkSelectionQueue.then(()=>showParkLink(p,openPopup,centerOnSearch,popupLatLng));
 parkSelectionQueue=task.catch(e=>console.error(e));return task;
}
async function showParkLink(p,openPopup=true,centerOnSearch=false,popupLatLng=null){
  const multi=multiMode.checked;
  if(multi&&selectedParks.has(p.reference)){
    lastSelectedRef=p.reference;
    const existing=selectedParks.get(p.reference);
    if(centerOnSearch)map.setView(existing.marker?.getLatLng()||[+p.latitude,+p.longitude],Math.max(11,map.getZoom()));
    openParkInfo(existing.p,existing.link,openPopup?(popupLatLng||existing.marker?.getLatLng()||L.latLng(+p.latitude,+p.longitude)):null);
    renderSelectedList();return;
  }
  if(!multi){clearSelectedParks();clearSelection()}
  else {selectedMarker=null;selectedGeo=null}
  const lat=+p.latitude,lon=+p.longitude,link=linkTable[p.reference]||inferLink(p);
  if(centerOnSearch&&Number.isFinite(lat)&&Number.isFinite(lon))map.setView([lat,lon],Math.max(11,map.getZoom()));
  if(!atlasHasGeometry(p.reference)&&Number.isFinite(lat)&&Number.isFinite(lon)){
    if(centerOnSearch)map.setView([lat,lon],map.getZoom());
    selectedMarker=isTrailLink(link)?L.marker([lat,lon],{pane:'potaPane',icon:makeTrailIcon(true)}).addTo(map):L.circleMarker([lat,lon],{pane:'potaPane',radius:6,weight:2,color:'#b45309',fillColor:'#d97706',fillOpacity:.95}).addTo(map);
    bindParkHover(selectedMarker,p,link);
    selectedMarker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);openParkInfo(p,link,e.latlng||selectedMarker.getLatLng())});
  }
  openParkInfo(p,link,openPopup?(popupLatLng||(Number.isFinite(lat)&&Number.isFinite(lon)?L.latLng(lat,lon):null)):null);
  const result=await focusOfficialGeometry(link,p);
  if(result&&selectedGeo&&selectedMarker){map.removeLayer(selectedMarker);selectedMarker=null}
  if(!result&&!selectedMarker&&Number.isFinite(lat)&&Number.isFinite(lon)){selectedMarker=L.circleMarker([lat,lon],{pane:'potaPane',radius:6,weight:2,color:'#b45309',fillColor:'#d97706',fillOpacity:.95}).addTo(map);bindParkHover(selectedMarker,p,link);selectedMarker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);openParkInfo(p,link,L.latLng(lat,lon))});}
  if(selectedGeo)bindSelectedGeometry(selectedGeo,p,link);
  if(multi){
    selectedParks.set(p.reference,{p,link,marker:selectedMarker,geo:selectedGeo});
    lastSelectedRef=p.reference;selectedMarker=null;selectedGeo=null;
    renderSelectedList();updateOverlaps();
  } else {lastSelectedRef=p.reference}
  document.dispatchEvent(new CustomEvent('pota:selection'));
}

function setMultiMode(on){
  if(on){
    if(lastSelectedRef&&!selectedParks.has(lastSelectedRef)&&(selectedMarker||selectedGeo)){
      const p=pota.find(x=>x.reference===lastSelectedRef);
      if(p){selectedParks.set(p.reference,{p,link:linkTable[p.reference]||inferLink(p),marker:selectedMarker,geo:selectedGeo});selectedMarker=null;selectedGeo=null;}
    }
    renderSelectedList();updateOverlaps();return;
  }
  if(selectedParks.size){
    const keepRef=lastSelectedRef&&selectedParks.has(lastSelectedRef)?lastSelectedRef:[...selectedParks.keys()].pop();
    const keep=selectedParks.get(keepRef);
    for(const [ref,x] of selectedParks){if(ref!==keepRef){if(x.marker&&map.hasLayer(x.marker))map.removeLayer(x.marker);if(x.geo&&map.hasLayer(x.geo))map.removeLayer(x.geo)}}
    selectedParks.clear();selectedBox.style.display='none';selectedList.innerHTML='';
    selectedMarker=keep?.marker||null;selectedGeo=keep?.geo||null;
    updateOverlaps();
    if(keep){linkbox.style.display='block';const link=keep.link;linkbox.innerHTML=`<b>${esc(keep.p.reference)} – ${esc(keep.p.name)}</b><br>Valgt POTA-park: <b>${esc(link.officialName)}</b> <span class="badge">${esc(link.type)}</span>`;}
  }
}
multiMode.addEventListener('change',e=>setMultiMode(e.target.checked));
document.getElementById('clearSelected').onclick=()=>{clearSelectedParks();linkbox.style.display='none';st.innerHTML='Utvalget er tømt. Klikk eller søk etter en POTA-park.'};

function diagnosticHtml(stats){
 const unknown=stats.unknown||[], unsupported=stats.unsupported||[];
 const groupUnknown=a=>{const m={};for(const x of a){const tail=(x.name||'').split(/\s+/).slice(-2).join(' ')||'(uten navn)';m[tail]=(m[tail]||0)+1}return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,12)};
 const byType={};
 for(const x of unsupported){const k=x.type||'Ukjent kjent type';(byType[k]||(byType[k]=[])).push(x)}
 const typeGroups=Object.entries(byType).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'sv'));
 let h=`<b>Diagnostikk</b><br>${stats.shown} POTA-referanser totalt.<br>${stats.linked} kan slås opp direkte eller automatisk hos Naturvårdsverket.`;
 if(unsupported.length){
   h+=`<br>${unsupported.length} har en kjent POTA-type, men trenger en annen offisiell datakilde for geometri.`;
   h+=`<br><br><b>Fordeling av disse ${unsupported.length}:</b><br>`+typeGroups.map(([k,a])=>`${esc(k)} (${a.length})`).join(', ');
   h+=`<div style="margin-top:8px">`+typeGroups.map(([k,a])=>`<details style="margin:4px 0"><summary><b>${esc(k)}</b> (${a.length})</summary><div style="padding:5px 0 4px 12px">${a.slice().sort((x,y)=>(x.reference||'').localeCompare(y.reference||'')).map(x=>`${esc(x.reference)} – ${esc(x.name)}`).join('<br>')}</div></details>`).join('')+`</div>`;
 }
 h+=`<br>${unknown.length} har fortsatt ukjent type.`;
 if(unknown.length){h+=`<br><br><b>Vanlige mønstre blant ukjente:</b><br>`+groupUnknown(unknown).map(([k,v])=>`${esc(k)} (${v})`).join(', ');h+=`<br><br><b>Ukjente referanser:</b><br>`+unknown.slice(0,80).map(x=>`${esc(x.reference)} – ${esc(x.name)}`).join('<br>');if(unknown.length>80)h+=`<br>… og ${unknown.length-80} til.`}
 return h;
}
function applyCountryFilter(){
 if(geometryAtlas.ready){atlasRefresh();return}
 const c=countryFilter.value;
 for(const x of potaMarkers){const show=c==='ALL'||x.country===c;if(show){if(!layers.pts.hasLayer(x.marker))layers.pts.addLayer(x.marker)}else if(layers.pts.hasLayer(x.marker))layers.pts.removeLayer(x.marker)}
}
async function loadCountryPota(cc){
 const urls=[`https://api.pota.app/program/parks/${cc}`,`https://api.pota.app/location/parks/${cc}`];
 for(const u of urls){try{const d=await getJSON(u);if(Array.isArray(d)&&d.length)return d.filter(x=>(x.reference||'').startsWith(cc+'-'))}catch(e){}}
 return [];
}
async function loadPota(){
 const [se,no]=await Promise.all([loadCountryPota('SE'),loadCountryPota('NO')]);
 pota=[...se,...no];buildLinkTable();layers.pts.clearLayers();potaMarkers=[];
 let shown=0,linked=0;const unknown=[],unsupported=[],byCountry={SE:0,NO:0};
 for(const p of pota){const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;shown++;const cc=countryOf(p);byCountry[cc]=(byCountry[cc]||0)+1;const link=linkTable[p.reference];if(link&&link.layer)linked++;else if(link&&link.recognized)unsupported.push({reference:p.reference,name:p.name,type:link.type});else unknown.push({reference:p.reference,name:p.name});
   const marker=isTrailLink(link)?L.marker([lat,lon],{pane:'potaPane',icon:makeTrailIcon(false)}):L.circleMarker([lat,lon],{pane:'potaPane',radius:6,weight:1,color:'#e67e22',fillColor:'#f39c12',fillOpacity:.8});
   bindParkHover(marker,p,link);
   marker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);showLink(p,true,false)});
   layers.pts.addLayer(marker);potaMarkers.push({marker,country:cc,reference:p.reference});
 }
 applyCountryFilter();return {shown,linked,unknown,unsupported,byCountry};
}
async function init(){st.textContent='Laster POTA-referanser for Norge og Sverige…';let x={shown:0,linked:0,unknown:[],unsupported:[],byCountry:{}};try{x=await loadPota()}catch(e){st.innerHTML='POTA-listen kunne ikke lastes: '+esc(e.message);return}
 await initializeGeometryAtlas();
 st.innerHTML='Kartet viser lagret geometri for valgt land. Parker uten verifisert geometri vises som punkt. Oversiktsgrenser er forenklet; zoom inn for detaljer.';
 document.getElementById('diag').innerHTML=`<b>Diagnostikk</b><br>${x.shown} POTA-referanser totalt · Norge: ${x.byCountry.NO||0} · Sverige: ${x.byCountry.SE||0}.<br><span class="small">Norsk støtte: verneområder, statlig sikrede og kartlagte friluftslivsområder i Naturbase, samt verifisert kulturminnegeometri fra Riksantikvaren. Kyststien Østfold er den eneste norske National Recreation Trail med verifisert geometri. Eksperimentelle WMS/WFS-Hvaler-lag er fjernet for stabilitet.</span>`;
}
function toggle(k){document.getElementById(k).addEventListener('change',e=>e.target.checked?layers[k].addTo(map):map.removeLayer(layers[k]));}
['np','nr','nvo','kr','hab','bird','pts'].forEach(toggle);
countryFilter.addEventListener('change',applyCountryFilter);
function search(){const q=norm(document.getElementById('q').value);if(!q)return;const c=countryFilter.value, pool=c==='ALL'?pota:pota.filter(x=>countryOf(x)===c);let t=pool.find(x=>norm(x.reference)===q)||pool.find(x=>norm(x.name).includes(q));if(t){showLink(t,true,true)}else st.innerHTML='Fant ikke «'+esc(document.getElementById('q').value)+'» i POTA-listen.'}
document.getElementById('search').onclick=search;document.getElementById('q').onkeydown=e=>{if(e.key==='Enter')search()};
init();

