// Shared geometry layer: complete country overview, full boundaries at close zoom.
// Missing/failed geometry stays represented by its POTA reference point.
const geometryAtlas={indexes:{},overviews:{},records:new Map(),shards:new Map(),layers:new Map(),byRef:new Map(),epoch:0,ready:false};
function atlasMeta(ref){return geometryAtlas.indexes[ref.split('-')[0]]?.parks?.[ref]||null}
function atlasHasGeometry(ref){return !!atlasMeta(ref)&&geometryAtlas.byRef.has(ref)}
async function atlasRecord(ref){
 const meta=atlasMeta(ref);if(!meta)return null;
 const key=ref.split('-')[0]+'/'+meta.shard;
 if(!geometryAtlas.shards.has(key))geometryAtlas.shards.set(key,getJSON('data/geometries/'+meta.shard).catch(e=>{geometryAtlas.shards.delete(key);throw e}));
 const records=await geometryAtlas.shards.get(key),r=records[ref];
 if(!r?.geometry)throw Error('Lagret geometri mangler for '+ref);
 return r;
}
function atlasStyle(ref){
 const selected=selectedParks.has(ref)||lastSelectedRef===ref;
 const trail=isTrailLink(linkTable[ref]);
 return {color:selected?(trail?'#14532d':'#1d4ed8'):(trail?'#15803d':'#3388ff'),weight:selected?3:1.5,opacity:.9,fillColor:selected?'#1d4ed8':'#3388ff',fillOpacity:selected?.22:.09};
}
function atlasBuildLayer(ref,geometry){
 const p=pota.find(x=>x.reference===ref);if(!p)return null;
 const lyr=L.geoJSON(geometry,{pane:'atlasPane',renderer:geometryAtlas.renderer,style:()=>atlasStyle(ref),pointToLayer:(f,ll)=>L.circleMarker(ll,{pane:'atlasPane',renderer:geometryAtlas.renderer,radius:5,...atlasStyle(ref)})});
 if(isKyststienPark(p)){
  const polygons=trailCorridorPolygonsFromLayer(lyr);
  if(polygons.length)lyr.addLayer(L.geoJSON({type:'MultiPolygon',coordinates:polygons},{pane:'atlasPane',renderer:geometryAtlas.renderer,style:{color:'#15803d',weight:1,fillColor:'#22c55e',fillOpacity:.16}}));
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
 updateOverlaps();
 const jobs=[];
 for(const [ref,geometry] of geometryAtlas.overviewByRef){
  if(!atlasInCountry(ref)){const lyr=geometryAtlas.layers.get(ref);if(lyr)map.removeLayer(lyr);continue}
  const meta=atlasMeta(ref);if(!meta)continue;
  const bb=meta.bbox,near=b.intersects(L.latLngBounds([bb[1],bb[0]],[bb[3],bb[2]]));
  if(!geometryAtlas.layers.has(ref))atlasShow(ref,geometry);
  else if(!map.hasLayer(geometryAtlas.layers.get(ref)))geometryAtlas.layers.get(ref).addTo(map);
  if(detail&&near)jobs.push(ref);
 }
 atlasFilterPoints();
 // Four concurrent shard fetches, with shared promises and a stale-view guard.
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(4,jobs.length)},async()=>{
  while(cursor<jobs.length){const ref=jobs[cursor++];try{const r=await atlasRecord(ref);if(epoch!==geometryAtlas.epoch)return;if(geometryAtlas.records.get(ref)!==r){geometryAtlas.records.set(ref,r);atlasShow(ref,r.geometry)}}catch(e){console.warn('Geometri:',ref,e.message)}}
 }));
 if(epoch===geometryAtlas.epoch){atlasReport();scheduleAtlasOverlaps()}
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
function atlasPick(latlng,clickedRef){
 const refs=[...geometryAtlas.byRef].filter(([ref,g])=>atlasInCountry(ref)&&atlasHit(g,latlng)).map(([ref])=>ref);
 if(clickedRef&&!refs.includes(clickedRef))refs.push(clickedRef);
 if(refs.length===1){const p=pota.find(x=>x.reference===refs[0]);if(p)showLink(p,true,false,latlng);return}
 if(!refs.length)return;
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

// Automatic overlap uses the same country/view and geometry detail as the atlas.
const atlasOverlapState={epoch:0,timer:null,cache:new WeakMap(),pairs:[]};
function atlasOverlapPolygons(geometry){
 if(atlasOverlapState.cache.has(geometry))return atlasOverlapState.cache.get(geometry);
 const polygons=[];
 function walk(g){
  if(!g)return;
  if(g.type==='GeometryCollection'){for(const child of g.geometries||[])walk(child)}
  else if(g.type==='Polygon')polygons.push(...reconstructPolygonRings(g.coordinates));
  else if(g.type==='MultiPolygon'){for(const coordinates of g.coordinates)polygons.push(...reconstructPolygonRings(coordinates))}
  else if(g.type==='LineString'||g.type==='MultiLineString'){
   const buffered=trailCorridorPolygonsFromLayer({toGeoJSON:()=>g});polygons.push(...buffered);
  }
 }
 walk(geometry);atlasOverlapState.cache.set(geometry,polygons);return polygons;
}
function scheduleAtlasOverlaps(){
 const epoch=++atlasOverlapState.epoch;clearTimeout(atlasOverlapState.timer);
 atlasOverlapState.timer=setTimeout(()=>refreshAtlasOverlaps(epoch).catch(e=>console.warn('Overlapp:',e.message)),120);
}
async function refreshAtlasOverlaps(epoch){
 if(!geometryAtlas.ready||typeof polygonClipping==='undefined')return;
 const bounds=map.getBounds(),west=bounds.getWest(),east=bounds.getEast(),south=bounds.getSouth(),north=bounds.getNorth();
 const view=[[[west,south],[east,south],[east,north],[west,north],[west,south]]];
 const candidates=[];
 // Clip to the viewport first, so detailed boundaries outside the map cost nothing.
 let slice=performance.now();
 for(const [ref,geometry] of geometryAtlas.byRef){
  if(!atlasInCountry(ref))continue;
  const bb=atlasMeta(ref)?.bbox;if(!bb)continue;
  const pad=.001; // Include the 30.5 m trail buffer at the source bounds.
  if(bb[0]-pad>east||bb[2]+pad<west||bb[1]-pad>north||bb[3]+pad<south)continue;
  try{
   const polygons=atlasOverlapPolygons(geometry);
   if(polygons.length){const clipped=polygonClipping.intersection(polygons,view);if(clipped.length)candidates.push({ref,polygons:clipped,box:[Math.max(west,bb[0]-pad),Math.max(south,bb[1]-pad),Math.min(east,bb[2]+pad),Math.min(north,bb[3]+pad)]})}
  }catch(e){console.warn('Overlappsgeometri:',ref,e.message)}
  if(performance.now()-slice>12){await new Promise(r=>setTimeout(r,0));if(epoch!==atlasOverlapState.epoch)return;slice=performance.now()}
 }
 candidates.sort((a,b)=>a.box[0]-b.box[0]);
 const results=[];
 for(let i=0;i<candidates.length;i++){
  const a=candidates[i];
  for(let j=i+1;j<candidates.length&&candidates[j].box[0]<=a.box[2];j++){
   const b=candidates[j];if(a.box[1]>b.box[3]||a.box[3]<b.box[1])continue;
   try{
    const coordinates=polygonClipping.intersection(a.polygons,b.polygons);
    if(coordinates.length)results.push({refs:[a.ref,b.ref],geometry:{type:'MultiPolygon',coordinates}});
   }catch(e){console.warn('Overlappsberegning:',a.ref,b.ref,e.message)}
   if(performance.now()-slice>12){await new Promise(r=>setTimeout(r,0));if(epoch!==atlasOverlapState.epoch)return;slice=performance.now()}
  }
 }
 if(epoch!==atlasOverlapState.epoch)return;
 overlapLayer.clearLayers();atlasOverlapState.pairs=results;
 const parkByRef=new Map(pota.map(p=>[p.reference,p]));
 for(const result of results){
  const layer=L.geoJSON(result.geometry,{pane:'overlapPane',style:{color:'#7e22ce',weight:1,fillColor:'#a855f7',fillOpacity:.48}});
  layer.bindTooltip(result.refs.map(ref=>`<b>${esc(ref)}</b><br>${esc(parkByRef.get(ref)?.name||ref)}`).join('<hr>'),{pane:'topTooltipPane',sticky:true,opacity:.96,className:'pota-hover-tooltip'});
  layer.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);atlasPick(e.latlng,null)});layer.addTo(overlapLayer);
 }
 document.dispatchEvent(new CustomEvent('pota:overlaps'));
}
