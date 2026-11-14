// POTA Kart 0.12.1 bootstrap loader
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
    await load('diagnostics.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('geojson-utils.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('geometry-topology.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('geometry-atlas.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('map-setup.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('map-layers.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('gps-controller.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('polygon-layer-utils.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('pota-activation.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('park-info-ui.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('app-text-utils.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('norway-park-registry.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('sweden-park-registry.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('geometry-format-utils.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('sweden-heritage-registry.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('app-core.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('park-diagnostics.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('park-selection-state.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('pota-park-loader.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('park-selection-controller.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('pota-startup.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('mobile-ui.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('desktop-ui.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    await load('park-activations.js?v=3ca8beeeb07f10e425d8a5cc5eaf396c9e4d40f6');
    initializeStartupPosition();
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
