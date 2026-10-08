// POTA Kart 0.11.0 bootstrap loader
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
    await load('diagnostics.js?v=011-release');
    await load('geojson-utils.js?v=011-release');
    await load('geometry-topology.js?v=011-release');
    await load('geometry-atlas.js?v=011-release');
    await load('map-setup.js?v=011-release');
    await load('map-layers.js?v=011-release');
    await load('gps-controller.js?v=011-release');
    await load('polygon-layer-utils.js?v=011-release');
    await load('pota-activation.js?v=011-release');
    await load('park-info-ui.js?v=011-release');
    await load('app-text-utils.js?v=011-release');
    await load('norway-park-registry.js?v=011-release');
    await load('sweden-park-registry.js?v=011-release');
    await load('geometry-format-utils.js?v=011-release');
    await load('sweden-heritage-registry.js?v=011-release');
    await load('app-core.js?v=011-release');
    await load('mobile-ui.js?v=011-release');
    await load('park-diagnostics.js?v=011-release');
    await load('park-selection-state.js?v=011-release');
    await load('pota-park-loader.js?v=011-release');
    await load('park-selection-controller.js?v=011-release');
    await load('pota-startup.js?v=011-release');
  }catch(e){
    const el=document.getElementById('status');
    if(el)el.textContent='Oppstartsfeil: '+e.message;
    if(typeof potaDiagnostics!=='undefined')potaDiagnostics.report('startup',e,'error');
    else console.error(e);
  }
})();
