// WMS source layers and shared map selection state.
const NV='https://geodata.naturvardsverket.se/naturvardsregistret/wms';
const N2='https://geodata.naturvardsverket.se/n2000/wms';
function wms(url,layer,opacity=.55,extra={}){return L.tileLayer.wms(url,Object.assign({layers:layer,format:'image/png',transparent:true,version:'1.3.0',opacity,attribution:'Kilde: Naturvårdsverket'},extra));}
const layers={
 np:wms(NV,'Nationalpark',.65), nr:wms(NV,'Naturreservat',.55), nvo:wms(NV,'Naturvardsomrade',.55), kr:wms(NV,'Kulturreservat',.6),
 hab:wms(N2,'Habitatdirektivet',.45), bird:wms(N2,'Fageldirektivet',.45), pts:L.layerGroup()
};
layers.pts.addTo(map);
let selectedMarker=null, selectedGeo=null, pota=[], linkTable={}, potaMarkers=[];
const selectedParks=new Map();
let lastSelectedRef=null;
const overlapLayer=L.layerGroup().addTo(map);
