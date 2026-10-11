// Extracted from app-core.js; preserve original functions and behavior.
function stripOuter(s){s=s.trim();return s.startsWith('(')&&s.endsWith(')')?s.slice(1,-1).trim():s}
function splitTop(s){let out=[],depth=0,start=0;for(let i=0;i<s.length;i++){const c=s[i];if(c==='(')depth++;else if(c===')')depth--;else if(c===','&&depth===0){out.push(s.slice(start,i).trim());start=i+1}}out.push(s.slice(start).trim());return out.filter(Boolean)}
function swerefToWgs84(east,north){
  const axis=6378137.0, flattening=1/298.257222101, cm=15*Math.PI/180, scale=0.9996, fe=500000.0;
  const e2=flattening*(2-flattening), n=flattening/(2-flattening), ar=axis/(1+n)*(1+n*n/4+Math.pow(n,4)/64);
  const beta=[n/2-2*n*n/3+37*Math.pow(n,3)/96-Math.pow(n,4)/360,n*n/48+Math.pow(n,3)/15-437*Math.pow(n,4)/1440,17*Math.pow(n,3)/480-37*Math.pow(n,4)/840,4397*Math.pow(n,4)/161280];
  const A=e2+e2*e2+Math.pow(e2,3)+Math.pow(e2,4),B=-(7*e2*e2+17*Math.pow(e2,3)+30*Math.pow(e2,4))/6,C=(224*Math.pow(e2,3)+889*Math.pow(e2,4))/120,D=-(4279*Math.pow(e2,4))/1260;
  const xi=north/(scale*ar), eta=(east-fe)/(scale*ar);let xp=xi,ep=eta;
  for(let j=1;j<=4;j++){const b=beta[j-1];xp-=b*Math.sin(2*j*xi)*Math.cosh(2*j*eta);ep-=b*Math.cos(2*j*xi)*Math.sinh(2*j*eta)}
  const ps=Math.asin(Math.sin(xp)/Math.cosh(ep)), dl=Math.atan2(Math.sinh(ep),Math.cos(xp)), sp=Math.sin(ps);
  const lat=ps+sp*Math.cos(ps)*(A+B*sp*sp+C*Math.pow(sp,4)+D*Math.pow(sp,6)), lon=cm+dl;
  return [lon*180/Math.PI,lat*180/Math.PI];
}
function coordPair(t){const a=t.trim().split(/\s+/).map(Number);if(a.length<2||!Number.isFinite(a[0])||!Number.isFinite(a[1]))throw Error('Ugyldig koordinat i WKT');let x=a[0],y=a[1];return (Math.abs(x)>180||Math.abs(y)>90)?swerefToWgs84(x,y):[x,y]}
function ring(s){return splitTop(stripOuter(s)).map(coordPair)}
function parseWkt(wkt){
  let s=wkt.trim().replace(/^SRID=\d+;/i,'');const m=s.match(/^\s*(MULTIPOLYGON|POLYGON)\s*(.*)$/i);if(!m)return null;const type=m[1].toUpperCase(),body=stripOuter(m[2]);
  if(type==='POLYGON')return {type:'Polygon',coordinates:splitTop(body).map(ring)};
  return {type:'MultiPolygon',coordinates:splitTop(body).map(poly=>splitTop(stripOuter(poly)).map(ring))};
}
function parseGeometryResponse(txt){
  const t=txt.trim();
  if(!t)return null;
  if(t[0]==='{'||t[0]==='['){try{const d=JSON.parse(t);if(d.type==='Feature')return d.geometry;if(d.type&&d.coordinates)return d;const g=d.geometry||d.geometri||d.wkt||d.WKT;if(typeof g==='string')return parseWkt(g);if(g&&g.type)return g}catch(e){}}
  const q=t.startsWith('"')?(()=>{try{return JSON.parse(t)}catch(e){return t}})():t;
  return parseWkt(String(q));
}
function geometryLabel(g){const t=(g&&g.type)||'';if(t==='Point'||t==='MultiPoint')return 'punkt';if(t==='LineString'||t==='MultiLineString')return 'linje';if(t==='Polygon'||t==='MultiPolygon')return 'område';return t||'ukjent';}

function transformGeo(g){
  // REST kan returnere WGS84 direkte eller registerets native SWEREF 99 TM.
  function rec(x){if(Array.isArray(x)&&x.length>=2&&typeof x[0]==='number'&&typeof x[1]==='number'){return (Math.abs(x[0])>180||Math.abs(x[1])>90)?swerefToWgs84(x[0],x[1]):[x[0],x[1]]}return Array.isArray(x)?x.map(rec):x}
  return {type:g.type,coordinates:rec(g.coordinates)};
}
