// Cached POTA activation statistics; extracted without behavior changes.
const potaActivationCache=new Map();
function getPotaActivationCount(ref){
  const cached=potaActivationCache.get(ref);
  if(cached&&cached.expires>Date.now())return cached.promise;
  const entry={expires:Date.now()+300000,promise:null};
  entry.promise=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(`https://api.pota.app/park/stats/${encodeURIComponent(ref)}`,{signal:controller.signal});
      if(!response.ok)throw Error('POTA-statistikk kunne ikke hentes');
      const stats=await response.json(),raw=stats.activations;
      const count=(typeof raw==='number'||(typeof raw==='string'&&raw.trim()!==''))?Number(raw):NaN;
      if((stats.reference&&stats.reference!==ref)||!Number.isSafeInteger(count)||count<0)throw Error('Ugyldig aktiveringstall');
      return count;
    }catch(e){entry.expires=Date.now()+60000;return null}
    finally{clearTimeout(timer)}
  })();
  potaActivationCache.set(ref,entry);return entry.promise;
}
