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
    await load('diagnostics.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('geojson-utils.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('geometry-topology.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('geometry-atlas.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('map-setup.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('map-layers.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('gps-controller.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('polygon-layer-utils.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('pota-activation.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('park-info-ui.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('app-text-utils.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('norway-park-registry.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('sweden-park-registry.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('geometry-format-utils.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('sweden-heritage-registry.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('app-core.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('park-diagnostics.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('park-selection-state.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('pota-park-loader.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('park-selection-controller.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('pota-startup.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('mobile-ui.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('desktop-ui.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
    await load('park-activations.js?v=3dc3c895fe482d3ffbd60c79731d908acfbf54db');
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
