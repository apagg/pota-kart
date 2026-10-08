// Shared by the browser worker and the regression/performance tests.
class AtlasOverlapEngine{
 constructor(){this.records=new Map();this.pairs=new Map();this.pairPoints=0;this.regions=new Map();this.regionPoints=0;this.shapes=new Map();this.version=0;this.stats={normalizations:0,intersections:0,cacheHits:0,viewClips:0,regionClips:0,runs:0}}
 ingest(entries){for(const entry of entries||[])if(!this.records.has(entry.key))this.records.set(entry.key,{...entry,polygons:null})}
 polygons(record){
  if(record.polygons===null){record.polygons=atlasGeometryPolygons(record.geometry);record.geometry=null;this.stats.normalizations++;
   if(record.polygons.length){const pts=record.polygons.flat(2);record.box=[Infinity,Infinity,-Infinity,-Infinity];for(const p of pts){record.box[0]=Math.min(record.box[0],p[0]);record.box[1]=Math.min(record.box[1],p[1]);record.box[2]=Math.max(record.box[2],p[0]);record.box[3]=Math.max(record.box[3],p[1])}}
  }
  return record.polygons;
 }
 pair(a,b){
  const key=[a.key,b.key].sort().join('|')+'|'+(a.scope||b.scope||'full');let cached=this.pairs.get(key);
  if(cached){this.stats.cacheHits++;this.pairs.delete(key);this.pairs.set(key,cached);return [key,cached]}
  this.stats.intersections++;const coordinates=polygonClipping.intersection(a.polygons,b.polygons);
  let points=0,box=[Infinity,Infinity,-Infinity,-Infinity];for(const polygon of coordinates)for(const ring of polygon)for(const p of ring){points++;box[0]=Math.min(box[0],p[0]);box[1]=Math.min(box[1],p[1]);box[2]=Math.max(box[2],p[0]);box[3]=Math.max(box[3],p[1])}
  cached={coordinates,box,points};this.pairs.set(key,cached);this.pairPoints+=points;
  // Bound result storage on mobile as well as the number of cached empty pairs.
  while(this.pairs.size>4096||this.pairPoints>250000){const oldest=this.pairs.keys().next().value;this.pairPoints-=this.pairs.get(oldest).points;this.pairs.delete(oldest)}
  return [key,cached];
 }
 workspace(bounds){
  const [w,s,e,n]=bounds,x=2**Math.floor(Math.log2(Math.max(1e-8,e-w)/4)),y=2**Math.floor(Math.log2(Math.max(1e-8,n-s)/4));
  const box=[Math.floor(w/x)*x-x/2,Math.floor(s/y)*y-y/2,Math.ceil(e/x)*x+x/2,Math.ceil(n/y)*y+y/2];
  return {key:box.join(','),box,polygon:[[[box[0],box[1]],[box[2],box[1]],[box[2],box[3]],[box[0],box[3]],[box[0],box[1]]]]};
 }
 region(record,work){
  const b=record.box,v=work.box;if(b[0]>=v[0]&&b[1]>=v[1]&&b[2]<=v[2]&&b[3]<=v[3])return record;
  const key=record.key+'|'+work.key;let region=this.regions.get(key);
  if(region){this.regions.delete(key);this.regions.set(key,region);return region}
  this.stats.regionClips++;const polygons=polygonClipping.intersection(record.polygons,work.polygon);let points=0,box=[Infinity,Infinity,-Infinity,-Infinity];
  for(const p of polygons)for(const ring of p)for(const c of ring){points++;box[0]=Math.min(box[0],c[0]);box[1]=Math.min(box[1],c[1]);box[2]=Math.max(box[2],c[0]);box[3]=Math.max(box[3],c[1])}
  region={key:record.key,ref:record.ref,polygons,box,scope:work.key,points};this.regions.set(key,region);this.regionPoints+=points;
  while(this.regions.size>512||this.regionPoints>250000){const oldest=this.regions.keys().next().value;this.regionPoints-=this.regions.get(oldest).points;this.regions.delete(oldest)}
  return region;
 }
 async compute(job,isCurrent=()=>true){
  const start=performance.now(),before={...this.stats};this.stats.runs++;let slice=start;
  const work=this.workspace(job.bounds),[w,s,e,n]=job.bounds,view=[[[w,s],[e,s],[e,n],[w,n],[w,s]]],candidates=[];
  const pause=async()=>{if(performance.now()-slice>10){await new Promise(r=>setTimeout(r,0));slice=performance.now()}return isCurrent()};
  for(const key of job.keys){const record=this.records.get(key);if(!record)throw Error('Missing worker geometry: '+key);
   if(this.polygons(record).length){const region=this.region(record,work);if(region.polygons.length)candidates.push(region)}if(!await pause())return null;
  }
  candidates.sort((a,b)=>a.box[0]-b.box[0]);const results=[],shapes=new Map();
  for(let i=0;i<candidates.length;i++){
   const a=candidates[i];for(let j=i+1;j<candidates.length&&candidates[j].box[0]<=a.box[2];j++){
    const b=candidates[j];if(Math.max(a.box[0],b.box[0],w)>Math.min(a.box[2],b.box[2],e)||Math.max(a.box[1],b.box[1],s)>Math.min(a.box[3],b.box[3],n))continue;
    const [key,pair]=this.pair(a,b);let coordinates=pair.coordinates;
    if(coordinates.length){const bb=pair.box;
     if(bb[0]>e||bb[2]<w||bb[1]>n||bb[3]<s)continue;
     if(bb[0]<w||bb[1]<s||bb[2]>e||bb[3]>n){this.stats.viewClips++;coordinates=polygonClipping.intersection(coordinates,view)}
     if(coordinates.length){const serialized=JSON.stringify(coordinates),old=this.shapes.get(key),version=old?.serialized===serialized?old.version:++this.version;shapes.set(key,{serialized,version});results.push({key,version,refs:[a.ref,b.ref],geometry:{type:'MultiPolygon',coordinates}})}
    }
    if(!await pause())return null;
   }
  }
  if(!isCurrent())return null;this.shapes=shapes;
  const stats={};for(const key of Object.keys(before))stats[key]=this.stats[key]-before[key];
  return {id:job.id,viewKey:job.viewKey,results,stats,elapsedMs:performance.now()-start};
 }
}
