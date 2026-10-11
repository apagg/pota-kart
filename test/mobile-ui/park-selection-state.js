// Selected park list and selection state helpers.
function clearSelection(){
  if(selectedMarker){map.removeLayer(selectedMarker);selectedMarker=null}
  if(selectedGeo){map.removeLayer(selectedGeo);selectedGeo=null}
  document.dispatchEvent(new CustomEvent('pota:selection'));
}
function removeSelectedPark(ref){
  const x=selectedParks.get(ref);if(!x)return;
  if(x.marker&&map.hasLayer(x.marker))map.removeLayer(x.marker);
  if(x.geo&&map.hasLayer(x.geo))map.removeLayer(x.geo);
  selectedParks.delete(ref);
  if(lastSelectedRef===ref)lastSelectedRef=[...selectedParks.keys()].pop()||null;
  renderSelectedList();updateOverlaps();fitSelected();
}
function clearSelectedParks(){
  for(const x of selectedParks.values()){if(x.marker&&map.hasLayer(x.marker))map.removeLayer(x.marker);if(x.geo&&map.hasLayer(x.geo))map.removeLayer(x.geo)}
  selectedParks.clear();lastSelectedRef=null;renderSelectedList();updateOverlaps();
}
function renderSelectedList(){
  document.dispatchEvent(new CustomEvent('pota:selection'));
  if(!multiMode.checked||!selectedParks.size){selectedBox.style.display='none';selectedList.innerHTML='';return}
  selectedBox.style.display='block';
  selectedList.innerHTML=[...selectedParks.values()].map(x=>`<div class="selitem"><span><b>${esc(x.p.reference)}</b> – ${esc(x.p.name)}</span><button class="remove" data-ref="${esc(x.p.reference)}" title="Fjern">×</button></div>`).join('');
  selectedList.querySelectorAll('button[data-ref]').forEach(b=>b.onclick=()=>removeSelectedPark(b.dataset.ref));
}
function fitSelected(){
  if(!multiMode.checked||!selectedParks.size)return;
  let bounds=null;
  for(const x of selectedParks.values()){
    if(x.geo&&x.geo.getBounds){const b=x.geo.getBounds();if(b.isValid())bounds=bounds?bounds.extend(b):L.latLngBounds(b)}
    else if(x.marker){const ll=x.marker.getLatLng();bounds=bounds?bounds.extend(ll):L.latLngBounds(ll,ll)}
  }
  // Ingen automatisk zoom/panorering ved flervalg.
}
