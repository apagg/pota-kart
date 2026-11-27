const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){fail({code:1})}}}));
 await page.route('https://api.pota.app/park/stats/**',r=>r.fulfill({json:{activations:17},headers:{'Access-Control-Allow-Origin':'*'}}));
 await page.goto('http://127.0.0.1:8765');
 await page.waitForFunction(()=>typeof geometryAtlas!=='undefined'&&geometryAtlas.ready,null,{timeout:120000});
 const refs=await page.evaluate(async()=>{
  clearSelectedParks();clearSelection();
  const center=L.latLng(30,10),origin=map.project(center,10);
  const ll=(x,y)=>map.unproject(origin.add([x,y]),10),coord=(x,y)=>{const p=ll(x,y);return [p.lng,p.lat]};
  const ring=(size)=>[coord(-size/2,-size/2),coord(size/2,-size/2),coord(size/2,size/2),coord(-size/2,size/2),coord(-size/2,-size/2)];
  const shapes=[{type:'Polygon',coordinates:[ring(16),ring(6)]},{type:'Polygon',coordinates:[ring(16)]},{type:'Polygon',coordinates:[ring(120)]},{type:'LineString',coordinates:[coord(150,0),coord(270,.5)]},{type:'Polygon',coordinates:[ring(16)]}];
  const refs=['NO-ZOOM-A','NO-ZOOM-B','NO-ZOOM-LARGE','NO-ZOOM-TRAIL','SE-ZOOM-SMALL'],records={};
  for(let i=0;i<refs.length;i++){
   const ref=refs[i],geometry=shapes[i],pt=i===1?ll(50,0):i===3?ll(210,0):center;
   const p={reference:ref,name:'Zoom fixture '+ref,latitude:pt.lat,longitude:pt.lng};pota.push(p);geometryAtlas.parkByRef.set(ref,p);
   const record=records[ref]={name:p.name,id:ref,source:'norway',geometry};
   const bbox=turf.bbox({type:'Feature',properties:{},geometry});
   geometryAtlas.indexes[ref.slice(0,2)].parks[ref]={bbox,shard:'adaptive-fixtures.json'};
   linkTable[ref]={officialName:p.name,type:i===3?'State Trail':'Nature Reserve',layer:i===3?'trail':null};
   geometryAtlas.records.set(ref,record);geometryAtlas.overviewByRef.set(ref,geometry);atlasShow(ref,geometry);
   const marker=L.circleMarker(pt,{pane:'potaPane',radius:6,weight:1,color:gpsParkColor(ref),fillColor:gpsParkColor(ref),fillOpacity:.9,className:ref});
   bindParkHover(marker,p,linkTable[ref]);marker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);showLink(p,true,false)});
   potaMarkers.push({reference:ref,country:ref.slice(0,2),marker});
  }
  for(const cc of ['NO','SE'])geometryAtlas.shards.set(cc+'/adaptive-fixtures.json',Promise.resolve(records));
  window.zoomFixture={center,inside:ll(-6,0),refs,geometry:shapes[0]};
  map.setView(center,10,{animate:false});await atlasRefresh();return refs;
 });
 const state=()=>page.evaluate(refs=>refs.map(ref=>({ref,point:layers.pts.hasLayer(potaMarkers.find(x=>x.reference===ref).marker),geometry:map.hasLayer(geometryAtlas.layers.get(ref)),selected:selectedParks.get(ref)?.geo?map.hasLayer(selectedParks.get(ref).geo):null})),refs);
 const zoom=async z=>{await page.evaluate(async z=>{map.setView(zoomFixture.center,z,{animate:false});await atlasRefresh()},z);};
 const expectPoints=async yes=>{const rows=await state();for(const row of rows.filter(x=>[refs[0],refs[1],refs[4]].includes(x.ref))){assert.equal(row.point,yes,row.ref);assert.equal(row.geometry,!yes,row.ref);if(row.selected!==null)assert.equal(row.selected,!yes,row.ref)}assert.equal(rows[2].geometry,true,'Large polygon remains geometry');assert.equal(rows[3].geometry,true,'Long thin trail remains geometry');};
 await expectPoints(true);
 assert(await page.evaluate(()=>atlasHasGeometry('NO-ZOOM-A')));
 assert.deepEqual(await page.evaluate(()=>atlasRefsAt(zoomFixture.inside).filter(r=>zoomFixture.refs.includes(r))),[refs[2]],'Hidden polygons are not picked through their replacement points');
 await page.waitForFunction(()=>atlasOverlapState.pairs.some(x=>x.refs.includes('NO-ZOOM-A')&&x.refs.includes('NO-ZOOM-B')),null,{timeout:60000});
 assert(await page.evaluate(()=>[...atlasOverlapState.layers.values()].filter(x=>x.refs.includes('NO-ZOOM-A')).every(x=>!overlapLayer.hasLayer(x.layer))),'Overlaps are retained but hidden for point parks');
 // A real marker click must preserve zoom and center, keep the selected geometry hidden.
 await page.locator('path.NO-ZOOM-A').click();await page.waitForFunction(()=>selectedParks.has('NO-ZOOM-A'));
 assert.equal(await page.evaluate(()=>map.getZoom()),10);await expectPoints(true);
 const selectedId=await page.evaluate(()=>L.stamp(selectedParks.get('NO-ZOOM-A').geo));
 const colors=await page.evaluate(async()=>{
  const ref='NO-ZOOM-A',p=pota.find(p=>p.reference===ref),m=potaMarkers.find(x=>x.reference===ref).marker,original=parkActivations.has;
  parkActivations.has=r=>r===ref;document.dispatchEvent(new CustomEvent('pota:display'));await new Promise(requestAnimationFrame);const yellow=m.options.color;
  gpsWatchId=42;lastGps={lat:zoomFixture.inside.lat,lon:zoomFixture.inside.lng};await updateGpsParkColors();await new Promise(requestAnimationFrame);const green=m.options.color,inside=gpsInsideRefs.has(ref),usesPoint=gpsPointHit(p,zoomFixture.inside);
  lastGps={lat:zoomFixture.center.lat,lon:zoomFixture.center.lng};await updateGpsParkColors();const hole=gpsInsideRefs.has(ref);
  gpsWatchId=null;lastGps=null;parkActivations.has=original;await updateGpsParkColors();return {yellow,green,inside,usesPoint,hole};
 });
 assert.deepEqual(colors,{yellow:'#a16207',green:'#15803d',inside:true,usesPoint:false,hole:false},'GPS uses full boundaries and holes, not the replacement marker radius');
 await page.screenshot({path:'atlas-adaptive-points-desktop.png'});
 await zoom(10.5);await expectPoints(true);await zoom(10.75);await expectPoints(false);
 assert.equal(await page.evaluate(()=>L.stamp(selectedParks.get('NO-ZOOM-A').geo)),selectedId,'Selected layer is reused');
 await page.waitForFunction(()=>[...atlasOverlapState.layers.values()].some(x=>x.refs.includes('NO-ZOOM-A')&&overlapLayer.hasLayer(x.layer)),null,{timeout:60000});
 await zoom(10.5);await expectPoints(false);await zoom(10);await expectPoints(true);
 // Panning, resize and overview/detail changes cannot change a park's full extent.
 await page.evaluate(async()=>{map.panBy([30,0],{animate:false});await atlasRefresh()});await expectPoints(true);
 await page.locator('#desktopSettings').evaluate(e=>e.open=true);await page.selectOption('#countryFilter','SE');
 await page.waitForFunction(()=>layers.pts.hasLayer(potaMarkers.find(x=>x.reference==='SE-ZOOM-SMALL').marker));
 assert(await page.evaluate(()=>potaMarkers.filter(x=>x.country==='NO').every(x=>!layers.pts.hasLayer(x.marker))));
 await page.selectOption('#countryFilter','ALL');
 await page.selectOption('#parkDisplayMode','points');await zoom(12);
 assert(await page.evaluate(()=>zoomFixture.refs.every(ref=>layers.pts.hasLayer(potaMarkers.find(x=>x.reference===ref).marker)&&!map.hasLayer(geometryAtlas.layers.get(ref)))));
 await page.selectOption('#parkDisplayMode','geometry');await page.waitForFunction(()=>map.hasLayer(geometryAtlas.layers.get('NO-ZOOM-A')));
 // The same thresholds and selectable points apply in the mobile sheet.
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.body.classList.contains('mobile-layout'));
 await zoom(10);await expectPoints(true);await page.locator('path.NO-ZOOM-A').click();
 await page.waitForFunction(()=>document.getElementById('mobileParkRef').textContent==='NO-ZOOM-A');
 assert.equal(await page.evaluate(()=>map.getZoom()),10);await expectPoints(true);
 await page.screenshot({path:'atlas-adaptive-points-mobile.png'});
 await zoom(10.5);await expectPoints(true);await zoom(10.75);await expectPoints(false);
 await page.screenshot({path:'atlas-adaptive-geometry-mobile.png'});
 assert.equal(await page.evaluate(()=>selectedParks.size),1);assert.deepEqual(errors,[]);
 console.log('PASS adaptive points: 20/24 px hysteresis, whole bounds, long thin trails, PC/mobile marker clicks, selected layer reuse, no hidden geometry picks, full GPS holes/colors, preserved overlap results, country filter and explicit points mode');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
