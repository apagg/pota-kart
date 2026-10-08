// GeoJSON normalization shared by map, GPS, and geometry helpers.
// Keep this file independent of Leaflet and Turf.
function featuresOfGeoJson(gj){
  if(!gj)return [];
  if(gj.type==='FeatureCollection')return gj.features||[];
  if(gj.type==='Feature')return [gj];
  return [{type:'Feature',properties:{},geometry:gj}];
}
