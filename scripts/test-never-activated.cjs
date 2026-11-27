const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){fail({code:1})}}}));
 // Valid catalog counts give immediate colors without individual API requests.
 for(const cc of ['NO','SE']){
  const data=JSON.parse(fs.readFileSync('data/pota-'+cc+'.json','utf8'));
  for(const p of data)if(['NO-3198','NO-2590','SE-0016'].includes(p.reference))p.activations=0;
  await page.route('**/data/pota-'+cc+'.json*',r=>r.fulfill({json:data}));
 }
 const answers=new Map([['NO-3198',{activations:0}],['NO-2590',{activations:'0'}],['SE-0016',{activations:0}]]);
 await page.route('https://api.pota.app/park/stats/**',r=>{
  const ref=decodeURIComponent(new URL(r.request().url()).pathname.split('/').pop());requests.push(ref);
  const data=answers.get(ref)??{activations:17};
  return r.fulfill(data==='fail'?{status:503,body:'Unavailable'}:{json:data,headers:{'Access-Control-Allow-Origin':'*'}});
 });
 await page.goto('http://127.0.0.1:8765');
 await page.waitForFunction(()=>typeof parkActivations!=='undefined'&&geometryAtlas.ready&&document.querySelector('#status').textContent.includes('Kartet viser')&&!document.documentElement.classList.contains('ui-loading'),null,{timeout:120000});
 assert.equal(requests.length,0,'No mass stats lookups');
 assert.equal(await page.evaluate(()=>gpsParkColor('NO-3198')),'#f97316');
 assert.equal(await page.evaluate(()=>gpsParkColor('NO-3374')),'#3388ff');
 assert.deepEqual(await page.evaluate(()=>[null,undefined,'', ' ',false,true,-1,1.2,NaN,Infinity,'oops',{},[]].map(parsePotaActivationCount)),Array(13).fill(null));
 assert.deepEqual(await page.evaluate(()=>[0,'0',3,' 3 '].map(parsePotaActivationCount)),[0,0,3,3]);
 const color=ref=>page.evaluate(ref=>gpsParkColor(ref),ref);
 const allColors=ref=>page.evaluate(ref=>{
  const values=[],visit=l=>{if(l.eachLayer)l.eachLayer(visit);else if(l.options?.color)values.push(l.options.color)};
  visit(geometryAtlas.layers.get(ref));const selected=selectedParks.get(ref);if(selected?.geo)visit(selected.geo);if(selected?.marker)visit(selected.marker);
  const marker=potaMarkers.find(x=>x.reference===ref)?.marker;if(marker?.options.color)values.push(marker.options.color);
  return [...new Set(values)];
 },ref);
 await page.evaluate(async()=>{map.setView([59.175,10.925],13,{animate:false});await atlasRefresh();await showLink(pota.find(p=>p.reference==='NO-3198'),false,false)});
 await page.waitForFunction(()=>knownPotaActivationCount('NO-3198')===0&&potaMarkers.find(x=>x.reference==='NO-3198').marker.options.color==='#c2410c');
 assert.deepEqual(await allColors('NO-3198'),['#c2410c']);
 const ref='NO-3198';
 const fresh=async data=>{answers.set(ref,data);return page.evaluate(async ref=>{potaActivationCache.delete(ref);const value=await getPotaActivationCount(ref);await new Promise(requestAnimationFrame);return value},ref);};
 assert.equal(await fresh({reference:ref,activations:4}),4);assert.equal(await color(ref),'#3388ff');
 assert.deepEqual(await allColors(ref),['#1d4ed8'],'Positive live stats replace catalog zero and repaint all layers');
 assert.equal(await fresh({reference:ref,activations:0}),0);assert.deepEqual(await allColors(ref),['#c2410c']);
 assert.equal(await fresh('fail'),null);assert.deepEqual(await allColors(ref),['#c2410c'],'Failure preserves last confirmed count');
 // A failed/invalid first result is never an invented zero.
 for(const [i,data] of [{},{activations:null},{activations:''},{activations:false},{activations:-1},{reference:'SE-9999',activations:0},'fail'].entries()){
  const unknown='NO-INVALID-'+i;answers.set(unknown,data);
  assert.equal(await page.evaluate(async ref=>await getPotaActivationCount(ref),unknown),null);
  assert.equal(await color(unknown),'#3388ff');
 }
 // Existing personal activation and GPS priorities remain above zero-count color.
 const priority=await page.evaluate(async()=>{
  const ref='NO-3198',old=parkActivations.has;parkActivations.has=r=>r===ref;
  document.dispatchEvent(new CustomEvent('pota:display'));await new Promise(requestAnimationFrame);const yellow=gpsParkColor(ref),selectedYellow=gpsParkColor(ref,true);
  const g=(await atlasRecord(ref)).geometry,c=turf.pointOnFeature({type:'Feature',properties:{},geometry:g}).geometry.coordinates;
  gpsWatchId=-42;lastGps={lat:c[1],lon:c[0]};await updateGpsParkColors();await new Promise(requestAnimationFrame);const green=gpsParkColor(ref),selectedGreen=gpsParkColor(ref,true);
  gpsWatchId=null;lastGps=null;parkActivations.has=old;await updateGpsParkColors();await new Promise(requestAnimationFrame);
  return {yellow,selectedYellow,green,selectedGreen,restored:gpsParkColor(ref,true),overlap:gpsOverlapStyle(['NO-3198','NO-3374']).color};
 });
 assert.deepEqual(priority,{yellow:'#ca8a04',selectedYellow:'#a16207',green:'#15803d',selectedGreen:'#15803d',restored:'#c2410c',overlap:'#7e22ce'});
 await page.screenshot({path:'atlas-never-activated-desktop.png'});
 // Actual no-geometry point selection, selected color and unchanged marker size.
 const pointRef=await page.evaluate(()=>potaMarkers.find(x=>!atlasHasGeometry(x.reference)&&x.marker.setStyle).reference);
 answers.set(pointRef,{activations:0});
 await page.evaluate(async ref=>{potaActivationCache.delete(ref);await getPotaActivationCount(ref);await showLink(pota.find(p=>p.reference===ref),false,false)},pointRef);
 await page.waitForFunction(ref=>selectedParks.get(ref)?.marker?.options.color==='#c2410c',pointRef);
 assert.equal(await page.evaluate(ref=>selectedParks.get(ref).marker.getRadius(),pointRef),6);
 // Trail symbols and trail geometries share the same zero-count status.
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-2590'),false,false);parkDisplayMode.value='points';parkDisplayMode.dispatchEvent(new Event('change'))});
 await page.waitForFunction(()=>potaMarkers.find(x=>x.reference==='NO-2590').marker.getElement()?.querySelector('.trail-pota-icon')?.style.color==='rgb(194, 65, 12)');
 assert.equal(await page.evaluate(()=>gpsParkColor('NO-2590',true)),'#c2410c');
 await page.evaluate(()=>{parkDisplayMode.value='geometry';parkDisplayMode.dispatchEvent(new Event('change'))});
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.body.classList.contains('mobile-layout'));
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-3198'),false,false);map.setView([59.175,10.925],5,{animate:false});await atlasRefresh()});
 await page.waitForFunction(()=>!map.hasLayer(geometryAtlas.layers.get('NO-3198'))&&layers.pts.hasLayer(potaMarkers.find(x=>x.reference==='NO-3198').marker));
 await page.waitForFunction(()=>potaMarkers.find(x=>x.reference==='NO-3198').marker.options.color==='#c2410c');
 await page.screenshot({path:'atlas-never-activated-mobile-points.png'});
 await page.click('#mobileSettings');assert.equal(await page.locator('.neveractivatedkey').count(),1);
 const legend=await page.locator('.neveractivatedkey').evaluate(el=>({color:getComputedStyle(el).backgroundColor,text:el.parentNode.textContent}));
 assert.deepEqual(legend,{color:'rgb(249, 115, 22)',text:'0 registrerte aktiveringer'});
 await page.screenshot({path:'atlas-never-activated-mobile-legend.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS zero activations: catalog seed without API scan, strict counts, unknown/error handling, live overrides and repaint, selected points/geometry/trails, unchanged radius, yellow/green priority, purple overlap, adaptive mobile points and shared legend');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
