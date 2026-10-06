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
 const dir=process.env.POTA_GEOMETRY_DIR||path.join(root,'data/geometries'),index=JSON.parse(fs.readFileSync(path.join(dir,'SE-index.json')));
 const record=JSON.parse(fs.readFileSync(path.join(dir,index.parks['SE-2071'].shard)))['SE-2071'];const parts=context.atlasGeometryPolygons(record.geometry);assert.equal(parts.length,11);assert(parts.every(p=>p.length===1));
 const real=vm.runInContext('new AtlasOverlapEngine()',context);real.ingest([{key:'SE-2071@detail',ref:'SE-2071',geometry:record.geometry},{key:'copy@detail',ref:'copy',geometry:record.geometry}]);
 const bb=index.parks['SE-2071'].bbox;const full={id:1,viewKey:'ramsvik',keys:['SE-2071@detail','copy@detail'],bounds:[bb[0]-.01,bb[1]-.01,bb[2]+.01,bb[3]+.01]};
 const r=await real.compute(full),area=turf.area(r.results[0].geometry)/10000;assert(area>840&&area<860);
 const cached=await real.compute({...full,id:2});assert.equal(cached.stats.intersections,0);assert.equal(cached.stats.cacheHits,1);
 console.log('PASS overlap worker engine: separate areas, holes, cache reuse, detail/overview, stale jobs and SE-2071');
})().catch(e=>{console.error(e);process.exit(1)});
