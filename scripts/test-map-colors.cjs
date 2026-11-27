const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){fail({code:1})}}}));
 const data=JSON.parse(fs.readFileSync('data/pota-NO.json','utf8'));
 for(const p of data)if(['NO-3198','NO-2590'].includes(p.reference))p.activations=0;
 await page.route('**/data/pota-NO.json*',r=>r.fulfill({json:data}));
 await page.route('https://api.pota.app/park/stats/**',r=>{
  const ref=new URL(r.request().url()).pathname.split('/').pop();return r.fulfill({json:{reference:ref,activations:['NO-3198','NO-2590'].includes(ref)?0:17},headers:{'Access-Control-Allow-Origin':'*'}});
 });
 const ready=async p=>{await p.goto('http://127.0.0.1:8765');await p.waitForFunction(()=>typeof parkActivations!=='undefined'&&geometryAtlas.ready&&document.getElementById('status').textContent.includes('Kartet viser')&&!document.documentElement.classList.contains('ui-loading'),null,{timeout:120000});};
 await ready(page);
 const defaults={normal:'#3388ff',never:'#f97316',activated:'#ca8a04',inside:'#15803d',overlap:'#a855f7'};
 const custom={normal:'#0066cc',never:'#cc0099',activated:'#e61919',inside:'#17a2b8',overlap:'#ff6600'};
 const values=()=>page.locator('[data-park-color]').evaluateAll(els=>Object.fromEntries(els.map(el=>[el.dataset.parkColor,el.value])));
 assert.deepEqual(await values(),defaults);
 await page.locator('#desktopSettings').evaluate(el=>el.open=true);await page.locator('#colorSettings > summary').click();
 const set=async(key,value)=>{await page.locator('[data-park-color="'+key+'"]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))},value);await page.evaluate(()=>new Promise(requestAnimationFrame));};
 // Real computed overlaps provide existing layers to recolor without worker jobs.
 await page.evaluate(async()=>{
  const groups=new Map();for(const [ref,meta] of Object.entries(geometryAtlas.indexes.NO.parks)){const k=meta.source+':'+meta.id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(ref)}
  window.colorPair=[...groups.values()].find(refs=>refs.length>1).slice(0,2);
  map.fitBounds(geometryAtlas.layers.get(colorPair[0]).getBounds(),{maxZoom:12,animate:false});await atlasRefresh();
 });
 await page.waitForFunction(()=>!atlasOverlapState.busy&&atlasOverlapState.pairs.some(p=>colorPair.every(ref=>p.refs.includes(ref))),null,{timeout:60000});
 await page.waitForTimeout(700);await page.waitForFunction(()=>!atlasOverlapState.busy);
 const before=await page.evaluate(()=>({requests:atlasOverlapState.requests,epoch:geometryAtlas.epoch,ids:[...geometryAtlas.layers].map(([ref,l])=>[ref,L.stamp(l)])}));
 for(const [key,color] of Object.entries(custom))await set(key,color);
 await page.waitForTimeout(100);
 const after=await page.evaluate(()=>({requests:atlasOverlapState.requests,epoch:geometryAtlas.epoch,ids:[...geometryAtlas.layers].map(([ref,l])=>[ref,L.stamp(l)])}));
 assert.deepEqual(after,before,'Palette changes repaint layers without geometry refresh or overlap recalculation');
 assert.deepEqual(await values(),custom);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('pota-map-colors-v1')).colors),custom);
 const overlap=await page.evaluate(()=>{const x=[...atlasOverlapState.layers.values()].find(x=>colorPair.every(ref=>x.refs.includes(ref)));return {fill:x.layer.getLayers()[0].options.fillColor,line:x.layer.getLayers()[0].options.color}});
 assert.deepEqual(overlap,{fill:custom.overlap,line:'#bf4d00'});
 const legend=await page.locator('.mapkey').evaluate(el=>Object.fromEntries(['dotkey','neveractivatedkey','activatedkey','insidekey','overlapkey'].map(key=>{const s=getComputedStyle(el.querySelector('.'+key));return [key,{fill:s.backgroundColor,line:s.borderTopColor}]})));
 assert.equal(legend.dotkey.fill,'rgb(0, 102, 204)');assert.equal(legend.neveractivatedkey.fill,'rgb(204, 0, 153)');assert.equal(legend.activatedkey.fill,'rgb(230, 25, 25)');assert.equal(legend.insidekey.line,'rgb(23, 162, 184)');assert.equal(legend.overlapkey.line,'rgb(191, 77, 0)');
 await page.evaluate(async()=>{map.setView([59.175,10.925],13,{animate:false});await atlasRefresh()});
 await page.screenshot({path:'atlas-color-settings-desktop.png'});
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-3198'),false,false)});
 await page.waitForFunction(()=>potaMarkers.find(x=>x.reference==='NO-3198').marker.options.color===parkColors.get('never',true));
 const selectedId=await page.evaluate(()=>L.stamp(selectedParks.get('NO-3198').geo));
 const priority=await page.evaluate(async()=>{
  const ref='NO-3198',old=parkActivations.has;const zero=gpsParkColor(ref),selected=gpsParkColor(ref,true),normal=gpsParkColor('NO-UNKNOWN');
  parkActivations.has=r=>r===ref;document.dispatchEvent(new CustomEvent('pota:colors'));await new Promise(requestAnimationFrame);const activated=gpsParkColor(ref),selectedActivated=gpsParkColor(ref,true);
  gpsInsideRefs.add(ref);document.dispatchEvent(new CustomEvent('pota:gps-colors'));await new Promise(requestAnimationFrame);const inside=gpsParkColor(ref,true);
  gpsInsideRefs.delete(ref);parkActivations.has=old;document.dispatchEvent(new CustomEvent('pota:colors'));await new Promise(requestAnimationFrame);
  const first=l=>{while(l.eachLayer)l=l.getLayers()[0];return {color:l.options.color,weight:l.options.weight,fill:l.options.fillOpacity}};
  return {zero,selected,normal,activated,selectedActivated,inside,geometry:first(selectedParks.get(ref).geo)};
 });
 assert.deepEqual(priority,{zero:custom.never,selected:'#990073',normal:custom.normal,activated:custom.activated,selectedActivated:'#ad1313',inside:custom.inside,geometry:{color:'#990073',weight:3.5,fill:.4}});
 await set('never','#7a00cc');
 assert.equal(await page.evaluate(()=>selectedParks.get('NO-3198').geo.getLayers()[0].options.color),'#5c0099');
 assert.equal(await page.evaluate(()=>L.stamp(selectedParks.get('NO-3198').geo)),selectedId,'Selected geometry is reused when recolored');
 // Trail symbols, selected geometry and explicit point mode use the shared palette.
 await page.evaluate(async()=>{await showLink(pota.find(p=>p.reference==='NO-2590'),false,false);parkDisplayMode.value='points';parkDisplayMode.dispatchEvent(new Event('change'))});
 await page.waitForFunction(()=>potaMarkers.find(x=>x.reference==='NO-2590').marker.getElement()?.querySelector('.trail-pota-icon')?.style.color==='rgb(92, 0, 153)');
 const snapshot={...custom,never:'#7a00cc'};
 await ready(page);assert.deepEqual(await values(),snapshot,'Palette persists after reload and is applied before map rendering');
 assert.equal(await page.evaluate(()=>gpsParkColor('NO-3198')),snapshot.never);
 // Move the same controls between layouts; no duplicate inputs or lost values.
 for(const width of [390,1280,320,640,390]){
  await page.setViewportSize({width,height:844});
  await page.locator(width>700?'#desktopColorsSlot #colorSettings':'#mobileSettingsContent #colorSettings').waitFor({state:'attached'});
  assert.equal(await page.locator('#colorSettings').count(),1);assert.equal(await page.locator('[data-park-color]').count(),5);assert.deepEqual(await values(),snapshot);
 }
 await page.click('#mobileSettings');await page.locator('#colorSettings > summary').click();
 await page.locator('#colorSettings').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#colorSettings').isVisible(),true);
 const bounds=await page.locator('[data-park-color]').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height}}));
 assert(bounds.every(b=>b.x>=0&&b.right<=390&&b.width>=44&&b.height>=44),'Color inputs fit mobile and are touch-sized');
 await page.screenshot({path:'atlas-color-settings-mobile.png'});
 await set('normal','#223344');await page.locator('#resetParkColors').click();assert.deepEqual(await values(),defaults);
 assert.equal(await page.evaluate(()=>gpsParkColor('NO-UNKNOWN')),'#3388ff');
 await ready(page);assert.deepEqual(await values(),defaults,'Reset survives reload');
 // Reject malformed saved values and handle blocked browser storage without stopping the map.
 for(const blocked of [false,true]){
  const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(blocked=>{
   if(blocked){const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(k){if(k==='pota-map-colors-v1')throw Error('blocked');return get.call(this,k)};Storage.prototype.setItem=function(k,v){if(k==='pota-map-colors-v1')throw Error('blocked');return set.call(this,k,v)};}
   else localStorage.setItem('pota-map-colors-v1',JSON.stringify({version:1,colors:{normal:'#ABCDEF',never:'url(bad)',activated:null,inside:42,overlap:'#123'}}));
  },blocked);
  await ready(p);
  const c=await p.evaluate(()=>Object.fromEntries(['normal','never','activated','inside','overlap'].map(k=>[k,parkColors.get(k)])));
  assert.deepEqual(c,blocked?defaults:{...defaults,normal:'#abcdef'});
  assert.equal(await p.evaluate(()=>parkColors.set('never','bad')),false);
  if(blocked){assert.equal(await p.evaluate(()=>parkColors.set('never','#445566')),true);assert.match(await p.locator('#colorSettingsStatus').textContent(),/kunne ikke lagres/);assert.equal(await p.evaluate(()=>gpsParkColor('NO-UNKNOWN')),'#3388ff');}
  await p.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS map colors: all status priorities, selected shades/geometry, trail icons, live overlaps and legend, no recalculation, persistent reload/reset, shared PC/mobile controls, touch size and validated/blocked storage');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
