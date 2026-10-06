const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Deterministic POTA responses verify zero, caching, failures and stale replies.
 const statRequests={};await page.route('https://api.pota.app/park/stats/**',async route=>{
  const ref=route.request().url().split('/').pop();statRequests[ref]=(statRequests[ref]||0)+1;
  if(ref==='NO-3198')await route.fulfill({headers:{"Access-Control-Allow-Origin":"*"},json:{reference:ref,activations:0}});
  else if(ref==='NO-3374'){await new Promise(r=>setTimeout(r,200));await route.fulfill({headers:{"Access-Control-Allow-Origin":"*"},json:{reference:ref,activations:17}})}
  else await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},status:503,body:'Unavailable'});
 });
 console.log('Opening test map');await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>typeof geometryAtlas!=='undefined'&&geometryAtlas.ready,null,{timeout:120000});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Kartet viser'),null,{timeout:120000});
 console.log('Atlas initialized');const counts=await page.evaluate(()=>({geometry:geometryAtlas.byRef.size,points:layers.pts.getLayers().length,parks:pota.length}));assert(counts.geometry>5000,JSON.stringify(counts));assert.equal(counts.geometry+counts.points,counts.parks);
 console.log('Country filter');await page.selectOption('#countryFilter','NO');await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>potaMarkers.filter(x=>x.country==='SE'&&layers.pts.hasLayer(x.marker)).length),0);
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
 // Rapid taps must keep each park's own geometry.
 await page.evaluate(async()=>{await Promise.all([showLink(pota.find(p=>p.reference==='NO-3374'),false,false),showLink(pota.find(p=>p.reference==='NO-3198'),false,false)])});
 assert.equal(await page.evaluate(()=>selectedGeometryMeta(selectedParks.get('NO-3374')).ids.includes('94448')),true);
 assert.equal(await page.evaluate(()=>getPotaActivationCount('NO-3374')),17);
 await page.waitForTimeout(300);assert.match(await page.locator('#linkbox').innerText(),/NO-3198/);assert.equal(await page.locator('#linkbox [data-pota-activation-count]').innerText(),'0');
 console.log('Kyststien');await page.fill('#q','NO-2542');await page.click('#search');await page.waitForFunction(()=>selectedParks.has('NO-2542'),null,{timeout:60000});
 assert.equal(await page.evaluate(()=>TRAIL_CORRIDOR_WIDTH_M),61);assert(await page.evaluate(()=>trailCorridorPolygonsFromLayer(selectedParks.get('NO-2542').geo).length)>0);
 await page.click('#clearSelected');assert.equal(await page.evaluate(()=>selectedParks.size),0);assert(await page.evaluate(()=>geometryAtlas.layers.get('NO-2542')&&map.hasLayer(geometryAtlas.layers.get('NO-2542'))));
 const missing=await page.evaluate(()=>pota.find(p=>countryOf(p)==='NO'&&!atlasHasGeometry(p.reference)).reference);
 await page.fill('#q',missing);await page.click('#search');await page.waitForFunction(ref=>selectedParks.has(ref),missing);assert.equal(await page.evaluate(ref=>!!selectedParks.get(ref).marker,missing),true);assert.equal(await page.evaluate(ref=>selectedParks.get(ref).geo,missing),null);
 await page.waitForFunction(()=>document.querySelector('#linkbox [data-pota-activation-count]')?.textContent==='ikke tilgjengelig');
 const reserveLink=page.locator('#linkbox a');assert.equal(await reserveLink.getAttribute('href'),'https://pota.app/#/park/'+missing);
 console.log('Mobile controls');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(800);assert.equal(await page.locator('.mobile-nav').isVisible(),true);assert.match(await page.locator('.mobile-brand').innerText(),/0\.11\.0 test/);
 await page.getByRole('button',{name:'Innstillinger',exact:true}).click();await page.selectOption('#baseMapSelect','satellite');assert.equal(await page.evaluate(()=>activeBase===baseLayers.satellite),true);
 await page.getByRole('button',{name:'Kart',exact:true}).click();await page.screenshot({path:'atlas-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS',counts,'country filter, geometries without markers, overlap chooser, 61 m trail, clear selection, point reserve, mobile and satellite');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
