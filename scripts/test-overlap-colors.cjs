const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){fail({code:1})}}});
  if(!localStorage.getItem('pota-map-colors-v1'))localStorage.setItem('pota-map-colors-v1',JSON.stringify({version:1,colors:{normal:'#0000ff',never:'#ff0000',activated:'#00ff00',inside:'#ffff00',overlap:'#ff00ff'}}));
 });
 const answers=new Map([['NO-9001',5],['NO-9002',0],['NO-9003',7]]);
 await page.route('https://api.pota.app/park/stats/**',r=>{const ref=new URL(r.request().url()).pathname.split('/').pop();return r.fulfill({json:{reference:ref,activations:answers.get(ref)??17},headers:{'Access-Control-Allow-Origin':'*'}})});
 const ready=async()=>{await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>typeof parkActivations!=='undefined'&&geometryAtlas.ready&&document.getElementById('status').textContent.includes('Kartet viser')&&!document.documentElement.classList.contains('ui-loading'),null,{timeout:120000});};
 await ready();
 assert.equal(await page.locator('#parkOverlapMode').inputValue(),'blend','Old palette settings migrate to automatic mixing');
 assert.equal(await page.locator('#parkColorOverlap').isDisabled(),true);
 assert.equal(await page.locator('#parkColorNormal').inputValue(),'#0000ff','Existing color choices are preserved');
 await page.locator('#desktopSettings').evaluate(el=>el.open=true);await page.locator('#colorSettings > summary').click();
 await page.evaluate(async()=>{
  clearSelectedParks();clearSelection();geometryAtlas.parkByRef ||= new Map(pota.map(p=>[p.reference,p]));
  const square=(w,s,e,n)=>({type:'Polygon',coordinates:[[[w,s],[e,s],[e,n],[w,n],[w,s]]]});
  const refs=['NO-9001','NO-9002','NO-9003'],shapes=[square(10,30,10.04,30.04),square(10.02,30,10.06,30.04),square(10.01,30.02,10.05,30.06)],records={};
  window.blendRefs=refs;window.blendActivated=new Set([refs[2]]);const has=parkActivations.has;parkActivations.has=ref=>blendActivated.has(ref)||has(ref);
  for(let i=0;i<refs.length;i++){
   const ref=refs[i],g=shapes[i],box=turf.bbox({type:'Feature',properties:{},geometry:g}),p={reference:ref,name:['Blue park','Red park','Green park'][i],latitude:(box[1]+box[3])/2,longitude:(box[0]+box[2])/2,activations:[5,0,7][i]};
   pota.push(p);geometryAtlas.parkByRef.set(ref,p);geometryAtlas.indexes.NO.parks[ref]={bbox:box,shard:'blend-fixtures.json'};
   records[ref]={name:p.name,id:ref,source:'norway',geometry:g};geometryAtlas.records.set(ref,records[ref]);geometryAtlas.overviewByRef.set(ref,g);linkTable[ref]={officialName:p.name,type:'Nature Reserve'};
   const marker=L.circleMarker([p.latitude,p.longitude],{pane:'potaPane',radius:6,color:gpsParkColor(ref),fillColor:gpsParkColor(ref),fillOpacity:.9});potaMarkers.push({reference:ref,country:'NO',marker});atlasShow(ref,g);
  }
  seedPotaActivationCounts(pota);geometryAtlas.shards.set('NO/blend-fixtures.json',Promise.resolve(records));
  map.setView([30.025,10.03],12,{animate:false});await atlasRefresh();
 });
 await page.waitForFunction(()=>!atlasOverlapState.busy&&[...atlasOverlapState.layers.values()].some(x=>x.refs.length===3&&blendRefs.every(ref=>x.refs.includes(ref))),null,{timeout:60000});
 await page.waitForTimeout(700);await page.waitForFunction(()=>!atlasOverlapState.busy);
 const colors=()=>page.evaluate(()=>Object.fromEntries([...atlasOverlapState.layers.values()].filter(x=>x.refs.some(r=>blendRefs.includes(r))).map(x=>{const l=x.layer.getLayers()[0];return [[...x.refs].sort().join(','),{fill:l.options.fillColor,line:l.options.color,opacity:l.options.fillOpacity,shown:overlapLayer.hasLayer(x.layer)}]})));
 const assertMixed=async expected=>{const c=await colors();assert.equal(Object.keys(c).length,4);for(const [refs,fill] of Object.entries(expected)){assert.equal(c[refs].fill,fill,refs);assert.equal(c[refs].opacity,.5);assert(c[refs].shown,refs)}};
 const initial={'NO-9001,NO-9002':'#4d004d','NO-9001,NO-9003':'#004d4d','NO-9002,NO-9003':'#4d4d00','NO-9001,NO-9002,NO-9003':'#333333'};
 await assertMixed(initial);
 // Fill controls affect existing geometry without re-running the worker.
 assert.deepEqual(await page.evaluate(()=>['normal','selected','overlap'].map(k=>parkColors.opacity(k))),[.25,.4,.5]);
 const fillJobs=await page.evaluate(()=>atlasOverlapState.requests);
 for(const [key,val] of [['normal',0],['selected',70],['overlap',80]])await page.locator('[data-park-fill="'+key+'"]').evaluate((el,val)=>{el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}))},val);
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 assert.equal(await page.locator('#parkFillOverlapValue').textContent(),'80 %');
 assert(Object.values(await colors()).every(x=>x.opacity===.8));
 assert.equal(await page.evaluate(()=>geometryAtlas.layers.get('NO-9001').getLayers()[0].options.fillOpacity),0);
 assert.equal(await page.evaluate(()=>atlasOverlapState.requests),fillJobs);
 for(const [key,val] of [['normal',25],['selected',40],['overlap',50]])await page.evaluate(([k,v])=>{parkColors.setFill(k,v)},[key,val]);
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 const alpha=()=>page.evaluate(()=>{
  const r=geometryAtlas.renderer,p=map.latLngToLayerPoint([30.01,10.03]),ratio=r._container.width/r._bounds.getSize().x;
  return r._ctx.getImageData(Math.round((p.x-r._bounds.min.x)*ratio),Math.round((p.y-r._bounds.min.y)*ratio),1,1).data[3];
 });
 await page.waitForTimeout(100);assert.equal(await alpha(),0,'Canvas has no stacked park fills underneath the overlap');
 await page.evaluate(()=>{geometryAtlas.layers.get('NO-9001').bringToFront()});await page.waitForTimeout(100);assert.equal(await alpha(),0,'Drawing order cannot tint the overlap');
 assert.equal(await page.evaluate(()=>parkColors.setFill('normal',NaN)),false);assert.equal(await page.evaluate(()=>parkColors.setFill('overlap',101)),false);

 const before=await page.evaluate(()=>({requests:atlasOverlapState.requests,epoch:geometryAtlas.epoch,ids:[...atlasOverlapState.layers].map(([key,x])=>[key,L.stamp(x.layer)])}));
 await page.evaluate(async()=>{gpsWatchId=-9;lastGps={lat:30.03,lon:10.03};await updateGpsParkColors();await new Promise(requestAnimationFrame)});
 await assertMixed(Object.fromEntries(Object.keys(initial).map(k=>[k,'#999900'])));
 assert.deepEqual(await page.evaluate(()=>[...gpsInsideRefs].filter(r=>blendRefs.includes(r)).sort()),['NO-9001','NO-9002','NO-9003']);
 await page.evaluate(async()=>{lastGps={lat:30.01,lon:10.01};await updateGpsParkColors();await new Promise(requestAnimationFrame)});
 await assertMixed({'NO-9001,NO-9002':'#994d00','NO-9001,NO-9003':'#4d9900','NO-9002,NO-9003':'#4d4d00','NO-9001,NO-9002,NO-9003':'#666600'});
 await page.evaluate(async()=>{gpsWatchId=null;lastGps=null;await updateGpsParkColors();blendActivated.clear();document.dispatchEvent(new CustomEvent('pota:selection'));await new Promise(requestAnimationFrame)});
 assert.equal((await colors())['NO-9001,NO-9002,NO-9003'].fill,'#330066','Personal activation changes repaint overlaps');
 answers.set('NO-9002',9);await page.evaluate(async()=>{potaActivationCache.delete('NO-9002');await getPotaActivationCount('NO-9002');await new Promise(requestAnimationFrame)});
 assert.equal((await colors())['NO-9001,NO-9002,NO-9003'].fill,'#000099','Same colors give a darker variant after fresh global stats');
 answers.set('NO-9002',0);await page.evaluate(async()=>{potaActivationCache.delete('NO-9002');await getPotaActivationCount('NO-9002');blendActivated.add('NO-9003');parkColors.set('normal','#00ffff');await new Promise(requestAnimationFrame)});
 assert.equal((await colors())['NO-9001,NO-9002,NO-9003'].fill,'#336633','Palette changes feed the mixture');
 const unselected=await colors();await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-9001'),false,false);await new Promise(requestAnimationFrame)});assert.deepEqual(await colors(),unselected,'Selection does not distort the status mixture');
 // Replacing a small third park with a point must retain the large pair's overlap.
 await page.evaluate(()=>{window.blendBox=atlasMeta('NO-9003').bbox;atlasMeta('NO-9003').bbox=[10.029999,30.029999,10.030001,30.030001];syncParkDisplayLayers()});
 let c=await colors();assert.equal(c['NO-9001,NO-9002,NO-9003'].fill,'#4d4d4d');assert(c['NO-9001,NO-9002,NO-9003'].shown);assert.equal(c['NO-9001,NO-9003'].shown,false);
 await page.evaluate(()=>{atlasMeta('NO-9003').bbox=blendBox;syncParkDisplayLayers()});
 await page.selectOption('#parkOverlapMode','fixed');await page.evaluate(()=>new Promise(requestAnimationFrame));assert.equal(await page.locator('#parkColorOverlap').isDisabled(),false);
 c=await colors();assert(Object.values(c).every(x=>x.fill==='#ff00ff'&&x.opacity===.5),'Fixed color remains available');
 await page.selectOption('#parkOverlapMode','blend');await page.evaluate(()=>new Promise(requestAnimationFrame));
 const after=await page.evaluate(()=>({requests:atlasOverlapState.requests,epoch:geometryAtlas.epoch,ids:[...atlasOverlapState.layers].map(([key,x])=>[key,L.stamp(x.layer)])}));assert.deepEqual(after,before,'GPS, activation, palette and mode changes reuse geometry and worker results');
 assert.match(await page.locator('#overlapLegendLabel').textContent(),/blandede/);assert.match(await page.locator('.overlapkey').evaluate(el=>getComputedStyle(el).backgroundImage),/linear-gradient/);
 await page.screenshot({path:'atlas-overlap-mixed-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.body.classList.contains('mobile-layout'));
 await page.waitForFunction(()=>map.getSize().x===390);await page.evaluate(()=>{map.setView([30.025,10.03],12,{animate:false})});await page.waitForTimeout(300);
 await page.screenshot({path:'atlas-overlap-mixed-mobile-map.png'});
 await page.click('#mobileSettings');await page.locator('#colorSettings').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#mobileSettingsContent #parkOverlapMode').count(),1);assert.equal(await page.locator('#parkOverlapMode').inputValue(),'blend');
 await page.screenshot({path:'atlas-overlap-mixed-mobile-settings.png'});
 await page.evaluate(()=>{parkColors.setFill('normal',31);parkColors.setFill('selected',64);parkColors.setFill('overlap',77)});await page.selectOption('#parkOverlapMode','fixed');await ready();assert.deepEqual(await page.evaluate(()=>['normal','selected','overlap'].map(k=>parkColors.opacity(k))),[.31,.64,.77]);assert.equal(await page.locator('#parkOverlapMode').inputValue(),'fixed','Mode persists on reload');assert.equal(await page.locator('#parkColorNormal').inputValue(),'#00ffff');
 await page.click('#mobileSettings');if(!await page.locator('#colorSettings').evaluate(el=>el.open))await page.locator('#colorSettings > summary').click();
 await page.locator('#resetParkColors').click();assert.equal(await page.locator('#parkOverlapMode').inputValue(),'blend');assert.equal(await page.locator('#parkColorOverlap').isDisabled(),true);
 await ready();assert.equal(await page.locator('#parkOverlapMode').inputValue(),'blend');assert.equal(await page.evaluate(()=>parkColors.setOverlapMode('invalid')),false);
 assert.deepEqual(await page.evaluate(()=>['normal','selected','overlap'].map(k=>parkColors.opacity(k))),[.25,.4,.5]);
 // User-reported pair: activated Kyststien and unactivated Hvaler prestegårdskog.
 await page.setViewportSize({width:1280,height:900});await page.waitForFunction(()=>map.getSize().x===930);
 await page.evaluate(async()=>{
  const has=parkActivations.has;parkActivations.has=ref=>ref==='NO-2542'||(ref!=='NO-0862'&&has(ref));
  const b=atlasMeta('NO-0862').bbox;map.fitBounds([[b[1],b[0]],[b[3],b[2]]],{animate:false,maxZoom:15});await atlasRefresh();
  for(const ref of ['NO-2542','NO-0862'])await showLink(pota.find(p=>p.reference===ref),false,false);
 });
 await page.waitForFunction(()=>!atlasOverlapState.busy&&[...atlasOverlapState.layers.values()].some(x=>x.refs.includes('NO-2542')&&x.refs.includes('NO-0862')&&overlapLayer.hasLayer(x.layer)),null,{timeout:90000});
 await page.waitForTimeout(300);
 const real=await page.evaluate(()=>{
  const x=[...atlasOverlapState.layers.values()].find(x=>x.refs.length===2&&x.refs.includes('NO-2542')&&x.refs.includes('NO-0862')&&overlapLayer.hasLayer(x.layer));
  if(!x)throw Error('Missing exact Kyststien/reserve overlap');
  const f={type:'Feature',properties:{},geometry:x.geometry},c=turf.pointOnFeature(turf.buffer(f,-.003,{units:'kilometers'})).geometry.coordinates,pt=map.latLngToLayerPoint([c[1],c[0]]);
  return {fill:x.layer.getLayers()[0].options.fillColor,opacity:x.layer.getLayers()[0].options.fillOpacity,masked:!document.createElement('canvas').getContext('2d').isPointInPath(parkFillMask.path,pt.x,pt.y,'evenodd'),width:TRAIL_CORRIDOR_WIDTH_M,refs:x.refs};
 });
 assert.equal(real.fill,'#4c524e');assert.equal(real.opacity,.5);assert.equal(real.width,61);assert(real.masked,'Only fills are excluded in the real corridor/park intersection');
 await page.screenshot({path:'atlas-fill-hvaler-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>map.getSize().x===390);
 await page.evaluate(()=>{const b=atlasMeta('NO-0862').bbox;map.fitBounds([[b[1],b[0]],[b[3],b[2]]],{animate:false,maxZoom:15})});await page.waitForTimeout(500);
 await page.screenshot({path:'atlas-fill-hvaler-mobile.png'});
 console.log('PASS fill controls: 0/100 validation, immediate repaint, persistence/reset, no worker recalculation, canvas pixel/order invariance, NO-2542 activated × NO-0862 unactivated, unchanged 61 m and PC/mobile');

 assert.deepEqual(errors,[]);console.log('PASS overlap colors: exact pair/triple mixes, same-color darkening, live GPS/personal/global/palette updates, selected and adaptive parks, fixed option, persistent migration/reset, no geometry recalculation and PC/mobile controls');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
