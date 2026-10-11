const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.on('console',m=>{if(m.text().startsWith('KYST '))console.log(m.text())});
 page.on('pageerror',e=>console.error('KYST page error:',e.message));
 await page.goto('http://127.0.0.1:8765');
 await page.waitForFunction(()=>typeof geometryAtlas!=='undefined'&&geometryAtlas.ready&&typeof showLink==='function',null,{timeout:120000});
 await page.waitForFunction(()=>document.body.classList.contains('desktop-layout'));
 await page.evaluate(()=>{
  window.kystTicks=0;window.kystMetaCalls=0;setInterval(()=>kystTicks++,50);
  const meta=selectedGeometryMeta;selectedGeometryMeta=function(...args){kystMetaCalls++;return meta(...args)};
  const diagnostic=updateSelectionDiagnostics;updateSelectionDiagnostics=function(){const start=performance.now();console.log('KYST diagnostics start');try{return diagnostic()}finally{console.log('KYST diagnostics ms '+Math.round(performance.now()-start))}};
  for(const name of ['pota:park','pota:geometry','pota:selection','pota:overlap'])document.addEventListener(name,e=>console.log('KYST event '+name+' '+JSON.stringify(e.detail?.p?.reference||e.detail?.reference||e.detail?.refs||lastSelectedRef)));
 });
 let target=await page.evaluate(async()=>{
  const p=pota.find(p=>p.reference==='NO-2542'),r=await atlasRecord(p.reference);const lines=[];
  function visit(g){if(g.type==='GeometryCollection')g.geometries.forEach(visit);else if(g.type==='LineString')lines.push(g.coordinates);else if(g.type==='MultiLineString')lines.push(...g.coordinates)}visit(r.geometry);
  let best=null,distance=Infinity;
  for(const line of lines)for(let i=1;i<line.length;i++){const c=[(line[i-1][0]+line[i][0])/2,(line[i-1][1]+line[i][1])/2],d=L.latLng(c[1],c[0]).distanceTo([+p.latitude,+p.longitude]);if(d<distance){best=c;distance=d}}
  console.log('KYST segments '+lines.length+' vertices '+lines.reduce((n,x)=>n+x.length,0));return best;
 });
 assert(target,'Kyststien line fixture must exist');
 for(const zoom of [9,14]){
  await page.evaluate(({c,zoom})=>{map.setView([c[1],c[0]],zoom,{animate:false});}, {c:target,zoom});
  await page.waitForTimeout(1500);
  target=await page.evaluate(()=>{
   const lines=[];function visit(g){if(g.type==='GeometryCollection')g.geometries.forEach(visit);else if(g.type==='LineString')lines.push(g.coordinates);else if(g.type==='MultiLineString')lines.push(...g.coordinates)}visit(geometryAtlas.byRef.get('NO-2542'));
   const p=pota.find(p=>p.reference==='NO-2542');
   const points=potaMarkers.filter(x=>map.hasLayer(x.marker)).map(x=>map.latLngToContainerPoint(x.marker.getLatLng()));
   const candidates=lines.flat().map(c=>({c,d:L.latLng(c[1],c[0]).distanceTo([+p.latitude,+p.longitude])})).sort((a,b)=>a.d-b.d);
   const best=candidates.find(({c})=>{const pos=map.latLngToContainerPoint([c[1],c[0]]);return points.every(pt=>pos.distanceTo(pt)>25)})?.c;
   if(!best)throw Error('No unobstructed Kyststien click target');
   console.log('KYST displayed hit '+JSON.stringify(atlasRefsAt(L.latLng(best[1],best[0]))));return best;
  });
  await page.evaluate(c=>{map.setView([c[1],c[0]],map.getZoom(),{animate:false});},target);
  for(const multi of [true,false]){
   await page.evaluate(multi=>{multiMode.checked=multi;multiMode.dispatchEvent(new Event('change'));clearSelectedParks();clearSelection();lastSelectedRef=null},multi);
   for(let attempt=0;attempt<2;attempt++){
    console.log('KYST click zoom='+zoom+' multi='+multi+' attempt='+attempt);
    const point=await page.evaluate(c=>{const p=map.latLngToContainerPoint([c[1],c[0]]),r=map.getContainer().getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y,ticks:kystTicks}},target);
    const started=Date.now();await page.mouse.move(point.x,point.y);await page.mouse.click(point.x,point.y);
    await page.waitForFunction(()=>document.querySelector('#desktopOverlapChoices:not([hidden]) button[data-reference="NO-2542"]')||document.querySelector('#linkbox .park-reference')?.textContent==='NO-2542',null,{timeout:10000});
    const choice=page.locator('#desktopOverlapChoices:not([hidden]) button[data-reference="NO-2542"]');if(await choice.count())await choice.click();
    await page.waitForFunction(()=>lastSelectedRef==='NO-2542'&&(multiMode.checked?selectedParks.has('NO-2542'):!!selectedGeo),null,{timeout:30000});
    await page.waitForTimeout(150);
    const info=await page.evaluate(()=>({ticks:kystTicks,reference:document.querySelector('#linkbox .park-reference')?.textContent,segments:selectedGeo?.getLayers().length||selectedParks.get('NO-2542')?.geo?.getLayers().length}));
    console.log('KYST response '+JSON.stringify({...info,elapsed:Date.now()-started}));assert(info.ticks>point.ticks,'Event loop must remain responsive');assert.equal(info.reference,'NO-2542');assert.equal(await page.evaluate(()=>kystMetaCalls),0,'Closed PC technical panel must not recompute geometry diagnostics');assert(Date.now()-started<10000,'Kyststien click must finish within 10 seconds');
   }
  }
 }
 // The technical section must show the current selection when explicitly opened.
 await page.evaluate(async()=>{multiMode.checked=true;multiMode.dispatchEvent(new Event('change'));clearSelectedParks();clearSelection();lastSelectedRef=null;await showLink(pota.find(p=>p.reference==='NO-3198'),false,false);});
 await page.locator('.info-more > summary').click();
 await page.waitForFunction(()=>kystMetaCalls>0&&document.querySelector('#overlapDiag').textContent.includes('NO-3198'));
 assert.doesNotMatch(await page.locator('#overlapDiag').innerText(),/NO-2542/);
 await page.locator('.info-more > summary').click();
 await page.screenshot({path:'atlas-kyst-click.png'});console.log('PASS Kyststien direct and repeated clicks, zoom 9/14, single and multiselect');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
