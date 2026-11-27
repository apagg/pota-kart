// POTA Kart 0.12.2 bootstrap loader
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
    await load('diagnostics.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('geojson-utils.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('geometry-topology.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('geometry-atlas.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('map-setup.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('map-layers.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('gps-controller.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('polygon-layer-utils.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('pota-activation.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('park-info-ui.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('app-text-utils.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('norway-park-registry.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('sweden-park-registry.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('geometry-format-utils.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('sweden-heritage-registry.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('app-core.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('park-diagnostics.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('park-selection-state.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('pota-park-loader.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('park-selection-controller.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('pota-startup.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('mobile-ui.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('desktop-ui.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
    await load('park-activations.js?v=c72c75108d470cd289be9ba75f96c9f6abd37178');
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
