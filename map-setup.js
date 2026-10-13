// Map panes, base layers and UI references. Loaded before app-core.js.
const map=L.map('map',{zoomControl:false,preferCanvas:false,zoomSnap:.25}).setView([59.2181,10.9298],9);L.control.zoom({position:'bottomright'}).addTo(map);
// POTA-punkter ligger i en egen pane over områdepolygonene, men under popup-vinduene.
map.createPane('potaPane');
map.getPane('potaPane').style.zIndex='650';
map.createPane('gpsPane');
map.getPane('gpsPane').style.zIndex='700';
map.createPane('topTooltipPane');
map.getPane('topTooltipPane').style.zIndex='1200';
map.getPane('topTooltipPane').style.pointerEvents='none';
map.createPane('trailCorridorPane');
map.getPane('trailCorridorPane').style.zIndex='390';
map.getPane('trailCorridorPane').style.pointerEvents='none';
map.createPane('overlapPane');
map.getPane('overlapPane').style.zIndex='625';
map.getPane('overlapPane').style.pointerEvents='auto';
const st=document.getElementById('status'), linkbox=document.getElementById('linkbox');
const infoPanel=document.getElementById('infoPanel'), hidePanel=document.getElementById('hidePanel'), showPanel=document.getElementById('showPanel');
hidePanel.onclick=()=>{const center=map.getCenter(),zoom=map.getZoom();infoPanel.classList.add('hidden');showPanel.classList.add('visible');document.body.classList.add('panel-hidden');map.invalidateSize({pan:false});map.setView(center,zoom,{animate:false})};
showPanel.onclick=()=>{const center=map.getCenter(),zoom=map.getZoom();infoPanel.classList.remove('hidden');showPanel.classList.remove('visible');document.body.classList.remove('panel-hidden');map.invalidateSize({pan:false});map.setView(center,zoom,{animate:false})};
const multiMode=document.getElementById('multiMode'), selectedBox=document.getElementById('selectedBox'), selectedList=document.getElementById('selectedList'), countryFilter=document.getElementById('countryFilter');
const baseMapSelect=document.getElementById('baseMapSelect'), locateBtn=document.getElementById('locateBtn'), gpsStatus=document.getElementById('gpsStatus');
const baseLayers={
  osm:L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap-bidragsytere'}),
  esri:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Bakgrunn: Esri'}),
  satellite:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Satellittbilder: Esri, Vantor, Earthstar Geographics og GIS User Community'})
};
let activeBase=null;
function setBaseMap(key){
  key=baseLayers[key]?key:'osm';
  if(activeBase&&map.hasLayer(activeBase))map.removeLayer(activeBase);
  activeBase=baseLayers[key].addTo(map);baseMapSelect.value=key;
  try{localStorage.setItem('potaBaseMap',key)}catch(e){}
}
for(const layer of Object.values(baseLayers))layer.on('tileerror',()=>{st.innerHTML='Bakgrunnskartet kunne ikke lastes. POTA-geometriene kan fortsatt fungere.'});
let initialBase='osm';try{initialBase=localStorage.getItem('potaBaseMap')||'osm'}catch(e){}
setBaseMap(initialBase);
baseMapSelect.addEventListener('change',e=>setBaseMap(e.target.value));

// One startup fix chooses the initial area; the GPS button still owns tracking.
const STARTUP_RADIUS_M=30000,STARTUP_FALLBACK=L.latLng(59.2181,10.9298);
const startupViewState={source:'fallback',settled:false,interacted:false};
let startupViewApplying=false,startupViewTimer=null;
function applyStartupView(center){
 startupViewApplying=true;
 try{map.invalidateSize({pan:false});map.fitBounds(center.toBounds(STARTUP_RADIUS_M*2),{animate:false,padding:[16,16]});map.setView(center,map.getZoom(),{animate:false})}
 finally{startupViewApplying=false}
}
function initializeStartupPosition(){
 // Wait for the responsive layout to settle before fitting the 60 km diameter.
 requestAnimationFrame(()=>{
  applyStartupView(STARTUP_FALLBACK);
  map.on('movestart',()=>{if(!startupViewApplying)startupViewState.interacted=true});
  document.addEventListener('pota:park',()=>{startupViewState.interacted=true});
  const geo=navigator.geolocation;
  if(!window.isSecureContext||typeof geo?.getCurrentPosition!=='function'){startupViewState.settled=true;return}
  const finish=position=>{
   if(startupViewState.settled)return;
   startupViewState.settled=true;clearTimeout(startupViewTimer);
   const lat=position?.coords?.latitude,lon=position?.coords?.longitude;
   if(startupViewState.interacted||gpsWatchId!==null||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return;
   applyStartupView(L.latLng(lat,lon));startupViewState.source='position';
  };
  startupViewTimer=setTimeout(()=>finish(null),10000);
  try{geo.getCurrentPosition(finish,()=>finish(null),{enableHighAccuracy:false,timeout:8000,maximumAge:60000})}catch(e){finish(null)}
 });
}
