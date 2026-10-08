// Shared geometry layer: complete country overview, full boundaries at close zoom.
// Missing/failed geometry stays represented by its POTA reference point.
const geometryAtlas={indexes:{},overviews:{},records:new Map(),shards:new Map(),layers:new Map(),byRef:new Map(),epoch:0,ready:false};
function atlasMeta(ref){return geometryAtlas.indexes[ref.split('-')[0]]?.parks?.[ref]||null}
function atlasHasGeometry(ref){return !!atlasMeta(ref)&&geometryAtlas.byRef.has(ref)}
async function atlasRecord(ref){
 // The editable Hvaler replacement must override old cached NO-2542 atlas geometry.
 if(ref==='NO-2542'||ref==='LA-2542'){
   if(!geometryAtlas.hvalerTrailPromise){
     geometryAtlas.hvalerTrailPromise=resolveKyststienFallback(null,{reference:'NO-2542'})
       .catch(e=>{geometryAtlas.hvalerTrailPromise=null;throw e});
   }
   try{return await geometryAtlas.hvalerTrailPromise}catch(e){console.warn('Edited Hvaler trail unavailable:',e)}
 }
 const meta=atlasMeta(ref);if(!meta)return null;
 const key=ref.split('-')[0]+'/'+meta.shard;
 if(!geometryAtlas.shards.has(key))geometryAtlas.shards.set(key,getJSON('data/geometries/'+meta.shard).catch(e=>{geometryAtlas.shards.delete(key);throw e}));
 const records=await geometryAtlas.shards.get(key),r=records[ref];
 if(!r?.geometry)throw Error('Lagret geometri mangler for '+ref);
 return r;
}
const gpsInsideRefs=new Set();let gpsColorEpoch=0;
function gpsParkColor(ref,selected=false){return gpsInsideRefs.has(ref)?'#15803d':selected?'#1d4ed8':'#3388ff'}
function atlasStyle(ref){
 const selected=selectedParks.has(ref)||lastSelectedRef===ref,color=gpsParkColor(ref,selected);
 return {color,weight:selected?3:1.5,opacity:.9,fillColor:color,fillOpacity:selected?.22:.09};
}
function gpsGeometryHit(g,ll){
 if(!g)return false;
 if(g.type==='GeometryCollection')return g.geometries.some(x=>gpsGeometryHit(x,ll));
 const pt=turf.point([ll.lng,ll.lat]);
 if(g.type==='Polygon'||g.type==='MultiPolygon')return turf.booleanPointInPolygon(pt,{type:'MultiPolygon',coordinates:atlasOverlapPolygons(g)});
 if(g.type==='LineString'||g.type==='MultiLineString')return (g.type==='LineString'?[g.coordinates]:g.coordinates).some(a=>turf.pointToLineDistance(pt,turf.lineString(a),{units:'kilometers'})<=TRAIL_BUFFER_M/1000);
 return false;
}
function paintGpsSelected(){
 const paint=(layer,ref)=>{if(!layer)return;if(layer.eachLayer)layer.eachLayer(x=>paint(x,ref));else if(layer.setStyle){const color=gpsParkColor(ref,true);layer.setStyle({color,fillColor:color})}};
 for(const [ref,x] of selectedParks)paint(x.geo,ref);
 if(!multiMode.checked&&lastSelectedRef)paint(selectedGeo,lastSelectedRef);
}
function gpsOverlapStyle(refs){const inside=refs.every(ref=>gpsInsideRefs.has(ref));return {color:inside?'#15803d':'#7e22ce',weight:1,fillColor:inside?'#15803d':'#a855f7',fillOpacity:inside?.25:.48}}
async function updateGpsParkColors(){
 const epoch=++gpsColorEpoch,next=new Set(),position=lastGps;
 if(position&&gpsWatchId!==null){
  const ll=L.latLng(position.lat,position.lon),dy=TRAIL_BUFFER_M/111000,dx=dy/Math.max(.01,Math.cos(position.lat*Math.PI/180));
  const candidates=[];
  for(const [ref,g] of geometryAtlas.byRef){
   if(!atlasInCountry(ref))continue;const bb=atlasMeta(ref)?.bbox;
   if(bb&&(ll.lng<bb[0]-dx||ll.lng>bb[2]+dx||ll.lat<bb[1]-dy||ll.lat>bb[3]+dy))continue;
   candidates.push([ref,g]);
  }
  await Promise.all(candidates.map(async([ref,g])=>{
   // Full geometry keeps holes and boundaries accurate even when the map is panned elsewhere.
   try{g=(geometryAtlas.records.get(ref)||await atlasRecord(ref))?.geometry||g;if(gpsGeometryHit(g,ll))next.add(ref)}catch(e){try{if(gpsGeometryHit(g,ll))next.add(ref)}catch(e){}}
  }));
  const selected=[...selectedParks];if(!multiMode.checked&&lastSelectedRef)selected.push([lastSelectedRef,{geo:selectedGeo}]);
  for(const [ref,x] of selected)if(!atlasHasGeometry(ref)&&x.geo)try{if(featuresOfGeoJson(x.geo.toGeoJSON()).some(f=>gpsGeometryHit(f.geometry,ll)))next.add(ref)}catch(e){}
 }
 if(epoch!==gpsColorEpoch)return;
 const changed=new Set([...gpsInsideRefs,...next].filter(ref=>gpsInsideRefs.has(ref)!==next.has(ref)));
 gpsInsideRefs.clear();for(const ref of next)gpsInsideRefs.add(ref);
 for(const ref of changed)geometryAtlas.layers.get(ref)?.setStyle(()=>atlasStyle(ref));
 paintGpsSelected();
 for(const x of atlasOverlapState.layers.values())if(x.refs.some(ref=>changed.has(ref)))x.layer.setStyle(gpsOverlapStyle(x.refs));
}
function atlasBuildLayer(ref,geometry){
 const p=pota.find(x=>x.reference===ref);if(!p)return null;
 const lyr=L.geoJSON(geometry,{pane:'atlasPane',renderer:geometryAtlas.renderer,style:()=>atlasStyle(ref),pointToLayer:(f,ll)=>L.circleMarker(ll,{pane:'atlasPane',renderer:geometryAtlas.renderer,radius:5,...atlasStyle(ref)})});
 if(isKyststienPark(p)){
  const polygons=trailCorridorPolygonsFromLayer(lyr);
  if(polygons.length)lyr.addLayer(L.geoJSON({type:'MultiPolygon',coordinates:polygons},{pane:'atlasPane',renderer:geometryAtlas.renderer,style:{...atlasStyle(ref),weight:1,fillOpacity:.16}}));
 }
 lyr.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);atlasPick(e.latlng,ref)});
 bindParkGeometryHover(lyr,p);
 return lyr;
}
function atlasShow(ref,geometry){
 const old=geometryAtlas.layers.get(ref);if(old)map.removeLayer(old);
 const layer=atlasBuildLayer(ref,geometry);if(!layer)return;
 geometryAtlas.layers.set(ref,layer);geometryAtlas.byRef.set(ref,geometry);layer.addTo(map);
}
function atlasInCountry(ref){return countryFilter.value==='ALL'||ref.startsWith(countryFilter.value+'-')}
function atlasReport(){
 const el=document.getElementById('geometrySummary');if(!el)return;
 const markers=potaMarkers.filter(x=>atlasInCountry(x.reference)&&!atlasHasGeometry(x.reference));
 const total=pota.filter(p=>atlasInCountry(p.reference)).length;
 const n=[...geometryAtlas.byRef.keys()].filter(atlasInCountry).length;
 el.textContent=`${total.toLocaleString('nb-NO')} parker · ${n.toLocaleString('nb-NO')} med geometri · ${markers.length.toLocaleString('nb-NO')} som punkt`;
}
function atlasFilterPoints(){
 for(const x of potaMarkers){const show=atlasInCountry(x.reference)&&!atlasHasGeometry(x.reference);if(show)layers.pts.addLayer(x.marker);else layers.pts.removeLayer(x.marker)}
 atlasReport();
}
async function atlasRefresh(){
 if(!geometryAtlas.ready)return;
 const epoch=++geometryAtlas.epoch,b=map.getBounds().pad(.2),detail=map.getZoom()>=10;
 for(const [ref,x] of selectedParks){for(const layer of [x.marker,x.geo])if(layer){if(atlasInCountry(ref))layer.addTo(map);else map.removeLayer(layer)}}
 if(!multiMode.checked&&lastSelectedRef)for(const layer of [selectedMarker,selectedGeo])if(layer){if(atlasInCountry(lastSelectedRef))layer.addTo(map);else map.removeLayer(layer)}
 const jobs=[];
 for(const [ref,geometry] of geometryAtlas.overviewByRef){
  if(!atlasInCountry(ref)){const lyr=geometryAtlas.layers.get(ref);if(lyr)map.removeLayer(lyr);continue}
  const meta=atlasMeta(ref);if(!meta)continue;
  const bb=meta.bbox,near=b.intersects(L.latLngBounds([bb[1],bb[0]],[bb[3],bb[2]]));
  if(!geometryAtlas.layers.has(ref))atlasShow(ref,geometry);
  else if(!map.hasLayer(geometryAtlas.layers.get(ref)))geometryAtlas.layers.get(ref).addTo(map);
  if(detail&&near)jobs.push(ref);
  else if(geometryAtlas.byRef.get(ref)!==geometry)atlasShow(ref,geometry);
 }
 atlasFilterPoints();
 // Four concurrent shard fetches, with shared promises and a stale-view guard.
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(4,jobs.length)},async()=>{
  while(cursor<jobs.length){const ref=jobs[cursor++];try{const r=await atlasRecord(ref);if(epoch!==geometryAtlas.epoch)return;geometryAtlas.records.set(ref,r);if(geometryAtlas.byRef.get(ref)!==r.geometry)atlasShow(ref,r.geometry)}catch(e){console.warn('Geometri:',ref,e.message)}}
 }));
 if(epoch===geometryAtlas.epoch){atlasReport();scheduleAtlasOverlaps();updateGpsParkColors()}
}
function atlasHit(geometry,ll){
 const pt=turf.point([ll.lng,ll.lat]);
 function hit(g){
  if(!g)return false;
  if(g.type==='GeometryCollection')return g.geometries.some(hit);
  if(g.type==='Polygon'||g.type==='MultiPolygon')return turf.booleanPointInPolygon(pt,{type:'MultiPolygon',coordinates:atlasOverlapPolygons(g)});
  if(g.type==='LineString'||g.type==='MultiLineString'){
   const px=map.containerPointToLatLng(map.latLngToContainerPoint(ll).add([8,0]));
   const tolerance=Math.max(30.5,ll.distanceTo(px))/1000;
   const lines=g.type==='LineString'?[g.coordinates]:g.coordinates;
   return lines.some(a=>turf.pointToLineDistance(pt,turf.lineString(a),{units:'kilometers'})<=tolerance);
  }
  if(g.type==='Point')return ll.distanceTo(L.latLng(g.coordinates[1],g.coordinates[0]))<50;
  if(g.type==='MultiPoint')return g.coordinates.some(c=>ll.distanceTo(L.latLng(c[1],c[0]))<50);
  return false;
 }
 try{return hit(geometry)}catch(e){return false}
}
function atlasRefsAt(latlng,candidates=geometryAtlas.byRef.keys()){
 const refs=[];
 for(const ref of candidates){const g=geometryAtlas.byRef.get(ref);if(g&&atlasInCountry(ref)&&atlasPointNearBounds(atlasMeta(ref)?.bbox,latlng)&&atlasHit(g,latlng))refs.push(ref)}
 return refs;
}
function atlasPick(latlng,clickedRef){
 const refs=atlasRefsAt(latlng);
 if(clickedRef&&!refs.includes(clickedRef))refs.push(clickedRef);
 if(refs.length===1){const p=pota.find(x=>x.reference===refs[0]);if(p)showLink(p,true,false,latlng);return}
 if(!refs.length)return;
 const choice=new CustomEvent('pota:overlap',{cancelable:true,detail:{refs:refs.slice().sort(),latlng}});
 if(!document.dispatchEvent(choice))return;
 const box=document.createElement('div'),title=document.createElement('b');title.textContent='Velg POTA-park';box.append(title);
 box.style.cssText='max-height:45vh;overflow:auto';
 for(const ref of refs.sort()){const p=pota.find(x=>x.reference===ref);if(!p)continue;const btn=document.createElement('button');btn.type='button';btn.style.cssText='display:block;width:100%;margin-top:6px;text-align:left';btn.textContent=ref+' – '+p.name;btn.onclick=()=>{map.closePopup();showLink(p,true,false,latlng)};box.append(btn)}
 L.popup({autoPan:false,maxWidth:320}).setLatLng(latlng).setContent(box).openOn(map);
}
async function initializeGeometryAtlas(){
 map.createPane('atlasPane');map.getPane('atlasPane').style.zIndex=395;
 geometryAtlas.renderer=L.canvas({pane:'atlasPane',padding:.3});geometryAtlas.overviewByRef=new Map();
 await Promise.all(['NO','SE'].map(async cc=>{
  try{
   const [index,overview]=await Promise.all([getJSON('data/geometries/'+cc+'-index.json'),getJSON('data/geometries/'+cc+'-overview.geojson')]);
   if(index.schemaVersion!==1||!index.parks||overview.type!=='FeatureCollection')throw Error('Ugyldig geometrioversikt');
   geometryAtlas.indexes[cc]=index;
   for(const f of overview.features||[]){const ref=f.properties?.reference;if(index.parks[ref]&&f.geometry)geometryAtlas.overviewByRef.set(ref,f.geometry)}
  }catch(e){console.warn(cc+' geometrioversikt:',e.message)}
 }));
 geometryAtlas.ready=true;await atlasRefresh();
 let timer;map.on('moveend',()=>{clearTimeout(timer);timer=setTimeout(atlasRefresh,100)});
 document.addEventListener('pota:selection',()=>requestAnimationFrame(()=>{for(const [ref,layer] of geometryAtlas.layers)layer.setStyle(()=>atlasStyle(ref))}));
 map.on('click',e=>atlasPick(e.latlng,null));
}

// Only the worker intersects park boundaries. The UI filters and draws its results.
const atlasOverlapState={epoch:0,timer:null,cache:new WeakMap(),pairs:[],worker:null,uploaded:new Set(),layers:new Map(),lastSignature:null,country:null,requests:0,completed:0,busy:false,stats:{}};
function atlasOverlapPolygons(geometry){
 if(!atlasOverlapState.cache.has(geometry))atlasOverlapState.cache.set(geometry,atlasGeometryPolygons(geometry));
 return atlasOverlapState.cache.get(geometry);
}
function atlasPointNearBounds(box,ll){
 if(!box)return false;const latPad=TRAIL_BUFFER_M/111320,lonPad=latPad/Math.max(.05,Math.cos(ll.lat*Math.PI/180));
 return ll.lng>=box[0]-lonPad&&ll.lng<=box[2]+lonPad&&ll.lat>=box[1]-latPad&&ll.lat<=box[3]+latPad;
}
function atlasOverlapView(){const b=map.getBounds(),bounds=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()];return {bounds,viewKey:countryFilter.value+'|'+bounds.join(',')}}
function atlasOverlapFailure(message){
 atlasOverlapState.busy=false;atlasOverlapState.lastSignature=null;console.warn('Overlapp:',message);
 let note=document.getElementById('overlapStatus');if(!note){note=document.createElement('div');note.id='overlapStatus';note.className='small warn';document.getElementById('geometrySummary')?.after(note)}
 note.textContent='Overlapp er ikke tilgjengelig. Prøv å laste kartet på nytt.';
}
function atlasOverlapWorker(){
 if(atlasOverlapState.worker)return atlasOverlapState.worker;
 const worker=new Worker('overlap-worker.js?v=011-11');atlasOverlapState.worker=worker;
 worker.onerror=e=>atlasOverlapFailure(e.message||'Bakgrunnsberegningen kunne ikke startes');
 worker.onmessage=e=>{const data=e.data;if(data.id!==atlasOverlapState.epoch)return;
  if(data.error){atlasOverlapFailure(data.error);return}
  if(data.viewKey!==atlasOverlapView().viewKey){atlasOverlapState.busy=false;atlasOverlapState.lastSignature=null;return}
  applyAtlasOverlaps(data).catch(e=>atlasOverlapFailure(e.message));
 };
 return worker;
}
function scheduleAtlasOverlaps(){
 clearTimeout(atlasOverlapState.timer);
 if(atlasOverlapState.country!==countryFilter.value){atlasOverlapState.country=countryFilter.value;atlasOverlapState.lastSignature=null}
 // Country changes hide foreign overlays immediately, without intersecting again.
 for(const [key,x] of atlasOverlapState.layers)if(!x.refs.every(atlasInCountry)){overlapLayer.removeLayer(x.layer);atlasOverlapState.layers.delete(key)}
 atlasOverlapState.pairs=atlasOverlapState.pairs.filter(x=>x.refs.every(atlasInCountry));
 atlasOverlapState.timer=setTimeout(refreshAtlasOverlaps,180);
}
function refreshAtlasOverlaps(){
 if(!geometryAtlas.ready)return;
 const {bounds,viewKey}=atlasOverlapView(),[w,s,e,n]=bounds,keys=[],entries=[];
 for(const [ref,geometry] of geometryAtlas.byRef){
  if(!atlasInCountry(ref))continue;const box=atlasMeta(ref)?.bbox;if(!box)continue;
  const latPad=TRAIL_BUFFER_M/111320,lonPad=latPad/Math.max(.05,Math.cos(Math.max(Math.abs(box[1]),Math.abs(box[3]))*Math.PI/180));
  if(box[0]-lonPad>e||box[2]+lonPad<w||box[1]-latPad>n||box[3]+latPad<s)continue;
  const key=ref+'@'+(geometry===geometryAtlas.overviewByRef.get(ref)?'overview':'detail');keys.push(key);
  if(!atlasOverlapState.uploaded.has(key))entries.push({key,ref,geometry});
 }
 const signature=viewKey+'|'+keys.join(',');if(signature===atlasOverlapState.lastSignature)return;
 try{
  const worker=atlasOverlapWorker(),id=++atlasOverlapState.epoch;
  worker.postMessage({id,viewKey,bounds,keys,entries});
  for(const entry of entries)atlasOverlapState.uploaded.add(entry.key);
  atlasOverlapState.lastSignature=signature;atlasOverlapState.requests++;atlasOverlapState.busy=true;
 }catch(e){atlasOverlapFailure(e.message)}
}
function bindAtlasOverlapHover(layer,fallbackRefs){
 const parkByRef=geometryAtlas.parkByRef||(geometryAtlas.parkByRef=new Map(pota.map(p=>[p.reference,p])));
 const content=refs=>refs.map(ref=>`<b>${esc(ref)}</b><br>${esc(parkByRef.get(ref)?.name||ref)}`).join('<hr>');
 let candidates=[],epoch=-1,country=null,frame=null,latest=null,signature=null;
 function update(latlng){
  if(!latlng)return;
  if(epoch!==geometryAtlas.epoch||country!==countryFilter.value){
   const b=map.getBounds().pad(.2),w=b.getWest(),s=b.getSouth(),e=b.getEast(),n=b.getNorth();
   candidates=[...geometryAtlas.byRef.keys()].filter(ref=>{const box=atlasMeta(ref)?.bbox;return atlasInCountry(ref)&&box&&box[0]<=e&&box[2]>=w&&box[1]<=n&&box[3]>=s});
   epoch=geometryAtlas.epoch;country=countryFilter.value;
  }
  const refs=atlasRefsAt(latlng,candidates).sort(),key=refs.join('|');
  if(key!==signature){signature=key;layer.setTooltipContent(content(refs.length?refs:fallbackRefs))}
 }
 function cancel(){if(frame!==null)cancelAnimationFrame(frame);frame=null;latest=null}
 layer.bindTooltip(content(fallbackRefs),{pane:'topTooltipPane',sticky:true,opacity:.96,className:'pota-hover-tooltip'});
 layer.on('mouseover',e=>{cancel();update(e.latlng)});
 layer.on('mousemove',e=>{latest=e.latlng;if(frame===null)frame=requestAnimationFrame(()=>{frame=null;update(latest)})});
 layer.on('mouseout remove',cancel);
 return layer;
}
async function applyAtlasOverlaps(data){
 const current=()=>data.id===atlasOverlapState.epoch&&data.viewKey===atlasOverlapView().viewKey;
 const wanted=new Set(data.results.map(x=>x.key));
 for(const [key,x] of atlasOverlapState.layers)if(!wanted.has(key)){overlapLayer.removeLayer(x.layer);atlasOverlapState.layers.delete(key)}
 let slice=performance.now();
 for(const result of data.results){
  if(!current()){if(data.id===atlasOverlapState.epoch){atlasOverlapState.busy=false;atlasOverlapState.lastSignature=null}return}
  const previous=atlasOverlapState.layers.get(result.key);
  if(previous?.version===result.version)continue;
  const layer=L.geoJSON(result.geometry,{pane:'overlapPane',style:gpsOverlapStyle(result.refs)});
  bindAtlasOverlapHover(layer,result.refs);
  layer.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);atlasPick(e.latlng,null)});
  if(previous)overlapLayer.removeLayer(previous.layer);layer.addTo(overlapLayer);atlasOverlapState.layers.set(result.key,{...result,layer});
  if(performance.now()-slice>6){await new Promise(r=>setTimeout(r,0));slice=performance.now()}
 }
 if(!current()){if(data.id===atlasOverlapState.epoch){atlasOverlapState.busy=false;atlasOverlapState.lastSignature=null}return}
 atlasOverlapState.pairs=data.results;atlasOverlapState.stats=data.stats;atlasOverlapState.elapsedMs=data.elapsedMs;atlasOverlapState.completed++;atlasOverlapState.busy=false;
 document.getElementById('overlapStatus')?.remove();document.dispatchEvent(new CustomEvent('pota:overlaps'));
}
