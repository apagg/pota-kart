// Map panes, base layers and UI references. Loaded before app-core.js.
const map=L.map('map',{zoomControl:false,preferCanvas:false}).setView([62.0,13.0],5);L.control.zoom({position:'bottomright'}).addTo(map);
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
hidePanel.onclick=()=>{infoPanel.classList.add('hidden');showPanel.classList.add('visible')};
showPanel.onclick=()=>{infoPanel.classList.remove('hidden');showPanel.classList.remove('visible')};
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
