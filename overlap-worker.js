importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js','https://cdn.jsdelivr.net/npm/polygon-clipping@0.15.7/dist/polygon-clipping.umd.min.js','geometry-topology.js?v=011-11','overlap-engine.js?v=011-11');
const engine=new AtlasOverlapEngine();let pending=null,latest=0,running=false;
onmessage=e=>{engine.ingest(e.data.entries);pending=e.data;latest=pending.id;if(!running)drain()};
async function drain(){
 running=true;
 while(pending){const job=pending;pending=null;
  try{const result=await engine.compute(job,()=>job.id===latest);if(result)postMessage(result)}
  catch(e){if(job.id===latest)postMessage({id:job.id,error:e.message})}
 }
 running=false;
}
