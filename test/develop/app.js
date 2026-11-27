// POTA Kart 0.12.3 bootstrap loader
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
    await load('diagnostics.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('geojson-utils.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('geometry-topology.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('geometry-atlas.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('map-setup.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('map-layers.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('gps-controller.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('polygon-layer-utils.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('pota-activation.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('park-info-ui.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('app-text-utils.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('norway-park-registry.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('sweden-park-registry.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('geometry-format-utils.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('sweden-heritage-registry.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('app-core.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('park-diagnostics.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('park-selection-state.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('pota-park-loader.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('park-selection-controller.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('pota-startup.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('mobile-ui.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('desktop-ui.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
    await load('park-activations.js?v=a5f3d3affef803446d92fc460530abdac31f664f');
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
