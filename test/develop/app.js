// POTA Kart 0.12.0 bootstrap loader
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
    await load('diagnostics.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('geojson-utils.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('geometry-topology.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('geometry-atlas.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('map-setup.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('map-layers.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('gps-controller.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('polygon-layer-utils.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('pota-activation.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('park-info-ui.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('app-text-utils.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('norway-park-registry.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('sweden-park-registry.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('geometry-format-utils.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('sweden-heritage-registry.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('app-core.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('park-diagnostics.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('park-selection-state.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('pota-park-loader.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('park-selection-controller.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('pota-startup.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('mobile-ui.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('desktop-ui.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
    await load('park-activations.js?v=ad6503b3b1695320c0a310c37d102234acd945bb');
  }catch(e){
    const el=document.getElementById('status');
    if(el)el.textContent='Oppstartsfeil: '+e.message;
    const error=document.getElementById('startupError');
    if(error){error.textContent='Oppstartsfeil: '+e.message;error.hidden=false;}
    if(typeof potaDiagnostics!=='undefined')potaDiagnostics.report('startup',e,'error');
    else console.error(e);
  }finally{
    // Enable the static responsive UI after its interaction handlers are ready.
    document.documentElement.classList.remove('ui-loading');
  }
})();
