// GPS controller: extracted without changing GPS follow, membership or trail rules.
let gpsMarker=null,gpsAccuracy=null,lastGps=null,gpsWatchId=null,gpsGeneration=0,gpsFollowing=false;
function gpsIcon(){return L.divIcon({className:'',html:'<div class="gps-marker" aria-label="Min posisjon"></div>',iconSize:[18,18],iconAnchor:[9,9]})}
function gpsInsideSelected(lat,lon){
  if(typeof turf==='undefined')return[];const pt=turf.point([lon,lat]),hits=[];
  const entries=[...selectedParks];
  if(!multiMode.checked&&lastSelectedRef&&selectedGeo)entries.push([lastSelectedRef,{geo:selectedGeo,link:linkTable[lastSelectedRef]}]);
  for(const [ref,x] of entries){if(!x.geo)continue;let hit=false;
    for(const f of featuresOfGeoJson(x.geo.toGeoJSON())){const g=f.geometry;if(!g)continue;try{
      if(g.type==='Polygon'||g.type==='MultiPolygon')hit=turf.booleanPointInPolygon(pt,f);
      else if(isTrailLink(x.link)&&(g.type==='LineString'||g.type==='MultiLineString')){const b=turf.buffer(f,TRAIL_BUFFER_M/1000,{units:'kilometers',steps:12});hit=!!b&&turf.booleanPointInPolygon(pt,b)}
    }catch(e){}if(hit)break}
    if(hit)hits.push(ref);
  }return hits;
}
function updateGpsStatus(lat,lon,accuracy){
  const hits=gpsInsideSelected(lat,lon);gpsStatus.classList.add('visible');
  gpsStatus.innerHTML=`<b>GPS:</b> ${lat.toFixed(5)}, ${lon.toFixed(5)}${Number.isFinite(accuracy)?` · nøyaktighet ca. ${Math.round(accuracy)} m`:''}${hits.length?`<br><b>Innenfor valgt POTA:</b> ${hits.map(esc).join(', ')}`:'<br>Ikke innenfor noen valgt POTA-geometri.'}`;
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
      const {latitude:lat,longitude:lon,accuracy}=pos.coords;lastGps={lat,lon,accuracy};
      const radius=Number.isFinite(accuracy)?Math.max(0,accuracy):0;
      if(gpsAccuracy)gpsAccuracy.setLatLng([lat,lon]).setRadius(radius);
      else gpsAccuracy=L.circle([lat,lon],{pane:'overlapPane',radius,color:'#2563eb',weight:1,fillColor:'#60a5fa',fillOpacity:.08,interactive:false}).addTo(map);
      if(gpsMarker)gpsMarker.setLatLng([lat,lon]);
      else gpsMarker=L.marker([lat,lon],{pane:'gpsPane',icon:gpsIcon(),zIndexOffset:1000}).addTo(map).bindTooltip('Min posisjon',{pane:'topTooltipPane',direction:'top',offset:[0,-8],className:'pota-hover-tooltip'});
      if(gpsFollowing){if(firstPosition&&map.getZoom()<12)map.setView([lat,lon],14);else map.panTo([lat,lon],{animate:false})}
      firstPosition=false;
      syncGpsControl();updateGpsStatus(lat,lon,accuracy);updateGpsParkColors();
    },fail,{enableHighAccuracy:true,timeout:15000,maximumAge:0});
    syncGpsControl(true);
  }catch(err){stopGps();gpsStatus.textContent='Kunne ikke starte GPS. Sjekk nettleserens posisjonstilgang.'}
}
map.on('dragstart',()=>{if(gpsWatchId!==null&&gpsFollowing){gpsFollowing=false;syncGpsControl(!lastGps)}});
locateBtn.addEventListener('click',locateUser);syncGpsControl();
// Refresh membership when the user changes the selection without moving.
document.addEventListener('pota:selection',()=>{if(lastGps)updateGpsStatus(lastGps.lat,lastGps.lon,lastGps.accuracy);updateGpsParkColors()});
