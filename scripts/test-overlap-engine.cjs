const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..'),turf=require(process.env.POTA_TURF_MODULE||'@turf/turf'),polygonClipping=require(process.env.POTA_CLIPPING_MODULE||'polygon-clipping');
const context={turf,polygonClipping,performance,setTimeout};vm.createContext(context);
for(const file of ['geometry-topology.js','overlap-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const engine=vm.runInContext('new AtlasOverlapEngine()',context),plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 const outer=[[0,0],[10,0],[10,10],[0,10],[0,0]],hole=[[2,2],[4,2],[4,4],[2,4],[2,2]],island=[[20,0],[22,0],[22,2],[20,2],[20,0]];
 const geometry={type:'Polygon',coordinates:[hole,island,outer]};engine.ingest([{key:'A@overview',ref:'A',geometry},{key:'B@overview',ref:'B',geometry},{key:'H@overview',ref:'H',geometry:{type:'Polygon',coordinates:[hole]}}]);
 const job={id:1,viewKey:'fixture',keys:['A@overview','B@overview','H@overview'],bounds:[-1,-1,23,11]};const first=await engine.compute(job);
 assert.equal(first.results.length,1);const coords=first.results[0].geometry.coordinates;assert.equal(coords.length,2);assert.equal(coords.reduce((n,p)=>n+p.length-1,0),1);
 const second=await engine.compute({...job,id:2,bounds:[-2,-2,24,12]});assert.equal(second.stats.intersections,0);assert(second.stats.cacheHits>0);assert.equal(second.results[0].version,first.results[0].version);assert.deepEqual(plain(second.results[0].geometry),plain(first.results[0].geometry));
 const stale=await engine.compute({...job,id:3},()=>false);assert.equal(stale,null);
 // Geometry detail has its own cache key; zooming out reuses overview results.
 engine.ingest([{key:'A@detail',ref:'A',geometry:{type:'Polygon',coordinates:[island]}}]);const detail=await engine.compute({...job,id:4,keys:['A@detail','B@overview']});assert.equal(detail.results[0].geometry.coordinates.length,1);
 const overview=await engine.compute({...job,id:5});assert.equal(overview.stats.intersections,0);assert.equal(overview.results[0].geometry.coordinates.length,2);
 // Pair areas must be partitioned, otherwise a triple intersection has no unique color.
 const square=(w,s,e,n)=>({type:'Polygon',coordinates:[[[w,s],[e,s],[e,n],[w,n],[w,s]]]});
 const triple=vm.runInContext('new AtlasOverlapEngine()',context);
 triple.ingest([{key:'A',ref:'A',geometry:square(0,0,4,4)},{key:'B',ref:'B',geometry:square(2,0,6,4)},{key:'C',ref:'C',geometry:square(1,2,5,6)}]);
 const tripleJob={id:1,viewKey:'triple',keys:['A','B','C'],bounds:[-1,-1,7,7]},zones=await triple.compute(tripleJob);
 assert.equal(zones.results.length,4);
 const at=(x,y)=>plain(zones.results.filter(r=>turf.booleanPointInPolygon(turf.point([x,y]),r.geometry)).map(r=>[...r.refs].sort().join(',')));
 assert.deepEqual(at(3,3),['A,B,C']);assert.deepEqual(at(2.5,1),['A,B']);assert.deepEqual(at(1.5,3),['A,C']);assert.deepEqual(at(4.5,3),['B,C']);
 for(let i=0;i<zones.results.length;i++)for(let j=i+1;j<zones.results.length;j++)assert.equal(polygonClipping.intersection(zones.results[i].geometry.coordinates,zones.results[j].geometry.coordinates).length,0,'Rendered zones must not overlap');
 const expectedUnion=polygonClipping.union(...[polygonClipping.intersection([square(0,0,4,4).coordinates],[square(2,0,6,4).coordinates]),polygonClipping.intersection([square(0,0,4,4).coordinates],[square(1,2,5,6).coordinates]),polygonClipping.intersection([square(2,0,6,4).coordinates],[square(1,2,5,6).coordinates])]);
 const actualUnion=polygonClipping.union(...zones.results.map(r=>r.geometry.coordinates));
 assert.equal(polygonClipping.difference(expectedUnion,actualUnion).length,0);assert.equal(polygonClipping.difference(actualUnion,expectedUnion).length,0,'Partition preserves the exact overlap area');
 const reused=await triple.compute({...tripleJob,id:2});assert.equal(reused.stats.intersections,0);assert.equal(reused.results,zones.results,'Unchanged overlap zones are cached');
 const onlyAB=await triple.compute({...tripleJob,id:3,visibleRefs:['A','B']});
 assert.equal(onlyAB.results.filter(r=>r.refs.every(ref=>['A','B'].includes(ref))).length,1,'Only visible parks need color partitioning');
 assert(onlyAB.results.some(r=>r.refs.includes('C')),'Hidden pair geometry remains available');
 const identical=vm.runInContext('new AtlasOverlapEngine()',context);
 identical.ingest(['A','B','C','D'].map(ref=>({key:ref,ref,geometry:square(0,0,4,4)})));
 const four=await identical.compute({id:1,viewKey:'four',keys:['D','B','A','C'],bounds:[-1,-1,5,5]});
 assert.equal(four.results.length,1);assert.deepEqual([...four.results[0].refs],['A','B','C','D']);
 const holeCase=vm.runInContext('new AtlasOverlapEngine()',context),holed=square(0,0,4,4);holed.coordinates.push(square(1,1,2,2).coordinates[0]);
 holeCase.ingest([{key:'A',ref:'A',geometry:holed},...['B','C'].map(ref=>({key:ref,ref,geometry:square(0,0,4,4)}))]);
 const holeZones=await holeCase.compute({id:1,viewKey:'hole-zones',keys:['A','B','C'],bounds:[-1,-1,5,5]});
 assert.equal(holeZones.results.length,2);
 assert.deepEqual(plain(holeZones.results.filter(r=>turf.booleanPointInPolygon(turf.point([1.5,1.5]),r.geometry)).map(r=>r.refs)),[['B','C']],'A hole must not contribute a color');
 // Numerical fallback may round display-zone inputs; it must preserve ordinary topology.
 const difference=polygonClipping.difference;let attempted=0;
 try{
  polygonClipping.difference=(...args)=>{if(attempted++===0)throw Error('Simulated precision failure');return difference(...args)};
  const resilient=vm.runInContext('new AtlasOverlapEngine()',context);
  resilient.ingest([{key:'A',ref:'A',geometry:square(0,0,4,4)},{key:'B',ref:'B',geometry:square(2,0,6,4)},{key:'C',ref:'C',geometry:square(1,2,5,6)}]);
  const retried=await resilient.compute(tripleJob);assert.equal(retried.results.length,4);assert(attempted>1);
  assert.deepEqual(plain(retried.results.filter(r=>turf.booleanPointInPolygon(turf.point([3,3]),r.geometry)).map(r=>r.refs)),[['A','B','C']]);
 }finally{polygonClipping.difference=difference}
 const dir=process.env.POTA_GEOMETRY_DIR||path.join(root,'data/geometries'),index=JSON.parse(fs.readFileSync(path.join(dir,'SE-index.json')));
 const record=JSON.parse(fs.readFileSync(path.join(dir,index.parks['SE-2071'].shard)))['SE-2071'];const parts=context.atlasGeometryPolygons(record.geometry);assert.equal(parts.length,11);assert(parts.every(p=>p.length===1));
 const real=vm.runInContext('new AtlasOverlapEngine()',context);real.ingest([{key:'SE-2071@detail',ref:'SE-2071',geometry:record.geometry},{key:'copy@detail',ref:'copy',geometry:record.geometry}]);
 const bb=index.parks['SE-2071'].bbox;const full={id:1,viewKey:'ramsvik',keys:['SE-2071@detail','copy@detail'],bounds:[bb[0]-.01,bb[1]-.01,bb[2]+.01,bb[3]+.01]};
 const r=await real.compute(full),area=turf.area(r.results[0].geometry)/10000;assert(area>840&&area<860);
 const cached=await real.compute({...full,id:2});assert.equal(cached.stats.intersections,0);assert.equal(cached.stats.cacheHits,1);
 console.log('PASS overlap worker engine: separate areas, holes, cache reuse, detail/overview, stale jobs, SE-2071, exact triple/four-way zones and partition cache');
})().catch(e=>{console.error(e);process.exit(1)});
