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
    await load('diagnostics.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('geojson-utils.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('geometry-topology.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('geometry-atlas.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('map-setup.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('map-layers.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('gps-controller.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('polygon-layer-utils.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('pota-activation.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('park-info-ui.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('app-text-utils.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('norway-park-registry.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('sweden-park-registry.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('geometry-format-utils.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('sweden-heritage-registry.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('app-core.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('park-diagnostics.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('park-selection-state.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('pota-park-loader.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('park-selection-controller.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('pota-startup.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('mobile-ui.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('desktop-ui.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
    await load('park-activations.js?v=809ed67f3766a8b9c852620bf72d3e855d8b847c');
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
