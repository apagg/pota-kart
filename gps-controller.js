// GPS controller: extracted without changing GPS follow, membership or trail rules.
let gpsMarker=null,gpsAccuracy=null,lastGps=null,gpsWatchId=null,gpsGeneration=0,gpsFollowing=false;
let gpsCompass=null;
function gpsIcon(){return L.divIcon({className:'',html:'<div class="gps-position"><span class="gps-heading" hidden aria-hidden="true"><svg viewBox="0 0 16 20" focusable="false"><path d="M8 2 L14 17 L8 14 L2 17 Z" fill="#2563eb" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></span><div class="gps-marker" aria-label="Min posisjon"></div></div>',iconSize:[24,24],iconAnchor:[12,12]})}
function gpsHeadingValue(coords){
  // Geolocation heading is travel direction clockwise from true north, not device orientation.
  return Number.isFinite(coords.heading)&&coords.heading>=0&&coords.heading<360&&coords.speed!==0?coords.heading:null;
}
function updateGpsHeading(heading,source='gps'){
  const arrow=gpsMarker?.getElement()?.querySelector('.gps-heading');if(!arrow)return;
  arrow.hidden=heading===null;arrow.style.transform=heading===null?'':`rotate(${heading}deg)`;
  arrow.dataset.headingSource=heading===null?'none':source;
}
function gpsScreenAngle(){
  const angle=screen.orientation?.angle;return Number.isFinite(angle)?angle:Number.isFinite(window.orientation)?window.orientation:0;
}
function gpsCompassValue(event,angle=gpsScreenAngle()){
  const wrap=x=>(x%360+360)%360;
  if(Number.isFinite(event.webkitCompassHeading)&&event.webkitCompassHeading>=0&&event.webkitCompassHeading<360){
    if(Number.isFinite(event.webkitCompassAccuracy)&&event.webkitCompassAccuracy<0)return null;
    return wrap(event.webkitCompassHeading+angle);
  }
  // Relative alpha has no north reference and must never masquerade as a compass.
  if(event.absolute!==true||![event.alpha,event.beta,event.gamma].every(Number.isFinite)||event.alpha<0||event.alpha>=360||Math.abs(event.beta)>180||Math.abs(event.gamma)>90)return null;
  const rad=Math.PI/180,a=event.alpha*rad,b=event.beta*rad,g=event.gamma*rad,s=angle*rad;
  const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cg=Math.cos(g),sg=Math.sin(g);
  // Project the current screen's top edge using the W3C Z-X-Y rotation matrix.
  let east=(ca*cg-sa*sb*sg)*Math.sin(s)-cb*sa*Math.cos(s);
  let north=(sa*cg+ca*sb*sg)*Math.sin(s)+cb*ca*Math.cos(s);
  // At near-vertical screen angles use the forward/back-camera direction instead.
  if(Math.hypot(east,north)<.1){east=-ca*sg-sa*sb*cg;north=-sa*sg+ca*sb*cg;}
  return Math.hypot(east,north)<.1?null:wrap(Math.atan2(east,north)/rad);
}
function renderGpsDirection(){
  const compass=gpsCompass?.heading;
  updateGpsHeading(Number.isFinite(compass)?compass:lastGps?.heading??null,Number.isFinite(compass)?'compass':'gps');
}
function stopGpsCompass(){
  const session=gpsCompass;gpsCompass=null;if(!session)return;
  window.removeEventListener('deviceorientation',session.orientation);
  window.removeEventListener('deviceorientationabsolute',session.orientation);
  window.removeEventListener('orientationchange',session.rotation);
  session.screen?.removeEventListener('change',session.rotation);
  document.removeEventListener('visibilitychange',session.visibility);
}
function startGpsCompass(generation){
  stopGpsCompass();if(typeof window.DeviceOrientationEvent==='undefined'||!window.isSecureContext)return;
  const session=gpsCompass={heading:null,sample:null,screen:screen.orientation};
  const current=()=>gpsCompass===session&&gpsGeneration===generation&&gpsWatchId!==null;
  session.orientation=event=>{
    if(!current()||document.hidden)return;
    if(event.absolute!==true&&!('webkitCompassHeading' in event))return;
    session.sample={alpha:event.alpha,beta:event.beta,gamma:event.gamma,absolute:event.absolute,webkitCompassHeading:event.webkitCompassHeading,webkitCompassAccuracy:event.webkitCompassAccuracy};
    session.heading=gpsCompassValue(session.sample);renderGpsDirection();
  };
  session.rotation=()=>{if(current()&&session.sample){session.heading=gpsCompassValue(session.sample);renderGpsDirection();}};
  session.visibility=()=>{if(current()&&document.hidden){session.sample=null;session.heading=null;renderGpsDirection();}};
  const listen=()=>{
    if(!current())return;
    window.addEventListener('deviceorientation',session.orientation);
    window.addEventListener('deviceorientationabsolute',session.orientation);
    window.addEventListener('orientationchange',session.rotation);
    session.screen?.addEventListener('change',session.rotation);
    document.addEventListener('visibilitychange',session.visibility);
  };
  try{
    const permission=window.DeviceOrientationEvent.requestPermission;
    // Invoke synchronously in the GPS click's user activation, before any await.
    if(typeof permission==='function')Promise.resolve(permission.call(window.DeviceOrientationEvent,true)).then(result=>{if(result==='granted')listen();}).catch(()=>{});
    else listen();
  }catch(e){/* GPS course remains available if the compass is denied or unsupported. */}
}
function gpsInsideSelected(lat,lon){
  if(typeof turf==='undefined')return[];const pt=turf.point([lon,lat]),hits=[];
  const entries=[...selectedParks];
  if(!multiMode.checked&&lastSelectedRef&&(selectedGeo||selectedMarker))entries.push([lastSelectedRef,{geo:selectedGeo,p:pota.find(p=>p.reference===lastSelectedRef),link:linkTable[lastSelectedRef]}]);
  for(const [ref,x] of entries){if(!x.geo){if(gpsPointHit(x.p||pota.find(p=>p.reference===ref),L.latLng(lat,lon)))hits.push(ref);continue;}let hit=false;
    for(const f of featuresOfGeoJson(x.geo.toGeoJSON())){const g=f.geometry;if(!g)continue;try{
      if(g.type==='Polygon'||g.type==='MultiPolygon')hit=turf.booleanPointInPolygon(pt,f);
      else if(isTrailLink(x.link)&&(g.type==='LineString'||g.type==='MultiLineString')){const b=turf.buffer(f,TRAIL_BUFFER_M/1000,{units:'kilometers',steps:12});hit=!!b&&turf.booleanPointInPolygon(pt,b)}
    }catch(e){}if(hit)break}
    if(hit)hits.push(ref);
  }return hits;
}
function updateGpsStatus(lat,lon,accuracy){
  const hits=gpsInsideSelected(lat,lon);gpsStatus.classList.add('visible');
  gpsStatus.innerHTML=`<b>GPS:</b> ${lat.toFixed(5)}, ${lon.toFixed(5)}${Number.isFinite(accuracy)?` · nøyaktighet ca. ${Math.round(accuracy)} m`:''}${hits.length?`<br><b>Innenfor valgt POTA:</b> ${hits.map(esc).join(', ')}`:'<br>Ikke innenfor noen valgt POTA-park.'}`;
}
function syncGpsControl(waiting=false){
  const active=gpsWatchId!==null;
  locateBtn.disabled=false;locateBtn.classList.toggle('locating',active&&waiting);locateBtn.classList.toggle('gps-active',active);
  const state=active?(gpsFollowing?'following':'paused'):'off';
  locateBtn.dataset.gpsState=state;
  locateBtn.textContent=active?(gpsFollowing?'Stopp GPS':'Følg posisjon'):'Min posisjon';locateBtn.setAttribute('aria-pressed',String(active));
  locateBtn.title=active?(gpsFollowing?'GPS følger posisjonen – trykk for å slå av GPS':'GPS er på, følging er pauset – trykk for å følge igjen'):'Slå på GPS og følg posisjonen';
  document.dispatchEvent(new CustomEvent('pota:gps',{detail:{active,following:active&&gpsFollowing,waiting:active&&waiting}}));
}
function stopGps(){
  gpsGeneration++;
  stopGpsCompass();
  if(gpsWatchId!==null)navigator.geolocation.clearWatch(gpsWatchId);
  gpsWatchId=null;lastGps=null;gpsFollowing=false;
  if(gpsMarker)map.removeLayer(gpsMarker);if(gpsAccuracy)map.removeLayer(gpsAccuracy);
  gpsMarker=null;gpsAccuracy=null;syncGpsControl();updateGpsParkColors();
}
function locateUser(){
  if(gpsWatchId!==null){
    if(!gpsFollowing){gpsFollowing=true;if(lastGps)map.panTo([lastGps.lat,lastGps.lon],{animate:false});syncGpsControl(!lastGps);return}
    stopGps();gpsStatus.textContent='GPS er slått av.';return;
  }
  gpsStatus.classList.add('visible');
  if(!navigator.geolocation){gpsStatus.textContent='GPS/geolokasjon støttes ikke av denne nettleseren.';return}
  const generation=++gpsGeneration;let firstPosition=true;gpsFollowing=true;
  gpsStatus.textContent='Henter posisjon…';
  const fail=err=>{
    if(generation!==gpsGeneration)return;
    if(err.code===1){stopGps();gpsStatus.textContent='Posisjonstilgang er avslått. Tillat posisjon i nettleseren og trykk Min posisjon igjen.';return}
    syncGpsControl();gpsStatus.textContent='Venter på GPS-posisjon. '+(lastGps?'Siste posisjon vises i kartet. ':'')+'Oppfølgingen fortsetter.';
  };
  try{
    gpsWatchId=navigator.geolocation.watchPosition(pos=>{
      if(generation!==gpsGeneration)return;
      const {latitude:lat,longitude:lon,accuracy}=pos.coords,heading=gpsHeadingValue(pos.coords);lastGps={lat,lon,accuracy,heading};
      const radius=Number.isFinite(accuracy)?Math.max(0,accuracy):0;
      if(gpsAccuracy)gpsAccuracy.setLatLng([lat,lon]).setRadius(radius);
      else gpsAccuracy=L.circle([lat,lon],{pane:'overlapPane',radius,color:'#2563eb',weight:1,fillColor:'#60a5fa',fillOpacity:.08,interactive:false}).addTo(map);
      if(gpsMarker)gpsMarker.setLatLng([lat,lon]);
      else gpsMarker=L.marker([lat,lon],{pane:'gpsPane',icon:gpsIcon(),zIndexOffset:1000}).addTo(map).bindTooltip('Min posisjon',{pane:'topTooltipPane',direction:'top',offset:[0,-8],className:'pota-hover-tooltip'});
      renderGpsDirection();
      if(gpsFollowing){if(firstPosition&&map.getZoom()<12)map.setView([lat,lon],14);else map.panTo([lat,lon],{animate:false})}
      firstPosition=false;
      syncGpsControl();updateGpsStatus(lat,lon,accuracy);updateGpsParkColors();
    },fail,{enableHighAccuracy:true,timeout:15000,maximumAge:0});
    startGpsCompass(generation);
    syncGpsControl(true);
  }catch(err){stopGps();gpsStatus.textContent='Kunne ikke starte GPS. Sjekk nettleserens posisjonstilgang.'}
}
map.on('dragstart',()=>{if(gpsWatchId!==null&&gpsFollowing){gpsFollowing=false;syncGpsControl(!lastGps)}});
locateBtn.addEventListener('click',locateUser);syncGpsControl();
// Refresh membership when the user changes the selection without moving.
document.addEventListener('pota:selection',()=>{if(lastGps)updateGpsStatus(lastGps.lat,lastGps.lon,lastGps.accuracy);updateGpsParkColors()});
