// Park selection, multiselect and selection UI wiring.
let parkSelectionQueue=Promise.resolve();
function showLink(p,openPopup=true,centerOnSearch=false,popupLatLng=null){
 const task=parkSelectionQueue.then(()=>showParkLink(p,openPopup,centerOnSearch,popupLatLng));
 parkSelectionQueue=task.catch(e=>console.error(e));return task;
}
async function showParkLink(p,openPopup=true,centerOnSearch=false,popupLatLng=null){
  const multi=multiMode.checked;
  if(multi&&selectedParks.has(p.reference)){
    lastSelectedRef=p.reference;
    const existing=selectedParks.get(p.reference);
    if(centerOnSearch)map.setView(existing.marker?.getLatLng()||[+p.latitude,+p.longitude],Math.max(11,map.getZoom()));
    openParkInfo(existing.p,existing.link,openPopup?(popupLatLng||existing.marker?.getLatLng()||L.latLng(+p.latitude,+p.longitude)):null);
    renderSelectedList();return;
  }
  if(!multi){clearSelectedParks();clearSelection()}
  else {selectedMarker=null;selectedGeo=null}
  const lat=+p.latitude,lon=+p.longitude,link=linkTable[p.reference]||inferLink(p);
  if(centerOnSearch&&Number.isFinite(lat)&&Number.isFinite(lon))map.setView([lat,lon],Math.max(11,map.getZoom()));
  if(!atlasHasGeometry(p.reference)&&Number.isFinite(lat)&&Number.isFinite(lon)){
    if(centerOnSearch)map.setView([lat,lon],map.getZoom());
    selectedMarker=isTrailLink(link)?L.marker([lat,lon],{pane:'potaPane',icon:makeTrailIcon(true)}).addTo(map):L.circleMarker([lat,lon],{pane:'potaPane',radius:6,weight:2,color:'#b45309',fillColor:'#d97706',fillOpacity:.95}).addTo(map);
    bindParkHover(selectedMarker,p,link);
    selectedMarker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);openParkInfo(p,link,e.latlng||selectedMarker.getLatLng())});
  }
  openParkInfo(p,link,openPopup?(popupLatLng||(Number.isFinite(lat)&&Number.isFinite(lon)?L.latLng(lat,lon):null)):null);
  const result=await focusOfficialGeometry(link,p);
  if(result&&selectedGeo&&selectedMarker){map.removeLayer(selectedMarker);selectedMarker=null}
  if(!result&&!selectedMarker&&Number.isFinite(lat)&&Number.isFinite(lon)){selectedMarker=L.circleMarker([lat,lon],{pane:'potaPane',radius:6,weight:2,color:'#b45309',fillColor:'#d97706',fillOpacity:.95}).addTo(map);bindParkHover(selectedMarker,p,link);selectedMarker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);openParkInfo(p,link,L.latLng(lat,lon))});}
  if(selectedGeo)bindSelectedGeometry(selectedGeo,p,link);
  if(multi){
    selectedParks.set(p.reference,{p,link,marker:selectedMarker,geo:selectedGeo});
    lastSelectedRef=p.reference;selectedMarker=null;selectedGeo=null;
    renderSelectedList();updateOverlaps();
  } else {lastSelectedRef=p.reference}
  document.dispatchEvent(new CustomEvent('pota:selection'));
}

function setMultiMode(on){
  if(on){
    if(lastSelectedRef&&!selectedParks.has(lastSelectedRef)&&(selectedMarker||selectedGeo)){
      const p=pota.find(x=>x.reference===lastSelectedRef);
      if(p){selectedParks.set(p.reference,{p,link:linkTable[p.reference]||inferLink(p),marker:selectedMarker,geo:selectedGeo});selectedMarker=null;selectedGeo=null;}
    }
    renderSelectedList();updateOverlaps();return;
  }
  if(selectedParks.size){
    const keepRef=lastSelectedRef&&selectedParks.has(lastSelectedRef)?lastSelectedRef:[...selectedParks.keys()].pop();
    const keep=selectedParks.get(keepRef);
    for(const [ref,x] of selectedParks){if(ref!==keepRef){if(x.marker&&map.hasLayer(x.marker))map.removeLayer(x.marker);if(x.geo&&map.hasLayer(x.geo))map.removeLayer(x.geo)}}
    selectedParks.clear();selectedBox.style.display='none';selectedList.innerHTML='';
    selectedMarker=keep?.marker||null;selectedGeo=keep?.geo||null;
    updateOverlaps();
    if(keep){linkbox.style.display='block';const link=keep.link;linkbox.innerHTML=`<b>${esc(keep.p.reference)} – ${esc(keep.p.name)}</b><br>Valgt POTA-park: <b>${esc(link.officialName)}</b> <span class="badge">${esc(link.type)}</span>`;}
  }
}
multiMode.addEventListener('change',e=>setMultiMode(e.target.checked));
document.getElementById('clearSelected').onclick=()=>{clearSelectedParks();linkbox.style.display='none';st.innerHTML='Utvalget er tømt. Klikk eller søk etter en POTA-park.'};

