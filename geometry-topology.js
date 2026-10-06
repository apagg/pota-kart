const TRAIL_CORRIDOR_WIDTH_M=61;
const TRAIL_BUFFER_M=TRAIL_CORRIDOR_WIDTH_M/2;
function ringFeature(ring){
  return {type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}};
}
function ringAbsArea(ring){
  if(typeof turf==='undefined')return 0;
  try{return Math.abs(turf.area(ringFeature(ring))||0)}catch(e){return 0}
}
function ringProbePoint(ring){
  // Use a vertex from the ring for containment tests against *other* rings.
  // ignoreBoundary=true prevents touching rings from being treated as contained.
  const c=ring&&ring[0];
  return c&&c.length>=2?{type:'Feature',properties:{},geometry:{type:'Point',coordinates:[c[0],c[1]]}}:null;
}
function reconstructPolygonRings(coords){
  // Some source geometries encode several exterior rings inside one Polygon.
  // Reconstruct topology by containment depth instead of assuming ring 0 is
  // the only exterior and every later ring is a hole.
  const rings=(coords||[]).filter(r=>Array.isArray(r)&&r.length>=4);
  if(!rings.length)return [];
  const nodes=rings.map((ring,i)=>({i,ring,area:ringAbsArea(ring),parent:-1,depth:0,children:[]}));
  for(const n of nodes){
    const probe=ringProbePoint(n.ring); if(!probe)continue;
    let best=-1,bestArea=Infinity;
    for(const c of nodes){
      if(c.i===n.i || c.area<=n.area)continue;
      try{
        if(turf.booleanPointInPolygon(probe,ringFeature(c.ring),{ignoreBoundary:true}) && c.area<bestArea){best=c.i;bestArea=c.area}
      }catch(e){}
    }
    n.parent=best;
  }
  function depthOf(n,seen=new Set()){
    if(n.parent<0)return 0;
    if(seen.has(n.i))return 0;
    seen.add(n.i);return 1+depthOf(nodes[n.parent],seen);
  }
  for(const n of nodes)n.depth=depthOf(n);
  for(const n of nodes)if(n.parent>=0)nodes[n.parent].children.push(n.i);
  const polygons=[];
  for(const n of nodes){
    if(n.depth%2!==0)continue; // holes are attached to their immediate exterior parent
    const holes=n.children.map(i=>nodes[i]).filter(ch=>ch.depth===n.depth+1 && ch.depth%2===1).map(ch=>ch.ring);
    polygons.push([n.ring,...holes]);
  }
  return polygons;
}

function atlasGeometryPolygons(geometry){
 const polygons=[];
 function walk(g){
  if(!g)return;
  if(g.type==='Feature')walk(g.geometry);
  else if(g.type==='FeatureCollection')for(const f of g.features||[])walk(f);
  else if(g.type==='GeometryCollection')for(const child of g.geometries||[])walk(child);
  else if(g.type==='Polygon')polygons.push(...reconstructPolygonRings(g.coordinates));
  else if(g.type==='MultiPolygon')for(const coordinates of g.coordinates)polygons.push(...reconstructPolygonRings(coordinates));
  else if(g.type==='LineString'||g.type==='MultiLineString'){
   const lines=g.type==='LineString'?[g.coordinates]:g.coordinates;
   for(const coordinates of lines){const f=turf.buffer({type:'Feature',properties:{},geometry:{type:'LineString',coordinates}},TRAIL_BUFFER_M/1000,{units:'kilometers',steps:12});
    if(f?.geometry?.type==='Polygon')polygons.push(f.geometry.coordinates);
    else if(f?.geometry?.type==='MultiPolygon')polygons.push(...f.geometry.coordinates);
   }
  }
 }
 walk(geometry);return polygons;
}
