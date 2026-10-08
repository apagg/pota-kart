// Park catalog loading and country filtering.
function applyCountryFilter(){
 if(geometryAtlas.ready){atlasRefresh();return}
 const c=countryFilter.value;
 for(const x of potaMarkers){const show=c==='ALL'||x.country===c;if(show){if(!layers.pts.hasLayer(x.marker))layers.pts.addLayer(x.marker)}else if(layers.pts.hasLayer(x.marker))layers.pts.removeLayer(x.marker)}
}
async function loadCountryPota(cc){
 const urls=[`https://api.pota.app/program/parks/${cc}`,`https://api.pota.app/location/parks/${cc}`];
 for(const u of urls){try{const d=await getJSON(u);if(Array.isArray(d)&&d.length)return d.filter(x=>(x.reference||'').startsWith(cc+'-'))}catch(e){}}
 return [];
}
async function loadPota(){
 const [se,no]=await Promise.all([loadCountryPota('SE'),loadCountryPota('NO')]);
 pota=[...se,...no];buildLinkTable();layers.pts.clearLayers();potaMarkers=[];
 let shown=0,linked=0;const unknown=[],unsupported=[],byCountry={SE:0,NO:0};
 for(const p of pota){const lat=+p.latitude,lon=+p.longitude;if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;shown++;const cc=countryOf(p);byCountry[cc]=(byCountry[cc]||0)+1;const link=linkTable[p.reference];if(link&&link.layer)linked++;else if(link&&link.recognized)unsupported.push({reference:p.reference,name:p.name,type:link.type});else unknown.push({reference:p.reference,name:p.name});
   const marker=isTrailLink(link)?L.marker([lat,lon],{pane:'potaPane',icon:makeTrailIcon(false)}):L.circleMarker([lat,lon],{pane:'potaPane',radius:6,weight:1,color:'#e67e22',fillColor:'#f39c12',fillOpacity:.8});
   bindParkHover(marker,p,link);
   marker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);showLink(p,true,false)});
   layers.pts.addLayer(marker);potaMarkers.push({marker,country:cc,reference:p.reference});
 }
 applyCountryFilter();return {shown,linked,unknown,unsupported,byCountry};
}
