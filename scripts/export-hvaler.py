#!/usr/bin/env python3
"""Export only Hvaler additions from the backed-up GeoPackage (EPSG:25832)."""
import json, sqlite3, struct
from pathlib import Path
from shapely import wkb
from shapely.ops import transform, unary_union
from pyproj import Transformer

ROOT=Path(__file__).resolve().parents[1]
src=ROOT/'Hvaler-redigering.gpkg'
out=ROOT/'data/hvaler/hvaler-tillegg.geojson'
db=sqlite3.connect(src)
row=db.execute("SELECT column_name,srs_id FROM gpkg_geometry_columns WHERE table_name='hvaler_tillegg'").fetchone()
if not row or row[1]!=25832: raise RuntimeError('Unexpected layer/CRS')
col=row[0]
convert=Transformer.from_crs(25832,4326,always_xy=True).transform
lines=[]
seen=set()
for (blob,) in db.execute('SELECT "'+col+'" FROM hvaler_tillegg'):
    if not blob: continue
    if blob[:2]!=b'GP': raise RuntimeError('Not GeoPackage geometry')
    flags=blob[3]
    envelope=(flags>>1)&7
    offsets={0:0,1:32,2:48,3:48,4:64}
    if envelope not in offsets: raise RuntimeError('Invalid envelope')
    geom=wkb.loads(blob[8+offsets[envelope]:])
    if geom.is_empty: continue
    parts=[geom] if geom.geom_type=='LineString' else list(geom.geoms) if geom.geom_type=='MultiLineString' else []
    for line in parts:
        if len(line.coords)<2 or line.length==0: continue
        key=line.normalize().wkb_hex
        if key in seen: continue
        seen.add(key)
        lines.append(transform(convert,line))
if not lines: raise RuntimeError('No usable Hvaler trails')
out.parent.mkdir(parents=True,exist_ok=True)
fc={'type':'FeatureCollection','features':[{'type':'Feature','properties':{'source':'hvaler_tillegg'},'geometry':g.__geo_interface__} for g in lines]}
out.write_text(json.dumps(fc,ensure_ascii=False,separators=(',',':'))+'\n')
print('Exported',len(lines),'unique Hvaler lines to',out)
