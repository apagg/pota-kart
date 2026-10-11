// Park info and overlap chooser presentation; selection and map calculations are unchanged.
function openParkInfo(p,link,latlng=null){
  const potaLink=`<a href="https://pota.app/#/park/${encodeURIComponent(p.reference)}" target="_blank" rel="noopener noreferrer">Åpne parken på pota.app</a>`;
  const content=`<b>${esc(p.reference)} – ${esc(p.name)}</b><br><b>Antall aktiveringer:</b> <span data-pota-activation-count aria-live="polite">Henter …</span><br>${potaLink}`;
  const desktop=!matchMedia('(max-width:700px)').matches;
  const details=`<details class="park-details"><summary>Vis flere detaljer</summary><p><b>Område:</b> ${esc(link?.officialName||p.name)}<br><b>Type:</b> ${esc(link?.type||'Ikke tilgjengelig')}</p><p class="small">${atlasHasGeometry(p.reference)?'Parken har tilgjengelig geometri.':'Geometri mangler – parken vises som punkt.'}</p></details>`;
  linkbox.style.display='block';
  linkbox.innerHTML=desktop?`<div class="park-label">VALGT POTA-PARK</div><div class="park-reference">${esc(p.reference)}</div><h2 class="park-name">${esc(p.name)}</h2><div class="park-activations">Aktiveringer: <span data-pota-activation-count aria-live="polite">Henter …</span></div>${potaLink}${details}`:content;
  const countNodes=[linkbox.querySelector('[data-pota-activation-count]')];
  if(desktop)map.closePopup();
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
  if(!matchMedia('(max-width:700px)').matches){
    const choice=new CustomEvent('pota:overlap',{cancelable:true,detail:{refs:uniq,latlng}});
    if(!document.dispatchEvent(choice))return;
  }
  const box=document.createElement('div');
  const title=document.createElement('b');title.textContent='Velg POTA-park';box.appendChild(title);
  for(const ref of uniq){const x=selectedParks.get(ref);const b=document.createElement('button');b.type='button';b.style.cssText='display:block;width:100%;margin-top:6px;text-align:left';b.textContent=`${ref} – ${x.p.name}`;b.onclick=()=>{map.closePopup();reopenSelectedPark(ref,latlng)};box.appendChild(b)}
  L.popup({autoPan:false}).setLatLng(latlng).setContent(box).openOn(map);
}
