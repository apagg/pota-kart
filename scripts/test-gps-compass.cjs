const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const state=window.compassTest={mode:'granted',requests:[],pending:[],hidden:false,listeners:new Map(),watches:new Map(),next:0,cleared:[]};
  const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);
  window.addEventListener=(type,fn,...args)=>{if(type.startsWith('deviceorientation')){if(!state.listeners.has(type))state.listeners.set(type,new Set());state.listeners.get(type).add(fn);}return add(type,fn,...args)};
  window.removeEventListener=(type,fn,...args)=>{state.listeners.get(type)?.delete(fn);return remove(type,fn,...args)};
  state.screen=new EventTarget();state.screen.angle=0;Object.defineProperty(screen,'orientation',{configurable:true,value:state.screen});
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>state.hidden});
  state.permission=function(absolute){state.requests.push({absolute,activation:navigator.userActivation.isActive});if(state.mode==='throw')throw Error('Unavailable');if(state.mode==='rejected')return Promise.reject(Error('Unavailable'));if(state.mode==='deferred')return new Promise(resolve=>state.pending.push(resolve));return Promise.resolve(state.mode)};
  state.Orientation=class extends Event{};state.Orientation.requestPermission=state.permission;
  Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,writable:true,value:state.Orientation});
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(success,error){const id=state.next++;state.watches.set(id,{success,error});return id},clearWatch(id){state.cleared.push(id)}}});
 });
 await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>typeof geometryAtlas!=='undefined'&&geometryAtlas.ready&&document.body.classList.contains('mobile-layout'),null,{timeout:120000});
 assert.equal(await page.evaluate(()=>compassTest.requests.length),0,'No sensor prompt on page load');
 const button=()=>page.locator(page.viewportSize().width>700?'#locateBtn':'#mobileLocate');
 const start=async mode=>{await page.evaluate(mode=>{compassTest.mode=mode},mode);await button().click();await page.waitForTimeout(50);return page.evaluate(()=>gpsWatchId)};
 const stop=async()=>{if(!await page.evaluate(()=>gpsFollowing))await button().click();await button().click();assert.equal(await page.evaluate(()=>gpsCompass),null);assert.equal(await page.evaluate(()=>[...compassTest.listeners.values()].reduce((n,s)=>n+s.size,0)),0,'Sensor listeners cleaned up')};
 const fix=(heading=null,speed=0)=>page.evaluate(({heading,speed})=>{compassTest.watches.get(gpsWatchId).success({coords:{latitude:60.01,longitude:10.01,accuracy:8,heading,speed}})},{heading,speed});
 const sensor=(props,type='deviceorientation')=>page.evaluate(({props,type})=>{const e=new Event(type);Object.entries(props).forEach(([key,value])=>Object.defineProperty(e,key,{value}));window.dispatchEvent(e)},{props,type});
 const angle=deg=>page.evaluate(deg=>{compassTest.screen.angle=deg;compassTest.screen.dispatchEvent(new Event('change'))},deg);
 const direction=async(degrees,source='compass')=>{const d=await page.locator('.gps-heading').evaluate(el=>({hidden:el.hidden,source:el.dataset.headingSource,angle:parseFloat(el.style.transform.slice(7))}));assert.equal(d.hidden,false);assert.equal(d.source,source);assert(Math.abs(((d.angle-degrees+540)%360)-180)<.01,JSON.stringify(d));};
 const first=await start('granted');assert.equal(await page.evaluate(()=>compassTest.requests[0].activation),true,'Permission requested inside GPS user click');assert.equal(await page.evaluate(()=>compassTest.requests[0].absolute),true);
 await fix();assert.equal(await page.locator('.gps-heading').isVisible(),false);
 const marker=await page.evaluate(()=>L.stamp(gpsMarker));
 await sensor({webkitCompassHeading:0,webkitCompassAccuracy:5});await direction(0);
 await fix(270,2);await direction(0,'compass'); // Compass takes priority even while moving.
 await sensor({webkitCompassHeading:90,webkitCompassAccuracy:5});await direction(90);
 await angle(90);await direction(180);await angle(-90);await direction(0);await angle(180);await direction(270);await angle(0);
 await sensor({webkitCompassHeading:90,webkitCompassAccuracy:-1});await direction(270,'gps');
 await sensor({absolute:false,alpha:30,beta:45,gamma:0});await direction(270,'gps');
 await fix(null,0);
 for(const [alpha,expected] of [[0,0],[270,90],[180,180],[90,270]]){await sensor({absolute:true,alpha,beta:45,gamma:20},'deviceorientationabsolute');await direction(expected);}
 await sensor({absolute:false,alpha:25,beta:45,gamma:0});await direction(270); // Relative event cannot replace north-referenced data.
 await sensor({absolute:true,alpha:270,beta:90,gamma:0},'deviceorientationabsolute');await direction(90,'compass');
 await angle(90);await sensor({absolute:true,alpha:0,beta:0,gamma:30},'deviceorientationabsolute');await direction(90);await angle(0);
 await sensor({absolute:true,alpha:null,beta:null,gamma:null},'deviceorientationabsolute');assert.equal(await page.locator('.gps-heading').isVisible(),false);
 await sensor({webkitCompassHeading:45,webkitCompassAccuracy:5});await direction(45);
 await page.evaluate(()=>{compassTest.hidden=true;document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await page.locator('.gps-heading').isVisible(),false,'Clear compass when backgrounded');
 await sensor({webkitCompassHeading:90});assert.equal(await page.locator('.gps-heading').isVisible(),false);
 await page.evaluate(()=>{compassTest.hidden=false;document.dispatchEvent(new Event('visibilitychange'))});await sensor({webkitCompassHeading:90});await direction(90);
 await page.evaluate(()=>{map.fire('dragstart')});const center=await page.evaluate(()=>({lat:map.getCenter().lat,lng:map.getCenter().lng}));
 await sensor({webkitCompassHeading:270});await direction(270);assert.equal(await page.evaluate(()=>gpsFollowing),false);assert.deepEqual(await page.evaluate(()=>({lat:map.getCenter().lat,lng:map.getCenter().lng})),center,'Compass must not pan the map');assert.equal(await page.evaluate(()=>L.stamp(gpsMarker)),marker);
 await page.screenshot({path:'atlas-gps-compass-mobile.png'});
 await page.setViewportSize({width:1280,height:900});await page.waitForFunction(()=>document.body.classList.contains('desktop-layout'));await page.waitForTimeout(300);await sensor({webkitCompassHeading:90});await direction(90);await page.screenshot({path:'atlas-gps-compass-desktop.png'});
 await stop();await sensor({webkitCompassHeading:45});assert.equal(await page.locator('.gps-heading').count(),0);
 await page.evaluate(id=>{compassTest.watches.get(id).success({coords:{latitude:61,longitude:11,accuracy:5,heading:0,speed:0}})},first);assert.equal(await page.evaluate(()=>gpsMarker),null);
 for(const mode of ['denied','rejected','throw']){await start(mode);await fix(45,2);await direction(45,'gps');await sensor({webkitCompassHeading:90});await direction(45,'gps');assert.equal(await page.evaluate(()=>[...compassTest.listeners.values()].reduce((n,s)=>n+s.size,0)),0);await stop();}
 await start('deferred');await fix(270,2);await stop();await start('granted');await fix(null,0);await page.evaluate(()=>compassTest.pending.shift()('granted'));await page.waitForTimeout(50);assert.deepEqual(await page.evaluate(()=>[...compassTest.listeners.values()].map(s=>s.size)),[1,1],'Old permission grant cannot reattach listeners');await sensor({webkitCompassHeading:180});await direction(180);await stop();
 await page.evaluate(()=>{delete DeviceOrientationEvent.requestPermission});const requestCount=await page.evaluate(()=>compassTest.requests.length);await start('granted');await fix();await sensor({absolute:true,alpha:270,beta:30,gamma:0},'deviceorientationabsolute');await direction(90);assert.equal(await page.evaluate(()=>compassTest.requests.length),requestCount,'Browsers without requestPermission still receive absolute orientation');await stop();
 await page.evaluate(()=>{window.DeviceOrientationEvent=undefined});await start('granted');await fix(135,2);await direction(135,'gps');await stop();
 assert.deepEqual(errors,[]);console.log('PASS compass: Safari/Android, tilt, portrait/landscape, stationary priority, GPS fallback, permission denial/rejection, user activation, stale grants, pause, visibility, stop/restart and unsupported browsers');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
