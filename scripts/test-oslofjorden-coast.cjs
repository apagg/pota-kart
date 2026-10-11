const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('data/coastal/oslofjorden-ostfold-test.geojson','utf8'));
const expected={type:'MultiLineString',coordinates:data.features.filter(f=>f.properties.includedInPota).flatMap(f=>f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates)};
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:8765');
 await page.waitForFunction(()=>typeof geometryAtlas!=='undefined'&&geometryAtlas.ready,null,{timeout:120000});
 const initial=await page.evaluate(async()=>({record:(await atlasRecord('NO-2542')).geometry,alias:(await atlasRecord('LA-2542')).geometry,overview:geometryAtlas.overviewByRef.get('NO-2542'),bbox:atlasMeta('NO-2542').bbox}));
 assert.deepEqual(initial.record,expected);assert.deepEqual(initial.alias,expected);assert.deepEqual(initial.overview,expected);
 const coords=expected.coordinates.flat(),bbox=[Math.min(...coords.map(c=>c[0])),Math.min(...coords.map(c=>c[1])),Math.max(...coords.map(c=>c[0])),Math.max(...coords.map(c=>c[1]))];
 assert.deepEqual(initial.bbox,bbox);
 // Other parks still come from the original atlas shard.
 const other=JSON.parse(await page.evaluate(async()=>{const m=atlasMeta('NO-3198');return JSON.stringify({shard:m.shard,record:await atlasRecord('NO-3198')})}));
 assert.deepEqual(other.record,JSON.parse(fs.readFileSync('data/geometries/'+other.shard,'utf8'))['NO-3198']);
 const hvaler=data.features.find(f=>f.properties.includedInPota&&f.properties.folderPath.includes('Turer Hvaler kommune')).geometry.coordinates[0];
 for(const zoom of [5,14,5]){
  await page.evaluate(({c,zoom})=>{map.setView([c[1],c[0]],zoom,{animate:false})},{c:hvaler,zoom});
  await page.waitForTimeout(1000);
  assert.deepEqual(await page.evaluate(()=>geometryAtlas.byRef.get('NO-2542')),expected,'No old overview restored at zoom '+zoom);
 }
 await page.evaluate(async c=>{map.setView([c[1],c[0]],13,{animate:false});await showLink(pota.find(p=>p.reference==='NO-2542'),false,false)},hvaler);
 await page.waitForFunction(()=>lastSelectedRef==='NO-2542');
 const gps=await page.evaluate(()=>{
  const g=geometryAtlas.byRef.get('NO-2542');
  // Find an isolated perpendicular offset along a real imported route.
  for(const a of g.coordinates)for(let i=1;i<a.length;i++){
   const p=turf.point(a[i-1]),q=turf.point(a[i]);if(turf.distance(p,q,{units:'meters'})<80)continue;
   const m=turf.midpoint(p,q),bearing=turf.bearing(p,q)+90;
   const inside=turf.destination(m,20,bearing,{units:'meters'}).geometry.coordinates;
   const outside=turf.destination(m,44,bearing,{units:'meters'}).geometry.coordinates;
   const ll=c=>L.latLng(c[1],c[0]);
   if(gpsGeometryHit(g,ll(inside))&&!gpsGeometryHit(g,ll(outside)))return {width:TRAIL_BUFFER_M*2,inside:true,outside:false};
  }
  throw Error('No isolated GPS boundary fixture in imported routes');
 });
 assert.deepEqual(gps,{width:61,inside:true,outside:false});
 await page.screenshot({path:'atlas-coast-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.body.classList.contains('mobile-layout'));
 await page.waitForTimeout(500);assert.equal(await page.locator('#mobileParkRef').innerText(),'NO-2542');
 await page.screenshot({path:'atlas-coast-mobile.png'});
 assert.equal(requests.filter(u=>u.includes('/data/coastal/oslofjorden-ostfold-test.geojson')).length,1,'Snapshot memoized');
 assert.equal(requests.filter(u=>u.includes('hvaler-tillegg.geojson')||u.includes('RegFriluft_innsyn/MapServer/15/query')).length,0,'Former source not requested');
 assert.deepEqual(errors,[]);console.log('PASS coastal replacement: exact geometry at every zoom, alias, memo, unchanged other park, real-route GPS 20/44m, desktop/mobile');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
