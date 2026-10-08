// Shared, bounded diagnostics. Avoid silently losing actionable failures.
const potaDiagnostics=(()=>{
  const recent=[];
  const limit=50;
  function report(area,error,level='warn'){
    const message=error instanceof Error?error.message:String(error);
    const entry={area:String(area),message,level,time:new Date().toISOString()};
    recent.push(entry);
    if(recent.length>limit)recent.shift();
    const log=level==='error'?console.error:console.warn;
    log.call(console,'POTA '+entry.area+': '+entry.message);
    return entry;
  }
  return Object.freeze({report,recent:()=>recent.slice()});
})();
