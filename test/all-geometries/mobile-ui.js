// POTA Kart 0.10.0: responsive navigation around the existing map/resolvers.
(()=>{
  const mq=matchMedia('(max-width:700px)'), $=id=>document.getElementById(id);
  const panel=$('infoPanel'), content=document.createElement('div');content.className='panel-content';
  while(panel.firstChild)content.appendChild(panel.firstChild);panel.appendChild(content);
  const icons={search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',layers:'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',locate:'<path d="m21 3-6 18-4-8-8-4 18-6Z"/>',map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5ZM9 3v16M15 5v16"/>',settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z"/>',chevron:'<path d="m6 14 6-6 6 6"/>'};
  const svg=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const root=document.createElement('div');root.className='mobile-chrome';root.innerHTML=`
    <div class="mobile-brand">POTA Kart <span>${esc(content.querySelector('.version')?.textContent||'0.11.0 test')}</span></div>
    <div class="mobile-toolbar" aria-label="Kartverktøy">
      <button id="mobileSearch" aria-label="Søk etter park" aria-expanded="false">${svg('search')}</button>
      <button id="mobileLayers" aria-label="Velg karttype">${svg('layers')}</button>
      <button id="mobileLocate" aria-label="Min posisjon">${svg('locate')}</button>
    </div>
    <div id="mobileSearchPopover" class="mobile-search-popover" hidden><button id="mobileSearchClose" aria-label="Lukk søk">×</button></div>
    <div id="mobileNotice" class="mobile-notice" role="status" hidden></div>
    <nav class="mobile-nav" aria-label="Hovedmeny">
      <button id="mobileMapTab" aria-pressed="true">${svg('map')}<span>Kart</span></button>
      <button id="mobileSelectedTab" aria-pressed="false">${svg('layers')}<span>Valgte parker <b id="mobileCount">0</b></span></button>
      <button id="mobileSettingsTab" aria-pressed="false">${svg('settings')}<span>Innstillinger</span></button>
    </nav>`;document.body.appendChild(root);
  const header=document.createElement('div');header.className='mobile-sheet-header';header.innerHTML=`
    <button id="mobileHandle" class="mobile-handle" aria-label="Utvid parkboksen" aria-expanded="false"><span></span></button>
    <button id="mobileSheetClose" class="mobile-sheet-close" aria-label="Lukk panelet">×</button>
    <div id="mobileParkRef" class="mobile-park-ref"></div>
    <h2 id="mobileParkTitle">Velg en POTA-park</h2>
    <div id="mobileParkType" class="mobile-park-type">Trykk på et område, en sti eller et punkt</div>
    <div id="mobileParkSummary" class="mobile-park-summary" hidden>
      <div class="mobile-activations">Aktiveringer: <span id="mobileActivationCount" aria-live="polite">Henter …</span></div>
      <a id="mobilePotaLink" target="_blank" rel="noopener noreferrer">pota.app ↗</a>
      <div class="mobile-sheet-actions"><button id="mobileSelectionToggle" hidden></button></div>
    </div>`;panel.prepend(header);
  const geometryResults=new Map(),geometryNote=document.createElement('p');geometryNote.id='mobileGeometryNote';geometryNote.className='mobile-geometry-note';geometryNote.dataset.mobileSection='details';geometryNote.textContent='Geometri mangler – parken vises som punkt';geometryNote.hidden=true;content.prepend(geometryNote);
  const choices=document.createElement('div');choices.id='mobileOverlapChoices';choices.className='mobile-overlap-list';choices.dataset.mobileSection='overlap';choices.hidden=true;content.appendChild(choices);
  const single=document.createElement('div');single.id='mobileSingleSelection';single.dataset.mobileSection='selected';content.appendChild(single);
  const empty=document.createElement('p');empty.id='mobileEmptySelection';empty.textContent='Ingen parker er valgt. Trykk på et POTA-punkt eller bruk søket.';empty.dataset.mobileSection='selected';content.appendChild(empty);
  const searchRow=$('q').closest('.row'), anchor=document.createComment('desktop search');searchRow.before(anchor);
  const mark=(node,section)=>{if(node)node.dataset.mobileSection=section;};
  mark($('countryFilter').closest('.row'),'settings');mark($('baseMapSelect').closest('.row'),'settings');mark($('multiMode').closest('.selectbar'),'settings');
  mark($('geometrySummary'),'settings');mark($('gpsStatus'),'settings');mark($('status'),'');mark($('linkbox'),'');mark($('selectedBox'),'selected');mark(content.querySelector('.info-more'),'details selected');
  mark(content.querySelector('.mapkey'),'settings');
  let current=null,view='park',expanded=false,enabled=false;
  function syncActivationCount(){
    const text=$('linkbox').querySelector('[data-pota-activation-count]')?.textContent||'Henter …';
    if($('mobileActivationCount').textContent!==text)$('mobileActivationCount').textContent=text;
  }
  new MutationObserver(syncActivationCount).observe($('linkbox'),{childList:true,subtree:true,characterData:true});
  function closeSearch(){ $('mobileSearchPopover').hidden=true;$('mobileSearch').setAttribute('aria-expanded','false'); }
  function update(){
    const entries=[...selectedParks.values()];
    const singleSelected=!multiMode.checked&&current&&lastSelectedRef===current.p.reference;
    const count=entries.length+(singleSelected?1:0);$('mobileCount').textContent=count;
    single.replaceChildren();
    if(singleSelected){const row=document.createElement('div');row.className='selitem';const label=document.createElement('span');label.textContent=current.p.reference+' – '+current.p.name;const remove=document.createElement('button');remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label','Fjern '+current.p.reference);remove.onclick=()=>{clearSelection();lastSelectedRef=null;update();};row.append(label,remove);single.appendChild(row);}
    empty.hidden=count>0;
    const isPark=view==='park';
    $('mobileParkRef').textContent=isPark&&current?current.p.reference:'';
    $('mobileParkTitle').textContent=isPark?(current?current.p.name:'Velg en POTA-park'):view==='overlap'?'Velg POTA-park':view==='selected'?'Valgte parker':'Innstillinger';
    $('mobileParkType').textContent=isPark?'Trykk på et område, en sti eller et punkt':view==='overlap'?'Flere parker her – trykk på parken du ønsker':view==='selected'?`${count} park${count===1?'':'er'} i utvalget`:'Land, kart og flervalg';
    $('mobileParkType').hidden=!!(isPark&&current);
    $('mobileParkSummary').hidden=!isPark||!current;
    if(current)$('mobilePotaLink').href='https://pota.app/#/park/'+encodeURIComponent(current.p.reference);
    syncActivationCount();
    const selected=current&&(selectedParks.has(current.p.reference)||(!multiMode.checked&&lastSelectedRef===current.p.reference));
    $('mobileSelectionToggle').hidden=!isPark||!current;
    $('mobileSelectionToggle').textContent=selected?'✓ Valgt · Fjern':'＋ Legg til';
    $('mobileSelectionToggle').setAttribute('aria-pressed',String(!!selected));
    panel.dataset.mobileView=view;panel.classList.toggle('sheet-expanded',expanded);
    $('mobileHandle').setAttribute('aria-expanded',String(expanded));
    $('mobileHandle').setAttribute('aria-label',expanded?'Minimer parkboksen':'Utvid parkboksen');
    for(const [id,active] of [['mobileMapTab',isPark||view==='overlap'],['mobileSelectedTab',view==='selected'],['mobileSettingsTab',view==='settings']])$(id).setAttribute('aria-pressed',String(active));
    if(enabled)for(const child of content.children){const visible=expanded&&(child.dataset.mobileSection||'').split(' ').includes(isPark?'details':view);child.hidden=!visible;}
    geometryNote.hidden=!(enabled&&isPark&&expanded&&current&&geometryResults.get(current.p.reference)===false);
    empty.hidden=!enabled||view!=='selected'||count>0;
    if(enabled&&expanded&&(view==='selected'||view==='park')){content.querySelector('.info-more').open=true;}
  }
  function openView(next,full=true){view=next;expanded=full;closeSearch();panel.classList.remove('hidden');update();content.scrollTop=0;}
  function activate(){
    enabled=mq.matches;document.body.classList.toggle('mobile-layout',enabled);
    if(enabled){$('mobileSearchPopover').appendChild(searchRow);panel.classList.remove('hidden');$('showPanel').classList.remove('visible');update();}
    else{anchor.after(searchRow);for(const child of content.children)child.hidden=false;empty.hidden=true;single.hidden=true;choices.hidden=true;if(view==='overlap'){view='park';expanded=false;}closeSearch();panel.classList.remove('hidden');}
    map.invalidateSize({pan:false});
  }
  $('mobileSearch').onclick=()=>{const open=$('mobileSearchPopover').hidden;$('mobileSearchPopover').hidden=!open;$('mobileSearch').setAttribute('aria-expanded',String(open));if(open)$('q').focus();};
  $('mobileSearchClose').onclick=closeSearch;
  $('mobileLayers').onclick=()=>{openView('settings');$('baseMapSelect').focus();};
  $('mobileLocate').onclick=()=>{$('locateBtn').click();};
  function syncMobileGps(){
    const active=$('locateBtn').getAttribute('aria-pressed')==='true',button=$('mobileLocate');
    button.dataset.gpsState=$('locateBtn').dataset.gpsState;
    button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',$('locateBtn').textContent);
    button.title=$('locateBtn').title;button.disabled=false;
  }
  document.addEventListener('pota:gps',syncMobileGps);syncMobileGps();
  $('mobileMapTab').onclick=()=>openView('park',false);
  $('mobileSelectedTab').onclick=()=>openView('selected');
  $('mobileSettingsTab').onclick=()=>openView('settings');
  $('mobileSheetClose').onclick=()=>openView('park',false);
  $('mobileHandle').onclick=()=>{expanded=!expanded;update();};
  $('mobileSelectionToggle').onclick=async()=>{
    if(!current)return;
    if(selectedParks.has(current.p.reference))removeSelectedPark(current.p.reference);
    else if(!multiMode.checked&&lastSelectedRef===current.p.reference){clearSelection();lastSelectedRef=null;}
    else await showLink(current.p,false,false);
    update();
  };
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
