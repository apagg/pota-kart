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
 // Partition pair intersections into disjoint zones labelled with every covering park.
 // Cached geometry is independent of palette, activation status and GPS colors.
 async partition(results,candidates,pause){
  if(results.length<2)return results;
  const signature=results.map(x=>x.key+'@'+x.version).join(';');
  if(this.zoneCache?.signature===signature)return this.zoneCache.results;
  const bounds=coordinates=>{const box=[Infinity,Infinity,-Infinity,-Infinity];for(const p of coordinates)for(const r of p)for(const c of r){box[0]=Math.min(box[0],c[0]);box[1]=Math.min(box[1],c[1]);box[2]=Math.max(box[2],c[0]);box[3]=Math.max(box[3],c[1])}return box};
  // Only display zones are rounded on a failed boolean operation; source/GPS geometry is untouched.
  const rounded=(coordinates,digits)=>coordinates.map(p=>p.map(r=>{
   const out=[];for(const c of r){const q=c.map(n=>Number(n.toFixed(digits))),last=out[out.length-1];if(!last||last[0]!==q[0]||last[1]!==q[1])out.push(q)}
   if(out.length&&(out[0][0]!==out[out.length-1][0]||out[0][1]!==out[out.length-1][1]))out.push(out[0]);return out;
  })).filter(p=>p[0]?.length>=4).map(p=>p.filter(r=>r.length>=4));
  const clip=(op,...coordinates)=>{
   try{return polygonClipping[op](...coordinates)}catch(error){
    for(const digits of [8,6])try{return polygonClipping[op](...coordinates.map(c=>rounded(c,digits)))}catch(e){}
    throw error;
   }
  };
  const zone=(refs,coordinates)=>({refs,coordinates,box:bounds(coordinates)}),groups=new Map();
  for(const result of results){
   let parts=[zone([...result.refs].sort(),result.geometry.coordinates)];
   const box=parts[0].box;
   // Split each pair only by nearby other parks, rather than comparing all zones.
   for(const park of candidates){
    if(park.box[0]>box[2])break;
    if(result.refs.includes(park.ref)||park.box[2]<box[0]||park.box[1]>box[3]||park.box[3]<box[1])continue;
    // Crop long/multipart park geometry to this pair before further splitting.
    const margin=1e-7,[w,s,e,n]=box;
    const crop=[[[[w-margin,s-margin],[e+margin,s-margin],[e+margin,n+margin],[w-margin,n+margin],[w-margin,s-margin]]]];
    const polygons=park.box[0]>=w&&park.box[1]>=s&&park.box[2]<=e&&park.box[3]<=n?park.polygons:clip('intersection',park.polygons,crop);
    if(!polygons.length)continue;
    const next=[];
    for(const part of parts){
     const a=part.box,b=park.box;
     if(a[0]>b[2]||a[2]<b[0]||a[1]>b[3]||a[3]<b[1])next.push(part);
     else{
      const common=clip('intersection',part.coordinates,polygons);
      if(!common.length)next.push(part);
      else{
       const rest=clip('difference',part.coordinates,polygons);
       if(rest.length)next.push(zone(part.refs,rest));
       next.push(zone([...new Set([...part.refs,park.ref])].sort(),common));
      }
     }
     if(!await pause())return null;
    }
    parts=next;
   }
   for(const part of parts){
    const key='zone|'+part.refs.join('|');if(!groups.has(key))groups.set(key,{refs:part.refs,parts:[],seen:new Set()});
    const group=groups.get(key),serialized=JSON.stringify(part.coordinates);
    if(!group.seen.has(serialized)){group.seen.add(serialized);group.parts.push(part.coordinates)}
   }
   if(!await pause())return null;
  }
  const rendered=[],shapes=new Map();
  for(const [key,g] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
   const coordinates=g.parts.length===1?g.parts[0]:clip('union',...g.parts);
   const serialized=JSON.stringify(coordinates),old=this.zoneShapes?.get(key),version=old?.serialized===serialized?old.version:++this.version;
   shapes.set(key,{serialized,version});rendered.push({key,version,refs:g.refs,geometry:{type:'MultiPolygon',coordinates}});
   if(!await pause())return null;
  }
  this.zoneShapes=shapes;this.zoneCache={signature,results:rendered};return rendered;
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
  const visible=job.visibleRefs?new Set(job.visibleRefs):null;
  const colorPairs=visible?results.filter(r=>r.refs.every(ref=>visible.has(ref))):results;
  const hiddenPairs=visible?results.filter(r=>!r.refs.every(ref=>visible.has(ref))):[];
  const zones=await this.partition(colorPairs,visible?candidates.filter(r=>visible.has(r.ref)):candidates,pause);
  if(!zones||!isCurrent())return null;
  const rendered=hiddenPairs.length?[...hiddenPairs,...zones]:zones;
  const stats={};for(const key of Object.keys(before))stats[key]=this.stats[key]-before[key];
  return {id:job.id,viewKey:job.viewKey,results:rendered,stats,elapsedMs:performance.now()-start};
 }
}
