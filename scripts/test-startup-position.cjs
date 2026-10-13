const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 for(const [scenario,width] of [['success',1280],['success',390],['denied',1280],['missing',390],['invalid',1280],['late',390],['no-response',1280]]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(scenario=>{
   const state=window.startupTest={requests:0,watches:0};
   const geo={getCurrentPosition(success,error,options){state.requests++;state.options=options;state.success=success;state.error=error;
    if(scenario==='success')setTimeout(()=>success({coords:{latitude:60.3913,longitude:5.3221}}),30);
    if(scenario==='denied')error({code:1});if(scenario==='invalid')success({coords:{latitude:NaN,longitude:5}});
   },watchPosition(){state.watches++;return 1},clearWatch(){}};
   Object.defineProperty(navigator,'geolocation',{configurable:true,value:scenario==='missing'?undefined:geo});
  },scenario);
  await page.goto('http://127.0.0.1:8765');
  await page.waitForFunction(()=>typeof startupViewState!=='undefined'&&typeof gpsWatchId!=='undefined'&&geometryAtlas.ready,null,{timeout:120000});
  if(scenario==='late'){
   await page.evaluate(()=>{map.setView([58,8],10,{animate:false});startupTest.success({coords:{latitude:60.3913,longitude:5.3221}})});
   assert(await page.evaluate(()=>map.getCenter().distanceTo([58,8])<150),'Late fix must not override a chosen view');
  }else{
   if(scenario==='no-response')await page.waitForFunction(()=>startupViewState.settled,null,{timeout:15000});
   else await page.waitForFunction(()=>startupViewState.settled);
   const expected=scenario==='success'?[60.3913,5.3221]:[59.2181,10.9298];
   const state=await page.evaluate(expected=>{
    const center=map.getCenter(),bounds=L.latLng(expected).toBounds(60000),size=map.getSize();
    const shortEdge=size.x<size.y?map.containerPointToLatLng([size.x-16,size.y/2]):map.containerPointToLatLng([size.x/2,16]);
    return {distance:center.distanceTo(expected),radius:center.distanceTo(shortEdge),contains:map.getBounds().contains(bounds),source:startupViewState.source,watches:startupTest.watches,requests:startupTest.requests,gps:gpsWatchId,following:gpsFollowing};
   },expected);
   console.log(scenario,width,state);assert(state.distance<150);assert(state.radius>=29000&&state.radius<39000,JSON.stringify(state));assert(state.contains);
   assert.equal(state.source,scenario==='success'?'position':'fallback');assert.equal(state.watches,0);assert.equal(state.requests,scenario==='missing'?0:1);assert.equal(state.gps,null);assert.equal(state.following,false);
   if(scenario==='no-response'){
    await page.evaluate(()=>startupTest.success({coords:{latitude:60.3913,longitude:5.3221}}));assert(await page.evaluate(()=>map.getCenter().distanceTo([59.2181,10.9298])<150));
   }
  }
  assert.deepEqual(errors,[]);await page.screenshot({path:'atlas-startup-position-'+scenario+'-'+width+'.png'});await page.close();
 }
 await browser.close();console.log('PASS startup position: desktop/mobile ~30km radius, current position, Fredrikstad for denied/missing/invalid/no response, one fix without GPS tracking, timeout and no late recentering');
})().catch(e=>{console.error(e);process.exit(1)});
