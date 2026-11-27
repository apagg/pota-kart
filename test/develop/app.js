// POTA Kart 0.12.6 bootstrap loader
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
    await load('diagnostics.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('geojson-utils.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('geometry-topology.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('map-colors.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('geometry-atlas.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('map-setup.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('map-layers.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('gps-controller.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('polygon-layer-utils.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('pota-activation.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('park-info-ui.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('app-text-utils.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('norway-park-registry.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('sweden-park-registry.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('geometry-format-utils.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('sweden-heritage-registry.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('app-core.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('park-diagnostics.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('park-selection-state.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('pota-park-loader.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('park-selection-controller.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('pota-startup.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('mobile-ui.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('desktop-ui.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
    await load('park-activations.js?v=5cf27599c5ee2d581cb14b452af3213e494489b1');
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
