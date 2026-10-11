// Desktop presentation only. The mobile module keeps its original DOM order.
(()=>{
  const mq=matchMedia('(min-width:701px)'),panel=document.getElementById('infoPanel');
  const searchRow=document.getElementById('q').closest('.row');
  const original=[linkbox,selectedBox].map(node=>{const anchor=document.createComment('original UI position');node.before(anchor);return {node,anchor}});
  const choices=document.createElement('section');choices.className='desktop-overlap';choices.id='desktopOverlapChoices';choices.hidden=true;
  let current=null,pending=false;
  function entries(){
    if(multiMode.checked)return [...selectedParks.values()];
    if(lastSelectedRef&&(selectedMarker||selectedGeo)){
      const p=pota.find(p=>p.reference===lastSelectedRef);if(p)return [{p,link:linkTable[p.reference]||inferLink(p)}];
    }
    return [];
  }
  function render(){
    if(!mq.matches)return;
    const parks=entries();selectedList.replaceChildren();selectedBox.style.display=parks.length?'block':'none';
    selectedBox.querySelector('.head b').textContent=`Valgte parker (${parks.length})`;
    for(const x of parks){
      const row=document.createElement('div');row.className='selitem';
      const open=document.createElement('button');open.type='button';open.className='selected-park-open';open.dataset.reference=x.p.reference;
      open.textContent=`${x.p.reference} – ${x.p.name}`;open.setAttribute('aria-current',String(current?.p.reference===x.p.reference));
      open.onclick=()=>{lastSelectedRef=x.p.reference;openParkInfo(x.p,x.link);render();};
      const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label','Fjern '+x.p.reference);
      remove.onclick=()=>{if(multiMode.checked)removeSelectedPark(x.p.reference);else{clearSelection();lastSelectedRef=null;linkbox.style.display='none';}queueMicrotask(render);};
      row.append(open,remove);selectedList.appendChild(row);
    }
    if(current&&lastSelectedRef===current.p.reference)pending=false;
    if(!pending&&current&&!parks.some(x=>x.p.reference===current.p.reference)){
      const next=parks.find(x=>x.p.reference===lastSelectedRef)||parks.at(-1);
      if(next)openParkInfo(next.p,next.link);else{current=null;linkbox.style.display='none';}
    }
  }
  function activate(){
    document.body.classList.toggle('desktop-layout',mq.matches);
    document.body.classList.remove('panel-hidden');
    if(mq.matches){
      searchRow.after(linkbox,choices,selectedBox);
      if(current)openParkInfo(current.p,current.link);
      render();
    }else{
      for(const {node,anchor} of original)anchor.after(node);
      choices.remove();choices.hidden=true;
      selectedBox.querySelector('.head b').textContent='Valgte POTA-parker';
      renderSelectedList();
      if(current)openParkInfo(current.p,current.link);
    }
    map.invalidateSize({pan:false});
  }
  document.addEventListener('pota:park',e=>{
    current=e.detail;pending=true;choices.hidden=true;
    if(mq.matches){panel.classList.remove('hidden');showPanel.classList.remove('visible');document.body.classList.remove('panel-hidden');map.invalidateSize({pan:false});queueMicrotask(render);}
  });
  document.addEventListener('pota:selection',()=>queueMicrotask(render));
  multiMode.addEventListener('change',()=>{if(mq.matches&&current)openParkInfo(current.p,current.link);queueMicrotask(render);});
  document.getElementById('clearSelected').addEventListener('click',()=>{
    if(!mq.matches)return;
    if(!multiMode.checked){clearSelection();lastSelectedRef=null;}
    current=null;pending=false;choices.hidden=true;linkbox.style.display='none';render();
  });
  document.addEventListener('pota:overlap',e=>{
    if(!mq.matches)return;
    e.preventDefault();map.closePopup();choices.replaceChildren();
    const title=document.createElement('b');title.textContent='Velg POTA-park';choices.appendChild(title);
    for(const ref of e.detail.refs){
      const p=pota.find(p=>p.reference===ref);if(!p)continue;
      const button=document.createElement('button');button.type='button';button.dataset.reference=ref;button.textContent=`${ref} – ${p.name}`;
      button.onclick=()=>showLink(p,true,false,e.detail.latlng);choices.appendChild(button);
    }
    choices.hidden=false;panel.classList.remove('hidden');showPanel.classList.remove('visible');document.body.classList.remove('panel-hidden');map.invalidateSize({pan:false});
  });
  mq.addEventListener('change',activate);activate();
})();
