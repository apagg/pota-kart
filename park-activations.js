// Public POTA profiles seed positives; complete per-park history checks the current view.
// No credentials. Cache contains only callsigns, park references and successful activators.
const parkActivations=(()=>{
 const KEY='pota-activated-parks-v1',TTL=15*60*1000,RETRY=60*1000,LIMIT=40,painted=new WeakMap();
 const normalize=s=>typeof s==='string'?s.trim().toUpperCase():'';
 const validCall=s=>/^[A-Z0-9]+(?:\/[A-Z0-9]+)*$/.test(s)&&s.length<=30&&/[A-Z]/.test(s)&&/\d/.test(s);
 const validRef=s=>typeof s==='string'&&/^[A-Z]{2,3}-\d{4,}$/.test(s);
 let calls=[],profiles={},parks={},errors=new Map(),epoch=0,queue=[],desired=new Set(),busy=false,profileBusy=false,timer=null,paintPending=false,storageFailed=false;
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||'null');
  if(x?.version===1){
   calls=Array.isArray(x.calls)?[...new Set(x.calls.map(normalize).filter(validCall))].slice(0,10):[];
   for(const [call,p] of Object.entries(x.profiles||{}))if(validCall(call)&&p&&Array.isArray(p.aliases)&&Array.isArray(p.refs)&&Number.isFinite(p.at))profiles[call]={at:p.at,aliases:p.aliases.map(normalize).filter(validCall),refs:p.refs.filter(validRef)};
   for(const [ref,p] of Object.entries(x.parks||{}))if(validRef(ref)&&p&&Array.isArray(p.calls)&&Number.isFinite(p.at))parks[ref]={at:p.at,calls:p.calls.map(normalize).filter(validCall)};
  }
 }catch(e){}
 function save(){
  const entries=Object.entries(parks).sort((a,b)=>b[1].at-a[1].at).slice(0,500);
  parks=Object.fromEntries(entries);
  try{localStorage.setItem(KEY,JSON.stringify({version:1,calls,profiles,parks}));storageFailed=false;}catch(e){storageFailed=true;}
 }
 function aliases(call){return new Set([call,...(profiles[call]?.aliases||[])]);}
 function rootsFor(ref){
  return calls.filter(call=>{
   const history=parks[ref],names=aliases(call),matched=history?.calls.some(x=>names.has(x));
   if(history&&Date.now()-history.at<TTL)return !!matched;
   return !!matched||!!profiles[call]?.refs.includes(ref);
  });
 }
 function has(ref){return rootsFor(ref).length>0;}
 function fresh(ref){return parks[ref]&&Date.now()-parks[ref].at<TTL;}
 function statusText(ref){
  if(!calls.length)return '';
  const roots=rootsFor(ref),cached=parks[ref];
  if(roots.length)return 'Aktivert av '+roots.join(', ')+(errors.has(ref)?' · Oppdatering feilet; lagret resultat vises.':'');
  if(fresh(ref))return 'Ingen registrert aktivering for dine kallesignaler.';
  if(errors.has(ref))return cached?'Kunne ikke oppdatere. Tidligere parkhistorikk er lagret.':'Kunne ikke hente aktiveringshistorikk. Prøver igjen senere.';
  return 'Aktiveringshistorikken sjekkes …';
 }
 function render(){
  const list=document.getElementById('activationCalls');if(!list)return;
  list.replaceChildren();
  for(const call of calls){
   const item=document.createElement('span');item.className='activation-call';
   const label=document.createElement('span');label.textContent=call;
   const button=document.createElement('button');button.type='button';button.textContent='×';button.setAttribute('aria-label','Fjern kallesignal '+call);
   button.onclick=()=>setCalls(calls.filter(x=>x!==call));item.append(label,button);list.appendChild(item);
  }
  const status=document.getElementById('activationStatus');
  const positives=new Set(calls.flatMap(c=>profiles[c]?.refs||[]));
  for(const ref of Object.keys(parks))if(has(ref))positives.add(ref);
  const visible=[...desired],checked=visible.filter(fresh).length;
  let text=!calls.length?'Legg inn hovedkallesignalet ditt. Tilknyttede kallesignaler tas med automatisk.':
   `${[...positives].filter(has).length} aktiverte parker funnet · ${checked}/${visible.length} parkhistorikker i køområdet sjekket.`;
  if(profileBusy)text+=' Henter profiler …';
  else if(calls.length&&map.getZoom()<10)text+=' Zoom inn for automatisk historikksjekk. Valgte parker sjekkes også.';
  else if(calls.length)text+=' Inntil 40 nærliggende parker sjekkes om gangen; flytt kartet for flere.';
  if(errors.size)text+=' Noen POTA-data kunne ikke hentes. Lagrede funn beholdes; prøver igjen automatisk.';
  if(storageFailed)text+=' Nettleseren kunne ikke lagre listen; den beholdes bare mens siden er åpen.';
  status.textContent=text;
  document.getElementById('activationRefresh').disabled=!calls.length||profileBusy;
  for(const el of document.querySelectorAll('[data-personal-activation]')){
   el.hidden=!calls.length;el.textContent=statusText(el.dataset.personalActivation);
  }
 }
 function markerPaint(marker,ref,selected=false){
  if(!marker)return;
  const color=gpsParkColor(ref,selected);
  if(marker.setStyle){const style={color,fillColor:color};if(marker.options.color!==style.color||marker.options.fillColor!==style.fillColor)marker.setStyle(style);}
  else if(marker.getElement){const el=marker.getElement()?.querySelector('.trail-pota-icon');if(el)el.style.color=color;}
 }
 function paint(){
  if(paintPending)return;paintPending=true;
  requestAnimationFrame(()=>{
   paintPending=false;
   for(const [ref,layer] of geometryAtlas.layers){const color=gpsParkColor(ref,selectedParks.has(ref)||lastSelectedRef===ref);if(painted.get(layer)!==color){layer.setStyle({color,fillColor:color});painted.set(layer,color);}}
   paintGpsSelected();
   for(const x of potaMarkers)markerPaint(x.marker,x.reference);
   for(const [ref,x] of selectedParks)markerPaint(x.marker,ref,true);
   if(!multiMode.checked&&lastSelectedRef)markerPaint(selectedMarker,lastSelectedRef,true);
   render();
  });
 }
 async function fetchJson(path){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch('https://api.pota.app/'+path,{signal:controller.signal,credentials:'omit'});if(!r.ok)throw Error('POTA svarte '+r.status);return await r.json();}
  finally{clearTimeout(timeout);}
 }
 function parseProfile(data,call){
  if(!data||normalize(data.callsign)!==call||(data.other_callsigns!=null&&!Array.isArray(data.other_callsigns))||!Array.isArray(data.recent_activity?.activations))throw Error('Ingen gyldig POTA-profil for '+call);
  const refs=new Set(profiles[call]?.refs||[]);
  for(const row of data.recent_activity.activations){
   if(!validRef(row.reference)||row.total==null||row.total===''||!Number.isSafeInteger(Number(row.total))||Number(row.total)<0)throw Error('Ugyldig profilhistorikk');
   if(Number(row.total)>=10)refs.add(row.reference);
  }
  return {at:Date.now(),aliases:(data.other_callsigns||[]).map(normalize).filter(validCall),refs:[...refs]};
 }
 function parseHistory(data){
  if(!Array.isArray(data))throw Error('Ugyldig parkhistorikk');
  const activated=new Set();
  for(const row of data){
   const call=normalize(row.activeCallsign),total=Number(row.totalQSOs);
   if(!validCall(call)||row.totalQSOs==null||row.totalQSOs===''||!Number.isSafeInteger(total)||total<0||!/^\d{8}$/.test(String(row.qso_date)))throw Error('Ugyldig parkaktivering');
   if(total>=10)activated.add(call);
  }
  return {at:Date.now(),calls:[...activated]};
 }
 async function refreshProfiles(force=false){
  const generation=++epoch;profileBusy=true;render();
  for(const call of [...calls]){
   if(!force&&!errors.has(call)&&profiles[call]&&Date.now()-profiles[call].at<TTL)continue;
   if(!force&&errors.has(call)&&Date.now()-errors.get(call)<RETRY)continue;
   try{const data=await fetchJson('profile/'+encodeURIComponent(call));if(generation!==epoch)return;profiles[call]=parseProfile(data,call);errors.delete(call);save();paint();}
   catch(e){if(generation!==epoch)return;errors.set(call,Date.now());}
  }
  if(generation!==epoch)return;profileBusy=false;paint();schedule();
 }
 function candidates(){
  if(!calls.length||!geometryAtlas.ready)return [];
  const refs=new Set([...(lastSelectedRef?[lastSelectedRef]:[]),...selectedParks.keys()]);
  if(map.getZoom()>=10){
   const bounds=map.getBounds(),center=map.getCenter(),near=[];
   for(const p of pota){
    if(!atlasInCountry(p.reference))continue;
    const bb=atlasMeta(p.reference)?.bbox;
    const visible=bb?bounds.intersects(L.latLngBounds([bb[1],bb[0]],[bb[3],bb[2]])):bounds.contains([+p.latitude,+p.longitude]);
    if(!visible)continue;
    const position=bb?L.latLng((bb[1]+bb[3])/2,(bb[0]+bb[2])/2):L.latLng(+p.latitude,+p.longitude);
    near.push([p.reference,center.distanceTo(position)]);
   }
   near.sort((a,b)=>a[1]-b[1]);for(const [ref] of near){refs.add(ref);if(refs.size>=LIMIT)break;}
  }
  return [...refs].filter(atlasInCountry).slice(0,LIMIT);
 }
 function schedule(){
  clearTimeout(timer);timer=setTimeout(()=>{
   desired=new Set(candidates());
   queue=[...desired].filter(ref=>!fresh(ref)&&(!errors.has(ref)||Date.now()-errors.get(ref)>=RETRY));
   render();drain();
  },400);
 }
 async function drain(){
  if(busy||profileBusy||!calls.length)return;busy=true;
  try{
   while(queue.length&&calls.length&&!profileBusy){
    const ref=queue.shift();if(!desired.has(ref)||fresh(ref))continue;
    try{parks[ref]=parseHistory(await fetchJson('park/activations/'+encodeURIComponent(ref)+'?count=all'));errors.delete(ref);save();paint();}
    catch(e){errors.set(ref,Date.now());render();}
    await new Promise(resolve=>setTimeout(resolve,1000));
   }
  }finally{busy=false;render();}
 }
 function setCalls(next){
  calls=[...new Set(next)];errors.clear();queue=[];
  for(const call of Object.keys(profiles))if(!calls.includes(call))delete profiles[call];
  save();paint();refreshProfiles();
 }
 function start(){
  const form=document.getElementById('activationForm'),input=document.getElementById('activationCallInput'),message=document.getElementById('activationInputError');
  form.addEventListener('submit',e=>{
   e.preventDefault();const next=input.value.split(/[\s,;]+/).map(normalize).filter(Boolean);
   message.textContent=next.length&&next.every(validCall)&&new Set([...calls,...next]).size<=10?'':'Skriv et gyldig hovedkallesignal. Du kan legge inn opptil 10.';
   if(message.textContent)return;input.value='';setCalls([...calls,...next]);
  });
  document.getElementById('activationRefresh').onclick=()=>{
   desired=new Set(candidates());
   for(const ref of desired)if(parks[ref])parks[ref].at=0;
   errors.clear();refreshProfiles(true);
  };
  document.addEventListener('pota:park',()=>{render();schedule();});
  document.addEventListener('pota:selection',()=>{paint();schedule();});
  document.addEventListener('pota:atlas',()=>{paint();schedule();});
  document.addEventListener('pota:gps',paint);
  document.addEventListener('pota:gps-colors',paint);
  map.on('moveend zoomend',schedule);countryFilter.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshProfiles();});
  setInterval(()=>{if(!document.hidden){refreshProfiles();schedule();}},TTL);
  // Failed requests get a bounded retry while the page is visible.
  setInterval(()=>{if(!document.hidden&&errors.size&&!profileBusy){refreshProfiles();schedule();}},RETRY);
  paint();refreshProfiles();
 }
 start();return {has,rootsFor,statusText,refresh:()=>refreshProfiles(true)};
})();
