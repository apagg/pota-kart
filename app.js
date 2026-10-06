// POTA Kart 0.10.0 bootstrap loader
(async()=>{
  const load=src=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.onload=resolve;
    s.onerror=()=>reject(new Error('Kunne ikke laste '+src));
    document.head.appendChild(s);
  });
  try{
    await load('pota-cache-bootstrap.js');
    await load('geometry-atlas.js?v=011-5');
    await load('app-core.js?v=011-5');
    await load('mobile-ui.js?v=011-4');
  }catch(e){
    const el=document.getElementById('status');
    if(el)el.textContent='Oppstartsfeil: '+e.message;
    console.error(e);
  }
})();
