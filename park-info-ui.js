// Park info, popup and overlap chooser UI; unchanged behavior.
function openParkInfo(p,link,latlng=null){
  const potaLink=`<a href="https://pota.app/#/park/${encodeURIComponent(p.reference)}" target="_blank" rel="noopener noreferrer">Åpne parken på pota.app</a>`;
  const content=`<b>${esc(p.reference)} – ${esc(p.name)}</b><br><b>Antall aktiveringer:</b> <span data-pota-activation-count aria-live="polite">Henter …</span><br>${potaLink}`;
  linkbox.style.display='block';linkbox.innerHTML=content;
  const countNodes=[linkbox.querySelector('[data-pota-activation-count]')];
  if(latlng&&!matchMedia('(max-width:700px)').matches){
    const popupContent=document.createElement('div');popupContent.innerHTML=content;
    countNodes.push(popupContent.querySelector('[data-pota-activation-count]'));
    L.popup({autoPan:false}).setLatLng(latlng).setContent(popupContent).openOn(map);
  }
  getPotaActivationCount(p.reference).then(count=>{
    const text=count===null?'ikke tilgjengelig':count.toLocaleString('nb-NO');
    for(const node of countNodes)node.textContent=text;
  });
  document.dispatchEvent(new CustomEvent('pota:park',{detail:{p,link}}));
}
function reopenSelectedPark(ref,latlng=null){
  const x=selectedParks.get(ref);if(!x)return;
  lastSelectedRef=ref;openParkInfo(x.p,x.link,latlng||x.marker?.getLatLng()||null);
}
function bindSelectedGeometry(layer,p,link){
  if(!layer||!layer.on)return;
  bindParkGeometryHover(layer,p);
  layer.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e);atlasPick(e.latlng,p.reference)});
}
function openOverlapChooser(refs,latlng){
  const uniq=[...new Set(refs)].filter(r=>selectedParks.has(r));if(!uniq.length)return;
  if(uniq.length===1){reopenSelectedPark(uniq[0],latlng);return}
  const box=document.createElement('div');
  const title=document.createElement('b');title.textContent='Velg POTA-park';box.appendChild(title);
  for(const ref of uniq){const x=selectedParks.get(ref);const b=document.createElement('button');b.type='button';b.style.cssText='display:block;width:100%;margin-top:6px;text-align:left';b.textContent=`${ref} – ${x.p.name}`;b.onclick=()=>{map.closePopup();reopenSelectedPark(ref,latlng)};box.appendChild(b)}
  L.popup({autoPan:false}).setLatLng(latlng).setContent(box).openOn(map);
}
