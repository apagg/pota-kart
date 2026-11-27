// Validated catalog counts seed the map; fresh park statistics take precedence.
const potaCatalogActivationCounts=new Map(),potaLiveActivationCounts=new Map();
function parsePotaActivationCount(raw){
 const n=(typeof raw==='number'||(typeof raw==='string'&&raw.trim()!==''))?Number(raw):NaN;
 return Number.isSafeInteger(n)&&n>=0?n:null;
}
function seedPotaActivationCounts(parks){
 potaCatalogActivationCounts.clear();
 for(const p of parks){const n=parsePotaActivationCount(p.activations);if(n!==null)potaCatalogActivationCounts.set(p.reference,n)}
}
function knownPotaActivationCount(ref){
 return potaLiveActivationCounts.has(ref)?potaLiveActivationCounts.get(ref):potaCatalogActivationCounts.get(ref)??null;
}
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
      const stats=await response.json(),count=parsePotaActivationCount(stats?.activations);
      if((stats?.reference&&stats.reference!==ref)||count===null)throw Error('Ugyldig aktiveringstall');
      potaLiveActivationCounts.set(ref,count);
      document.dispatchEvent(new CustomEvent('pota:activation-count',{detail:{reference:ref,count}}));
      return count;
    }catch(e){entry.expires=Date.now()+60000;return null}
    finally{clearTimeout(timer)}
  })();
  potaActivationCache.set(ref,entry);return entry.promise;
}
