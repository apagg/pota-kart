const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Controlled GPS callbacks exercise motion, cancellation and recoverable errors.
 await page.addInitScript(()=>{
  const state=window.testGps={next:0,watches:new Map(),cleared:[],oneShotCalls:0};
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
   watchPosition(success,error,options){const id=state.next++;state.watches.set(id,{success,error,options});return id},
   clearWatch(id){state.cleared.push(id)},
   getCurrentPosition(){state.oneShotCalls++;throw Error('Expected continuous GPS')}
  }});
 });
 // Deterministic POTA responses verify zero, caching, failures and stale replies.
 const statRequests={};await page.route('https://api.pota.app/park/stats/**',async route=>{
  const ref=route.request().url().split('/').pop();statRequests[ref]=(statRequests[ref]||0)+1;
  if(ref==='NO-3198')await route.fulfill({headers:{"Access-Control-Allow-Origin":"*"},json:{reference:ref,activations:0}});
  else if(ref==='NO-3374'){await new Promise(r=>setTimeout(r,200));await route.fulfill({headers:{"Access-Control-Allow-Origin":"*"},json:{reference:ref,activations:17}})}
  else await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},status:503,body:'Unavailable'});
 });
 console.log('Opening test map');await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>typeof geometryAtlas!=='undefined'&&geometryAtlas.ready,null,{timeout:120000});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Kartet viser'),null,{timeout:120000});
 await page.evaluate(()=>{window.overlapHeartbeats=0;window.overlapHeartbeatTimer=setInterval(()=>window.overlapHeartbeats++,10)});
 console.log('Atlas initialized');const counts=await page.evaluate(()=>({geometry:geometryAtlas.byRef.size,points:layers.pts.getLayers().length,parks:pota.length}));assert(counts.geometry>5000,JSON.stringify(counts));assert.equal(counts.geometry+counts.points,counts.parks);
 console.log('Restored Swedish national parks');
 const restored={'SE-0006':'2001223','SE-0011':'2000934','SE-0016':'2014914','SE-0021':'2001214','SE-0026':'2049265','SE-0028':'2001828','SE-0030':'2001830'};
 for(const [ref,id] of Object.entries(restored)){
  const info=await page.evaluate(async ref=>{const meta=atlasMeta(ref),record=await atlasRecord(ref);return {id:String(record?.id),type:record?.officialType,visible:map.hasLayer(geometryAtlas.layers.get(ref)),hasGeometry:atlasHasGeometry(ref),marker:potaMarkers.some(x=>x.reference===ref&&layers.pts.hasLayer(x.marker))}},ref);
  assert.equal(info.id,id,ref);assert.equal(info.type,'Nationalpark',ref);assert(info.visible&&info.hasGeometry,ref);assert.equal(info.marker,false,ref);
 }
 console.log('Restored same-name Swedish reserves');
 const restoredReserves={"SE-0044":{"id":"2000143","type":"Naturreservat","name":"Häringe-Hammersta Nature Reserve"},"SE-0075":{"id":"2001963","type":"Naturreservat","name":"Äskhult Nature Reserve"},"SE-0083":{"id":"2052884","type":"Naturreservat","name":"Härskogen Nature Reserve"},"SE-0092":{"id":"2002023","type":"Naturreservat","name":"Vesslunda Nature Reserve"},"SE-0104":{"id":"2000038","type":"Naturreservat","name":"Halen Nature Reserve"},"SE-0122":{"id":"2001391","type":"Naturreservat","name":"Ulriksdal Nature Reserve"},"SE-0220":{"id":"2002310","type":"Naturreservat","name":"Taberg Nature Reserve"},"SE-0278":{"id":"2001390","type":"Naturreservat","name":"Bornsjön Nature Reserve"},"SE-0280":{"id":"2000788","type":"Naturreservat","name":"Hålta Nature Reserve"},"SE-0330":{"id":"2001231","type":"Naturreservat","name":"Lysegården Nature Reserve"},"SE-0334":{"id":"2032589","type":"Naturreservat","name":"Marstrand Nature Reserve"},"SE-0468":{"id":"2000791","type":"Naturreservat","name":"Tofta Nature Reserve"},"SE-1023":{"id":"2012976","type":"Naturreservat","name":"Tyllinge Nature Reserve"},"SE-1235":{"id":"2002683","type":"Naturreservat","name":"Arontorp Nature Reserve"},"SE-1428":{"id":"2000529","type":"Naturreservat","name":"Hullsjön Nature Reserve"},"SE-1458":{"id":"2001110","type":"Naturreservat","name":"Tyresta Nature Reserve"},"SE-1460":{"id":"2047798","type":"Naturreservat","name":"Klövberget Nature Reserve"},"SE-1733":{"id":"2001867","type":"Naturreservat","name":"Herrfallet Nature Reserve"},"SE-1801":{"id":"2000696","type":"Naturreservat","name":"Norrfällsviken Nature Reserve"},"SE-2050":{"id":"2000416","type":"Naturreservat","name":"Torpanäset Nature Reserve"},"SE-2153":{"id":"2005013","type":"Kulturreservat","name":"Äskhult National Heritage Area"},"SE-2214":{"id":"2000413","type":"Naturreservat","name":"Gullbringa Nature Reserve"},"SE-1319":{"id":"2043731","type":"Naturreservat","name":"Fyledalen Nature Reserve"},"SE-1783":{"id":"2001300","type":"Naturreservat","name":"Ridö-Sundbyholmsarkipelagen Nature Reserve"},"SE-2032":{"id":"2001952","type":"Naturvårdsområde","name":"Hökensås Protected Landscape"},"SE-2033":{"id":"2002586","type":"Naturvårdsområde","name":"Hökensås Protected Landscape"}};
 for(const [ref,expected] of Object.entries(restoredReserves)){
  const info=await page.evaluate(async ref=>{const record=await atlasRecord(ref);return {id:String(record?.id),type:record?.officialType,visible:map.hasLayer(geometryAtlas.layers.get(ref)),geometry:atlasHasGeometry(ref),marker:potaMarkers.some(x=>x.reference===ref&&layers.pts.hasLayer(x.marker))}},ref);
  assert.equal(info.id,expected.id,ref);assert.equal(info.type,expected.type,ref);assert(info.visible&&info.geometry,ref);assert.equal(info.marker,false,ref);
 }
 console.log('SE-2071 separate exterior rings');
 const ramsvik=await page.evaluate(async()=>{
  const record=await atlasRecord('SE-2071'),polygons=atlasOverlapPolygons(record.geometry);
  const overlaps=polygons.map(p=>polygonClipping.intersection(polygons,[p]));
  const hits=polygons.map(p=>{const c=p[0][0];return atlasHit(record.geometry,L.latLng(c[1],c[0]))});
  const area=overlapAreaHaForPolygons(polygons);
  return {polygons:polygons.length,holes:polygons.reduce((n,p)=>n+p.length-1,0),area,hitEveryPart:hits.every(Boolean),overlapEveryPart:overlaps.every(x=>x.length>0)};
 });
 assert.equal(ramsvik.polygons,11);assert.equal(ramsvik.holes,0);assert(ramsvik.area>840&&ramsvik.area<860);assert(ramsvik.hitEveryPart);assert(ramsvik.overlapEveryPart);
 // Reordered exteriors and genuine holes must keep distinct meanings.
 const topology=await page.evaluate(()=>{
  const outer=[[0,0],[10,0],[10,10],[0,10],[0,0]],hole=[[2,2],[4,2],[4,4],[2,4],[2,2]],island=[[20,0],[22,0],[22,2],[20,2],[20,0]];
  const geometry={type:'Polygon',coordinates:[hole,island,outer]},polygons=atlasOverlapPolygons(geometry);
  return {parts:polygons.length,holes:polygons.reduce((n,p)=>n+p.length-1,0),holeHit:atlasHit(geometry,L.latLng(3,3)),islandHit:atlasHit(geometry,L.latLng(1,21)),holeOverlap:polygonClipping.intersection(polygons,[hole]).length};
 });
 assert.deepEqual(topology,{parts:2,holes:1,holeHit:false,islandHit:true,holeOverlap:0});
 console.log('Country filter');await page.selectOption('#countryFilter','NO');await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>potaMarkers.filter(x=>x.country==='SE'&&layers.pts.hasLayer(x.marker)).length),0);
 console.log('Automatic overlap without selection');
 const automaticPair=await page.evaluate(()=>{
  const groups=new Map();for(const [ref,meta] of Object.entries(geometryAtlas.indexes.NO.parks)){const key=meta.source+':'+meta.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(ref)}
  const pair=[...groups.values()].find(refs=>refs.length>1);if(!pair)throw Error('No shared geometry fixture');
  map.fitBounds(geometryAtlas.layers.get(pair[0]).getBounds(),{maxZoom:11});return pair.slice(0,2);
 });
 await page.waitForFunction(refs=>atlasOverlapState.pairs.some(p=>refs.every(ref=>p.refs.includes(ref))),automaticPair,{timeout:60000});
 assert.equal(await page.evaluate(()=>selectedParks.size),0);assert(await page.evaluate(()=>overlapLayer.getLayers().length)>0);
 assert.equal(await page.evaluate(()=>atlasOverlapState.worker instanceof Worker),true);
 assert(await page.evaluate(()=>window.overlapHeartbeats)>10);await page.evaluate(()=>clearInterval(window.overlapHeartbeatTimer));
 const completed=await page.evaluate(()=>atlasOverlapState.completed);await page.evaluate(()=>{map.panBy([1,0],{animate:false})});
 await page.waitForFunction(n=>atlasOverlapState.completed>n,completed,{timeout:60000});assert(await page.evaluate(()=>atlasOverlapState.stats.cacheHits)>0);

 await page.selectOption('#countryFilter','SE');await page.waitForFunction(()=>atlasOverlapState.pairs.every(p=>p.refs.every(ref=>ref.startsWith('SE-'))));
 await page.selectOption('#countryFilter','NO');await page.waitForFunction(refs=>atlasOverlapState.pairs.some(p=>refs.every(ref=>p.refs.includes(ref))),automaticPair,{timeout:60000});
 console.log('Selecting Enhusvidda');await page.fill('#q','NO-3198');await page.click('#search');await page.waitForFunction(()=>selectedParks.has('NO-3198'),null,{timeout:60000});
 assert.equal(await page.evaluate(()=>selectedParks.get('NO-3198').marker),null);assert.equal(await page.evaluate(()=>!!selectedParks.get('NO-3198').geo),true);
 assert.equal(await page.evaluate(()=>potaMarkers.filter(x=>x.reference==='NO-3198'&&layers.pts.hasLayer(x.marker)).length),0);
 await page.waitForFunction(()=>document.querySelector('#linkbox [data-pota-activation-count]')?.textContent==='0');
 assert.doesNotMatch(await page.locator('#linkbox').innerText(),/Valgt POTA-park:|Type:|Matchmetode:|Denne koblingen/);
 console.log('Geometry mouseover and repeated click');
 const selectedId=await page.evaluate(()=>L.stamp(selectedParks.get('NO-3198').geo));
 const hover=await page.evaluate(()=>{map.closePopup();const g=selectedParks.get('NO-3198').geo;const c=turf.pointOnFeature(g.toGeoJSON()).geometry.coordinates;map.setView([c[1],c[0]],15);return c});
 await page.waitForTimeout(1500);
 const screen=await page.evaluate(c=>{const p=map.latLngToContainerPoint([c[1],c[0]]),r=map.getContainer().getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y}},hover);
 await page.mouse.move(screen.x,screen.y);await page.screenshot({path:'atlas-hover.png'});
 console.log('Hover diagnostic',await page.evaluate(()=>({tooltips:[...document.querySelectorAll('.leaflet-tooltip')].map(x=>x.textContent),centerElement:document.elementFromPoint(innerWidth/2,innerHeight/2)?.outerHTML.slice(0,400),hasTooltip:!!selectedParks.get('NO-3198').geo.getTooltip()})));
 await page.locator('.leaflet-tooltip').filter({hasText:'NO-3198'}).waitFor({state:'visible'});
 for(let i=0;i<2;i++){
  await page.evaluate(()=>{map.closePopup()});await page.mouse.click(screen.x,screen.y);
  const choice=page.locator('.leaflet-popup button').filter({hasText:'NO-3198'});if(await choice.count())await choice.click();
  const link=page.locator('.leaflet-popup a[href="https://pota.app/#/park/NO-3198"]').last();await link.waitFor({state:'visible'});assert.equal(await link.getAttribute('target'),'_blank');assert.match(await link.getAttribute('rel'),/noopener/);
  await page.waitForFunction(()=>[...document.querySelectorAll('.leaflet-popup [data-pota-activation-count]')].at(-1)?.textContent==='0');
  assert.equal(await page.evaluate(()=>L.stamp(selectedParks.get('NO-3198').geo)),selectedId);
 }
 await page.waitForTimeout(500);await page.waitForFunction(()=>!atlasOverlapState.busy,null,{timeout:60000});
 const requests=await page.evaluate(()=>atlasOverlapState.requests);
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-3198'),false,false)});await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>atlasOverlapState.requests),requests,'park selection must not recompute automatic overlaps');
 assert.equal(statRequests['NO-3198'],1);
 await page.screenshot({path:'atlas-desktop.png'});

 await page.selectOption('#countryFilter','SE');await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>map.hasLayer(selectedParks.get('NO-3198').geo)),false);
 await page.selectOption('#countryFilter','NO');await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>map.hasLayer(selectedParks.get('NO-3198').geo)),true);
 // Shared source geometry must offer every POTA park, including unselected parks.
 console.log('Overlap chooser');const overlap=await page.evaluate(()=>{
  const groups=new Map();for(const [ref,meta] of Object.entries(geometryAtlas.indexes.NO.parks)){const key=meta.source+':'+meta.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(ref)}
  const pair=[...groups.values()].find(x=>x.length>1);if(!pair)return null;
  const geo=geometryAtlas.byRef.get(pair[0]);let g=geo;while(g.type==='GeometryCollection')g=g.geometries[0];const c=g.type==='Polygon'?g.coordinates[0][0]:g.coordinates[0][0][0];atlasPick(L.latLng(c[1],c[0]),pair[0]);return pair;
 });
 if(overlap){await page.getByText('Velg POTA-park',{exact:true}).waitFor();for(const ref of overlap)assert(await page.locator('.leaflet-popup button').filter({hasText:ref}).count()>0);await page.evaluate(()=>{map.closePopup()})}
 console.log('Return to overview after zooming out');
 await page.evaluate(()=>{map.setZoom(5)});
 await page.waitForFunction(()=>geometryAtlas.byRef.get('NO-3198')===geometryAtlas.overviewByRef.get('NO-3198'),null,{timeout:60000});
 assert(await page.evaluate(()=>geometryAtlas.records.has('NO-3198')));
 // Rapid taps must keep each park's own geometry.
 await page.evaluate(async()=>{await Promise.all([showLink(pota.find(p=>p.reference==='NO-3374'),false,false),showLink(pota.find(p=>p.reference==='NO-3198'),false,false)])});
 assert.equal(await page.evaluate(()=>selectedGeometryMeta(selectedParks.get('NO-3374')).ids.includes('94448')),true);
 assert.equal(await page.evaluate(()=>getPotaActivationCount('NO-3374')),17);
 await page.waitForTimeout(300);assert.match(await page.locator('#linkbox').innerText(),/NO-3198/);assert.equal(await page.locator('#linkbox [data-pota-activation-count]').innerText(),'0');
 console.log('Kyststien');await page.fill('#q','NO-2542');await page.click('#search');await page.waitForFunction(()=>selectedParks.has('NO-2542'),null,{timeout:60000});
 assert.equal(await page.evaluate(()=>TRAIL_CORRIDOR_WIDTH_M),61);assert(await page.evaluate(()=>trailCorridorPolygonsFromLayer(selectedParks.get('NO-2542').geo).length)>0);
 assert.equal(await page.evaluate(()=>{const colors=[];const visit=x=>{if(x.eachLayer)x.eachLayer(visit);else if(x.options.color)colors.push(x.options.color)};visit(selectedParks.get('NO-2542').geo);return colors.every(c=>c==='#1d4ed8')}),true);
 await page.click('#clearSelected');assert.equal(await page.evaluate(()=>selectedParks.size),0);assert(await page.evaluate(()=>geometryAtlas.layers.get('NO-2542')&&map.hasLayer(geometryAtlas.layers.get('NO-2542'))));
 const missing=await page.evaluate(()=>pota.find(p=>countryOf(p)==='NO'&&!atlasHasGeometry(p.reference)).reference);
 await page.fill('#q',missing);await page.click('#search');await page.waitForFunction(ref=>selectedParks.has(ref),missing);assert.equal(await page.evaluate(ref=>!!selectedParks.get(ref).marker,missing),true);assert.equal(await page.evaluate(ref=>selectedParks.get(ref).geo,missing),null);
 await page.waitForFunction(()=>document.querySelector('#linkbox [data-pota-activation-count]')?.textContent==='ikke tilgjengelig');
 const reserveLink=page.locator('#linkbox a');assert.equal(await reserveLink.getAttribute('href'),'https://pota.app/#/park/'+missing);
 console.log('Mobile controls');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(800);assert.equal(await page.locator('.mobile-nav').isVisible(),true);assert.match(await page.locator('.mobile-brand').innerText(),/0\.11\.0 test/);
 await page.getByRole('button',{name:'Innstillinger',exact:true}).click();await page.selectOption('#baseMapSelect','satellite');assert.equal(await page.evaluate(()=>activeBase===baseLayers.satellite),true);
 await page.getByRole('button',{name:'Kart',exact:true}).click();await page.screenshot({path:'atlas-mobile.png'});
 console.log('Compact mobile park sheet');
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-3198'),false,false)});
 await page.waitForFunction(()=>document.querySelector('#mobileActivationCount').textContent==='0');
 assert.equal(await page.locator('#mobileDetailsToggle').count(),0);assert.equal(await page.locator('#mobileParkSummary').isVisible(),true);
 assert.equal(await page.locator('#mobilePotaLink').getAttribute('href'),'https://pota.app/#/park/NO-3198');assert.equal(await page.locator('#mobilePotaLink').getAttribute('target'),'_blank');assert.match(await page.locator('#mobilePotaLink').getAttribute('rel'),/noopener/);
 assert.equal(await page.locator('#mobileSelectionToggle').isVisible(),true);assert.equal(await page.locator('#status').isVisible(),false);assert.equal(await page.locator('#linkbox').isVisible(),false);
 const compactHeight=await page.locator('#infoPanel').evaluate(el=>el.getBoundingClientRect().height);assert(compactHeight<190,'compact sheet height '+compactHeight);
 await page.screenshot({path:'atlas-mobile-compact.png'});
 const handle=await page.locator('#mobileHandle').boundingBox();await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2,handle.y-65,{steps:6});await page.mouse.up();
 assert.equal(await page.locator('#mobileHandle').getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#status').isVisible(),false);assert.equal(await page.locator('.info-more>summary').isVisible(),false);assert.equal(await page.locator('.info-more').getAttribute('open'),'');
 assert.doesNotMatch(await page.locator('#infoPanel').innerText(),/Valgt område:|register-ID|offisiell type:|Miljødirektoratets Naturbase/);
 await page.screenshot({path:'atlas-mobile-expanded.png'});
 await page.click('#mobileHandle');assert.equal(await page.locator('#mobileHandle').getAttribute('aria-expanded'),'false');
 await page.click('#mobileSelectionToggle');assert.equal(await page.evaluate(()=>selectedParks.has('NO-3198')),false);await page.click('#mobileSelectionToggle');await page.waitForFunction(()=>selectedParks.has('NO-3198'));
 // Delayed stats update the compact summary and cannot overwrite the next park.
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-3374'),false,false)});await page.waitForFunction(()=>document.querySelector('#mobileActivationCount').textContent==='17');
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-3198'),false,false)});await page.waitForFunction(()=>document.querySelector('#mobileActivationCount').textContent==='0');
 console.log('GPS follows, pauses on drag and resumes with the same button');
 const dragMap=async()=>{const pt=await page.evaluate(()=>{const r=map.getContainer().getBoundingClientRect();return {x:r.left+r.width*.6,y:r.top+r.height*.4}});await page.mouse.move(pt.x,pt.y);await page.mouse.down();await page.mouse.move(pt.x+60,pt.y+40,{steps:8});await page.mouse.up();await page.waitForTimeout(100);await page.evaluate(()=>{map.stop()});};
 await page.evaluate(()=>{
  selectedParks.set('GPS-FIXTURE',{link:{},geo:L.geoJSON({type:'Polygon',coordinates:[[[10,60],[10.02,60],[10.02,60.02],[10,60.02],[10,60]]]})});
 });
 const gpsButton=page.locator('#mobileLocate');
 await gpsButton.click();assert.equal(await gpsButton.getAttribute('aria-pressed'),'true');assert.equal(await gpsButton.getAttribute('aria-label'),'Stopp GPS');assert.equal(await gpsButton.isEnabled(),true);
 const emitGps=(id,latitude,longitude,accuracy)=>page.evaluate(({id,latitude,longitude,accuracy})=>testGps.watches.get(id).success({coords:{latitude,longitude,accuracy}}),{id,latitude,longitude,accuracy});
 await emitGps(0,60.01,10.01,12);
 await page.waitForFunction(()=>map.getCenter().distanceTo([60.01,10.01])<10);assert.equal(await page.locator('#mobileNotice').isVisible(),false);
 assert.match(await page.locator('#gpsStatus').innerText(),/Innenfor valgt POTA: GPS-FIXTURE/);
 const firstMarker=await page.evaluate(()=>L.stamp(gpsMarker));
 await emitGps(0,60.0105,10.0105,9);await page.waitForFunction(()=>map.getCenter().distanceTo([60.0105,10.0105])<10);
 assert.equal(await gpsButton.getAttribute('data-gps-state'),'following');await page.screenshot({path:'atlas-gps-following.png'});
 await dragMap();assert.equal(await gpsButton.getAttribute('data-gps-state'),'paused');assert.equal(await gpsButton.getAttribute('aria-pressed'),'true');assert.equal(await gpsButton.getAttribute('aria-label'),'Følg posisjon');const panned=await page.evaluate(()=>({lat:map.getCenter().lat,lng:map.getCenter().lng}));
 await page.screenshot({path:'atlas-gps-paused.png'});
 await emitGps(0,60.011,10.011,7);
 assert.equal(await page.evaluate(()=>L.stamp(gpsMarker)),firstMarker,'reuse position marker');assert.equal(await page.evaluate(()=>gpsAccuracy.getRadius()),7);
 assert.deepEqual(await page.evaluate(()=>({lat:map.getCenter().lat,lng:map.getCenter().lng})),panned,'GPS updates must preserve manual pan');
 await emitGps(0,60.05,10.05,20);assert.match(await page.locator('#gpsStatus').innerText(),/Ikke innenfor/);
 assert.deepEqual(await page.evaluate(()=>({lat:gpsMarker.getLatLng().lat,lng:gpsMarker.getLatLng().lng})),{lat:60.05,lng:10.05});
 await page.evaluate(()=>testGps.watches.get(0).error({code:3,message:'Timed out'}));assert.equal(await gpsButton.getAttribute('aria-pressed'),'true');assert.match(await page.locator('#gpsStatus').innerText(),/Oppfølgingen fortsetter/);assert.equal(await page.locator('#mobileNotice').isVisible(),false);
 await emitGps(0,60.01,10.01,5);assert.match(await page.locator('#gpsStatus').innerText(),/GPS-FIXTURE/);
 await gpsButton.click();assert.equal(await gpsButton.getAttribute('data-gps-state'),'following');await page.waitForFunction(()=>map.getCenter().distanceTo([60.01,10.01])<10);
 assert.equal(await page.evaluate(()=>testGps.watches.size),1,'resume reuses the GPS watch');
 await page.evaluate(()=>{map.setZoom(map.getZoom()-1,{animate:false})});const followZoom=await page.evaluate(()=>map.getZoom());
 await emitGps(0,60.012,10.012,5);await page.waitForFunction(()=>map.getCenter().distanceTo([60.012,10.012])<10);assert.equal(await page.evaluate(()=>map.getZoom()),followZoom,'following preserves zoom');
 await gpsButton.click();assert.equal(await gpsButton.getAttribute('data-gps-state'),'off');assert.equal(await gpsButton.getAttribute('aria-pressed'),'false');assert.deepEqual(await page.evaluate(()=>testGps.cleared),[0]);
 await emitGps(0,61,11,5);assert.equal(await page.evaluate(()=>gpsMarker),null);assert.match(await page.locator('#gpsStatus').innerText(),/slått av/);
 // Starting again follows new fixes and ignores callbacks from the old watch.
 await gpsButton.click();await emitGps(0,62,12,5);assert.equal(await page.evaluate(()=>gpsMarker),null);
 await emitGps(1,60.01,10.01,5);await page.waitForFunction(()=>map.getCenter().distanceTo([60.01,10.01])<10);assert.equal(await page.locator('#mobileNotice').isVisible(),false);
 await page.evaluate(()=>{selectedParks.delete('GPS-FIXTURE');document.dispatchEvent(new CustomEvent('pota:selection'))});assert.match(await page.locator('#gpsStatus').innerText(),/Ikke innenfor/);
 await page.evaluate(()=>testGps.watches.get(1).error({code:1,message:'Denied'}));assert.equal(await gpsButton.getAttribute('aria-pressed'),'false');assert.match(await page.locator('#gpsStatus').innerText(),/Posisjonstilgang er avslått/);assert.equal(await page.locator('#mobileNotice').isVisible(),false);
 assert.deepEqual(await page.evaluate(()=>testGps.cleared),[0,1]);assert.equal(await page.evaluate(()=>testGps.oneShotCalls),0);
 // Pausing before the first fix keeps the watch and does not move the map.
 await gpsButton.click();await dragMap();assert.equal(await gpsButton.getAttribute('data-gps-state'),'paused');
 await gpsButton.click();assert.equal(await gpsButton.getAttribute('data-gps-state'),'following');assert.equal(await page.evaluate(()=>testGps.watches.size),3);
 await gpsButton.click();await emitGps(2,63,13,5);assert.equal(await page.evaluate(()=>gpsMarker),null);
 assert.deepEqual(await page.evaluate(()=>testGps.watches.get(0).options),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
 await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(300);await page.click('#locateBtn');await emitGps(3,60.01,10.01,6);
 assert.equal(await page.locator('#locateBtn').getAttribute('aria-pressed'),'true');
 await emitGps(3,60.011,10.011,6);await page.waitForFunction(()=>map.getCenter().distanceTo([60.011,10.011])<10);
 await dragMap();assert.equal(await page.locator('#locateBtn').innerText(),'Følg posisjon');const desktopPan=await page.evaluate(()=>({lat:map.getCenter().lat,lng:map.getCenter().lng}));
 await emitGps(3,60.012,10.012,6);assert.deepEqual(await page.evaluate(()=>({lat:map.getCenter().lat,lng:map.getCenter().lng})),desktopPan);
 await page.click('#locateBtn');await page.waitForFunction(()=>map.getCenter().distanceTo([60.012,10.012])<10);assert.equal(await page.locator('#locateBtn').getAttribute('data-gps-state'),'following');
 await page.click('#locateBtn');assert.equal(await page.evaluate(()=>gpsMarker),null);
 console.log('GPS colors every containing park, respects holes and the fixed trail corridor');
 const colorRefs=['NO-COLOR-A','NO-COLOR-B','NO-COLOR-HOLE','NO-COLOR-TRAIL'];
 await page.evaluate(refs=>{
  const ring=(w,s,e,n)=>[[w,s],[e,s],[e,n],[w,n],[w,s]];
  const square={type:'Polygon',coordinates:[ring(11,31,11.01,31.01)]};
  const shapes=[square,square,{type:'Polygon',coordinates:[ring(11,31,11.01,31.01),ring(11.003,31.003,11.007,31.007)]},{type:'GeometryCollection',geometries:[{type:'LineString',coordinates:[[11,31.005],[11.01,31.005]]}]}];
  refs.forEach((ref,i)=>{const p={reference:ref,name:'Color fixture '+i,latitude:31.005,longitude:11.005};pota.push(p);geometryAtlas.parkByRef.set(ref,p);geometryAtlas.indexes.NO.parks[ref]={bbox:[11,31,11.01,31.01]};geometryAtlas.records.set(ref,{geometry:shapes[i]});atlasShow(ref,i===2?square:shapes[i]);});
  selectedParks.set(refs[0],{p:pota.find(p=>p.reference===refs[0]),link:{},geo:L.geoJSON(square,{style:{color:'#1d4ed8',fillColor:'#1d4ed8'}})});
 },colorRefs);
 const layerColor=ref=>page.evaluate(ref=>{let x=geometryAtlas.layers.get(ref);while(x.eachLayer)x=x.getLayers()[0];return x.options.color},ref);
 for(const ref of colorRefs)assert.equal(await layerColor(ref),'#3388ff');
 await page.click('#locateBtn');await emitGps(4,31.005,11.005,5);await page.evaluate(async()=>{await updateGpsParkColors()});
 assert.deepEqual(await page.evaluate(()=>[...gpsInsideRefs].sort()),['NO-COLOR-A','NO-COLOR-B','NO-COLOR-TRAIL']);
 assert.equal(await layerColor(colorRefs[0]),'#15803d');assert.equal(await layerColor(colorRefs[1]),'#15803d');assert.equal(await layerColor(colorRefs[2]),'#3388ff');assert.equal(await layerColor(colorRefs[3]),'#15803d');
 assert.equal(await page.evaluate(ref=>selectedParks.get(ref).geo.getLayers()[0].options.color,colorRefs[0]),'#15803d');
 await page.evaluate(()=>{map.fire('dragstart')});await emitGps(4,31.00518,11.005,5);await page.evaluate(async()=>{await updateGpsParkColors()});assert.equal(await layerColor(colorRefs[3]),'#15803d','20 m from trail is inside');
 await emitGps(4,31.0054,11.005,5);await page.evaluate(async()=>{await updateGpsParkColors()});assert.equal(await layerColor(colorRefs[3]),'#3388ff','44 m from trail is outside');assert.equal(await layerColor(colorRefs[0]),'#15803d');
 await emitGps(4,31.02,11.02,5);await page.evaluate(async()=>{await updateGpsParkColors()});for(const ref of colorRefs)assert.equal(await layerColor(ref),ref===colorRefs[0]?'#1d4ed8':'#3388ff');
 await emitGps(4,31.005,11.005,5);await page.evaluate(async()=>{await updateGpsParkColors()});
 await page.waitForTimeout(300);await page.waitForFunction(()=>!atlasOverlapState.busy);
 const colorJobs=await page.evaluate(()=>atlasOverlapState.requests);await page.evaluate(async()=>{await updateGpsParkColors()});assert.equal(await page.evaluate(()=>atlasOverlapState.requests),colorJobs,'color updates must not request overlap calculations');
 await page.click('#locateBtn');await page.click('#locateBtn');assert.equal(await page.evaluate(()=>gpsInsideRefs.size),0);
 for(const ref of colorRefs)assert.equal(await layerColor(ref),ref===colorRefs[0]?'#1d4ed8':'#3388ff');assert.equal(await page.evaluate(ref=>selectedParks.get(ref).geo.getLayers()[0].options.color,colorRefs[0]),'#1d4ed8');
 await page.evaluate(refs=>{for(const ref of refs){map.removeLayer(geometryAtlas.layers.get(ref));geometryAtlas.layers.delete(ref);geometryAtlas.byRef.delete(ref);geometryAtlas.records.delete(ref);geometryAtlas.parkByRef.delete(ref);delete geometryAtlas.indexes.NO.parks[ref];selectedParks.delete(ref)}pota=pota.filter(p=>!refs.includes(p.reference))},colorRefs);
 console.log('Mouseover lists all parks at the pointer without new worker jobs');
 const hoverRefs=['NO-HOVER-A','NO-HOVER-B','NO-HOVER-C','NO-HOVER-HOLE'];
 await page.evaluate(refs=>{
  const ring=(w,s,e,n)=>[[w,s],[e,s],[e,n],[w,n],[w,s]];
  const shapes=[{type:'Polygon',coordinates:[ring(10,30,10.01,30.01)]},{type:'Polygon',coordinates:[ring(10,30,10.01,30.01)]},{type:'Polygon',coordinates:[ring(10.005,30,10.01,30.01)]},{type:'Polygon',coordinates:[ring(10.006,30.002,10.009,30.008),ring(10.0065,30.003,10.0085,30.007)]}];
  refs.forEach((ref,i)=>{const p={reference:ref,name:i===0?'Park A <b>literal</b>':'Park '+ref,latitude:30.005,longitude:10.005};pota.push(p);geometryAtlas.parkByRef.set(ref,p);geometryAtlas.byRef.set(ref,shapes[i]);geometryAtlas.indexes.NO.parks[ref]={bbox:[10,30,10.01,30.01]}});
  map.setView([30.005,10.005],14,{animate:false});
 },hoverRefs);
 await page.waitForFunction(refs=>!atlasOverlapState.busy&&[...atlasOverlapState.layers.values()].some(x=>x.refs.includes(refs[0])&&x.refs.includes(refs[1])),hoverRefs,{timeout:60000});
 await page.evaluate(refs=>{[...atlasOverlapState.layers.values()].find(x=>x.refs.includes(refs[0])&&x.refs.includes(refs[1])).layer.bringToFront()},hoverRefs);
 const hoverRequests=await page.evaluate(()=>atlasOverlapState.requests);
 const moveHover=async lon=>{const pt=await page.evaluate(lon=>{const p=map.latLngToContainerPoint([30.005,lon]),r=map.getContainer().getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y}},lon);await page.mouse.move(pt.x,pt.y)};
 const visibleHover=page.locator('.leaflet-tooltip:visible').filter({hasText:'NO-HOVER-A'});
 await moveHover(10.003);await visibleHover.waitFor();assert.match(await visibleHover.innerText(),/NO-HOVER-B/);assert.doesNotMatch(await visibleHover.innerText(),/NO-HOVER-C|NO-HOVER-HOLE/);
 await moveHover(10.007);await page.waitForFunction(()=>[...document.querySelectorAll('.leaflet-tooltip')].some(el=>getComputedStyle(el).visibility!=='hidden'&&el.textContent.includes('NO-HOVER-A')&&el.textContent.includes('NO-HOVER-C')));
 assert.match(await visibleHover.innerText(),/NO-HOVER-B/);assert.doesNotMatch(await visibleHover.innerText(),/NO-HOVER-HOLE/);assert.match(await visibleHover.innerText(),/<b>literal<\/b>/);
 await page.screenshot({path:'atlas-triple-hover.png'});
 await moveHover(10.003);await page.waitForFunction(()=>[...document.querySelectorAll('.leaflet-tooltip')].some(el=>getComputedStyle(el).visibility!=='hidden'&&el.textContent.includes('NO-HOVER-A')&&!el.textContent.includes('NO-HOVER-C')));
 assert.equal(await page.evaluate(()=>atlasOverlapState.requests),hoverRequests,'hover must not start overlap calculations');
 console.log('Mobile overlap choices from actual map clicks');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.click('#mobileMapTab');await page.evaluate(()=>{map.setView([30.005,10.005],14,{animate:false})});
 const clickOverlap=async lon=>{const pt=await page.evaluate(lon=>{const p=map.latLngToContainerPoint([30.005,lon]),r=map.getContainer().getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y}},lon);assert.ok(pt.x>0&&pt.x<390&&pt.y>0&&pt.y<500,'overlap must be in the visible map');await page.mouse.click(pt.x,pt.y);await page.locator('#mobileOverlapChoices').waitFor({state:'visible'});};
 await clickOverlap(10.003);assert.equal(await page.locator('#mobileOverlapChoices button').count(),2);
 await page.click('#mobileSheetClose');assert.equal(await page.locator('#mobileOverlapChoices').isVisible(),false);
 await clickOverlap(10.007);assert.equal(await page.locator('#mobileOverlapChoices button').count(),3);
 assert.equal(await page.locator('#mobileParkSummary').isVisible(),false);assert.equal(await page.locator('#mobileParkTitle').innerText(),'Velg POTA-park');
 assert.equal(await page.locator('#mobileOverlapChoices b').count(),0,'park names are plain text');
 await page.screenshot({path:'atlas-mobile-overlap.png'});
 for(const ref of hoverRefs.slice(0,3)){
   await page.locator('#mobileOverlapChoices button[data-reference="'+ref+'"]').click();
   await page.waitForFunction(ref=>document.querySelector('#mobileParkRef').textContent===ref,ref);
   assert.equal(await page.locator('#mobileOverlapChoices').isVisible(),false);assert.equal(await page.locator('#mobileParkSummary').isVisible(),true);
   assert.equal(await page.locator('#mobileHandle').getAttribute('aria-expanded'),'false');
   await clickOverlap(10.007);assert.equal(await page.locator('#mobileOverlapChoices button').count(),3);
 }
 await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(300);
 assert.equal(await page.locator('#mobileOverlapChoices').isVisible(),false);await page.evaluate(()=>{map.setView([30.005,10.005],14,{animate:false})});
 await moveHover(10.007);const desktopPoint=await page.evaluate(()=>{const p=map.latLngToContainerPoint([30.005,10.007]);return {x:p.x,y:p.y}});await page.mouse.click(desktopPoint.x,desktopPoint.y);
 await page.locator('.leaflet-popup:visible').waitFor();assert.equal(await page.locator('.leaflet-popup button').count(),3);await page.evaluate(()=>{map.closePopup()});
 await page.mouse.move(0,0);await page.evaluate(refs=>{for(const ref of refs){geometryAtlas.byRef.delete(ref);geometryAtlas.parkByRef.delete(ref);delete geometryAtlas.indexes.NO.parks[ref]}pota=pota.filter(p=>!refs.includes(p.reference))},hoverRefs);
 assert.deepEqual(errors,[]);console.log('PASS',counts,'country filter, geometries without markers, overlap chooser, 61 m trail, clear selection, point reserve, mobile and satellite');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
