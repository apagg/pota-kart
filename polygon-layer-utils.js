// Polygon-only layer conversion helpers. No trail behavior is changed.
function rawPolygonClippingInputFromLayer(layer){
  if(!layer||!layer.toGeoJSON)return [];
  const gj=layer.toGeoJSON(), polys=[];
  function addGeometry(g){
    if(!g)return;
    if(g.type==='Polygon'){polys.push(g.coordinates);return}
    if(g.type==='MultiPolygon'){for(const p of g.coordinates||[])polys.push(p);return}
    if(g.type==='GeometryCollection')for(const part of g.geometries||[])addGeometry(part);
  }
  function add(x){
    if(!x)return;
    if(x.type==='FeatureCollection'){for(const f of x.features||[])add(f);return}
    if(x.type==='Feature'){addGeometry(x.geometry);return}
    addGeometry(x);
  }
  add(gj);return polys;
}
function topologicalPolygonsFromLayer(layer){
  const encoded=rawPolygonClippingInputFromLayer(layer), polygons=[];
  let sourceRings=0;
  for(const coords of encoded){
    sourceRings+=coords.length;
    const rebuilt=reconstructPolygonRings(coords);
    for(const p of rebuilt)polygons.push(p);
  }
  return {encoded,polygons,sourceRings};
}
function rawLayerGeometryInfo(layer){
  const topo=topologicalPolygonsFromLayer(layer);
  let rings=0,holes=0,areaM2=0;
  for(const coords of topo.polygons){
    rings+=coords.length;
    holes+=Math.max(0,coords.length-1);
    if(typeof turf!=='undefined'){
      try{areaM2+=turf.area({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:coords}})||0}catch(e){}
    }
  }
  return {polygons:topo.polygons,rings,holes,areaHa:areaM2/10000,encodedPolygons:topo.encoded.length,sourceRings:topo.sourceRings};
}
function polygonFeaturesFromLayer(layer){
  const r=rawLayerGeometryInfo(layer);
  return r.polygons.map(coords=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:coords}}));
}
