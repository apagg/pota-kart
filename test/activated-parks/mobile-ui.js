// Mobile interactions for the static sheet and toolbar.
(()=>{
  const mq=matchMedia('(max-width:700px)'), $=id=>document.getElementById(id);
  const panel=$('infoPanel'),content=$('mobilePanelContent');
  const geometryResults=new Map(),geometryNote=$('mobileGeometryNote'),choices=$('mobileOverlapChoices');
  const mobileList=$('mobileSelectedList'),mobileActions=content.querySelector('.mobile-selected-actions');
  const parkDetails=$('mobileParkDetails'),help=$('mobileHelp'),empty=$('mobileEmptySelection'),selectionGroup=content.querySelector('.mobile-selection-group');
  const searchRow=$('q').closest('.row');
  // Shared controls move only between declared destinations; both views are static HTML.
  const shared=[
    {node:searchRow,desktop:$('desktopSearchSlot'),mobile:$('mobileSearchPopover')},
    {node:$('countryFilter').closest('.row'),desktop:$('desktopCountrySlot'),mobile:$('mobileSettingsContent')},
    {node:$('baseMapSelect').closest('.row'),desktop:$('desktopBasemapSlot'),mobile:$('mobileLayersContent')},
    {node:$('multiMode').closest('.selectbar'),desktop:$('desktopMultiSlot'),mobile:$('mobileSettingsContent')},
    {node:$('activationSettings'),desktop:$('desktopActivationSlot'),mobile:$('mobileSettingsContent')},
    {node:document.querySelector('.mapkey'),desktop:$('desktopLegendSlot'),mobile:$('mobileSettingsContent')},
    {node:$('geometrySummary'),desktop:$('desktopGeometrySlot'),mobile:$('mobileSettingsContent')},
    {node:$('gpsStatus'),desktop:$('desktopGpsStatusSlot'),mobile:$('mobileSettingsContent')}
  ];
  let current=null,view='park',expanded=false,enabled=false;
  function syncActivationCount(){
    const text=$('linkbox').querySelector('[data-pota-activation-count]')?.textContent||'Henter …';
    if($('mobileActivationCount').textContent!==text)$('mobileActivationCount').textContent=text;
  }
  new MutationObserver(syncActivationCount).observe($('linkbox'),{childList:true,subtree:true,characterData:true});
  function closeSearch(){ $('mobileSearchPopover').hidden=true;$('mobileSearch').setAttribute('aria-expanded','false'); }
  let selectionKey='',detailsKey='';
  function renderMobileSelection(entries){
    const key=JSON.stringify([entries.map(x=>[x.p.reference,x.p.name]),current?.p.reference]);
    if(key===selectionKey)return;selectionKey=key;mobileList.replaceChildren();
    for(const x of entries){
      const row=document.createElement('div');row.className='mobile-selected-row';
      const open=document.createElement('button');open.type='button';open.className='mobile-selected-open';open.dataset.reference=x.p.reference;
      open.textContent=x.p.reference+' – '+x.p.name;open.setAttribute('aria-current',String(current?.p.reference===x.p.reference));
      open.onclick=()=>{lastSelectedRef=x.p.reference;openParkInfo(x.p,x.link);};
      const remove=document.createElement('button');remove.type='button';remove.className='mobile-selected-remove';remove.dataset.reference=x.p.reference;
      remove.textContent='×';remove.setAttribute('aria-label','Fjern '+x.p.reference);
      remove.onclick=()=>{if(multiMode.checked)removeSelectedPark(x.p.reference);else{clearSelection();lastSelectedRef=null;update();}};
      row.append(open,remove);mobileList.appendChild(row);
    }
  }
  function renderParkDetails(){
    const key=JSON.stringify([current?.p.reference,current?.link?.officialName,current?.link?.type,geometryResults.get(current?.p.reference)]);
    if(key===detailsKey)return;detailsKey=key;parkDetails.replaceChildren();if(!current)return;
    const dl=document.createElement('dl');
    const items=[['Område',current.link?.officialName||current.p.name],['Parktype',current.link?.type||'Ikke tilgjengelig']];
    if((geometryResults.get(current.p.reference)??atlasHasGeometry(current.p.reference)))items.push(['Geometri',isTrailLink(current.link)?'Stigeometri tilgjengelig':'Områdegeometri tilgjengelig']);
    for(const [label,text] of items){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=text;dl.append(dt,dd);}
    parkDetails.appendChild(dl);
  }
  function update(){
    let entries=[...selectedParks.values()].filter(x=>x.p);
    if(!multiMode.checked){
      const p=lastSelectedRef&&(selectedMarker||selectedGeo)&&pota.find(p=>p.reference===lastSelectedRef);
      entries=p?[{p,link:current?.p.reference===p.reference?current.link:linkTable[p.reference]||inferLink(p)}]:[];
    }
    const count=entries.length;$('mobileCount').textContent=count;
    renderMobileSelection(entries);
    empty.hidden=count>0;
    const isPark=view==='park';
    $('mobileParkRef').textContent=isPark&&current?current.p.reference:'';
    $('mobileParkTitle').textContent=isPark?(current?current.p.name:'Velg en POTA-park'):view==='overlap'?'Velg POTA-park':view==='layers'?'Karttype':'Innstillinger';
    $('mobileParkType').textContent=isPark?'Trykk på et område, en sti eller et punkt':view==='overlap'?'Flere parker her – trykk på parken du ønsker':view==='layers'?'Velg bakgrunnskart':'Land, flervalg og hjelp';
    $('mobileParkType').hidden=!!(isPark&&current);
    $('mobileParkSummary').hidden=!isPark||!current;
    renderParkDetails();
    if(current)$('mobilePotaLink').href='https://pota.app/#/park/'+encodeURIComponent(current.p.reference);
    if(current){const personal=$('mobilePersonalActivation');personal.dataset.personalActivation=current.p.reference;personal.hidden=typeof parkActivations==='undefined'||!parkActivations.statusText(current.p.reference);personal.textContent=typeof parkActivations==='undefined'?'':parkActivations.statusText(current.p.reference);}
    syncActivationCount();
    $('mobileLayers').setAttribute('aria-expanded',String(view==='layers'&&expanded));
    panel.dataset.mobileView=view;panel.classList.toggle('sheet-expanded',expanded);
    $('mobileHandle').setAttribute('aria-expanded',String(expanded));
    $('mobileHandle').setAttribute('aria-label',expanded?'Minimer parkboksen':'Utvid parkboksen');
    $('mobileSettings').setAttribute('aria-expanded',String(view==='settings'&&expanded));
    if(enabled)for(const child of content.children){const visible=expanded&&(child.dataset.mobileSection||'').split(' ').includes(isPark?'details':view);child.hidden=!visible;}
    geometryNote.hidden=!(enabled&&isPark&&expanded&&current&&geometryResults.get(current.p.reference)===false);
    mobileList.hidden=!enabled||!isPark||!expanded;
    empty.hidden=!enabled||!isPark||!expanded||count>0;
    mobileActions.hidden=!enabled||!isPark||!expanded||count===0;
  }
  function openView(next,full=true){view=next;expanded=full;closeSearch();panel.classList.remove('hidden');update();content.scrollTop=0;}
  function activate(){
    enabled=mq.matches;document.body.classList.toggle('mobile-layout',enabled);
    if(enabled){for(const x of shared)x.mobile===$('mobileSettingsContent')?x.mobile.insertBefore(x.node,help):x.mobile.appendChild(x.node);panel.classList.remove('hidden');$('showPanel').classList.remove('visible');update();}
    else{for(const x of shared)x.desktop.appendChild(x.node);for(const child of content.children)child.hidden=true;empty.hidden=true;selectionGroup.hidden=true;mobileList.hidden=true;mobileActions.hidden=true;parkDetails.hidden=true;choices.hidden=true;if(view==='overlap'){view='park';expanded=false;}closeSearch();panel.classList.remove('hidden');}
    map.invalidateSize({pan:false});
  }
  $('mobileSearch').onclick=()=>{const open=$('mobileSearchPopover').hidden;$('mobileSearchPopover').hidden=!open;$('mobileSearch').setAttribute('aria-expanded',String(open));if(open)$('q').focus();};
  $('mobileSearchClose').onclick=closeSearch;
  $('mobileLayers').onclick=()=>{openView('layers');$('baseMapSelect').focus();};
  $('mobileLocate').onclick=()=>{$('locateBtn').click();};
  function syncMobileGps(){
    const active=$('locateBtn').getAttribute('aria-pressed')==='true',button=$('mobileLocate');
    const state=$('locateBtn').dataset.gpsState||'off',waiting=$('locateBtn').classList.contains('locating');
    button.dataset.gpsState=state;button.classList.toggle('locating',waiting);
    $('mobileGpsLabel').textContent=state==='paused'?'Pauset':state==='following'?(waiting?'Søker':'Følger'):'GPS av';
    button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',$('locateBtn').textContent);
    button.title=$('locateBtn').title;button.disabled=false;
  }
  document.addEventListener('pota:gps',syncMobileGps);syncMobileGps();
  $('mobileSettings').onclick=()=>openView('settings');
  $('mobileSheetClose').onclick=()=>openView('park',false);
  $('mobileHandle').onclick=()=>{expanded=!expanded;update();};
  $('mobileClearSelected').onclick=()=>{clearSelectedParks();if(!multiMode.checked){clearSelection();lastSelectedRef=null;update();}};
  let startY=null,dragged=false;
  $('mobileHandle').addEventListener('pointerdown',e=>{startY=e.clientY;dragged=false;e.currentTarget.setPointerCapture(e.pointerId);});
  $('mobileHandle').addEventListener('pointermove',e=>{if(startY!==null&&Math.abs(e.clientY-startY)>24){expanded=e.clientY<startY;dragged=true;update();}});
  $('mobileHandle').addEventListener('pointerup',()=>{startY=null;});
  $('mobileHandle').addEventListener('pointercancel',()=>{startY=null;});
  $('mobileHandle').addEventListener('click',e=>{if(dragged){e.stopImmediatePropagation();dragged=false;}},true);
  document.addEventListener('pota:overlap',e=>{
    if(!enabled)return;
    e.preventDefault();map.closePopup();choices.replaceChildren();
    for(const ref of e.detail.refs){
      const p=pota.find(park=>park.reference===ref);if(!p)continue;
      const button=document.createElement('button');button.type='button';button.dataset.reference=ref;button.textContent=ref+' – '+p.name;
      button.onclick=()=>showLink(p,true,false,e.detail.latlng);choices.appendChild(button);
    }
    openView('overlap');
  });
  document.addEventListener('pota:geometry',e=>{geometryResults.set(e.detail.reference,e.detail.available);update();});
  document.addEventListener('pota:park',e=>{current=e.detail;if(enabled)openView('park',false);else update();});
  document.addEventListener('pota:selection',update);
  $('multiMode').addEventListener('change',update);
  new MutationObserver(()=>{
    if(!enabled)return;
    const text=$('status').textContent;
    // Keep search failures and loading errors visible even with a collapsed sheet.
    const geometryFailure=/^Kunne ikke hente en verifisert enkeltgeometri/.test(text);
    const show=!geometryFailure&&/^(Fant ikke|POTA-listen kunne ikke|Oppstartsfeil|Kunne ikke hente)/.test(text);
    $('mobileNotice').hidden=!show;$('mobileNotice').textContent=show?text:'';
    update();
  }).observe($('status'),{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();openView('park',false);}});
  map.on('popupopen',()=>{if(enabled)map.closePopup();});
  mq.addEventListener('change',activate);activate();
})();
