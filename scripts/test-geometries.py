import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('geo',Path(__file__).with_name('update-geometries.py'));g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
class GeometryTests(unittest.TestCase):
 def test_source_ids(self):
  self.assertEqual(g.source_id({'website':'https://faktaark.naturbase.no/?id=FK00022917'}),'FK00022917')
  self.assertEqual(g.source_id({'website':'https://example.com/?id=FK00022917'}),'')
 def test_exact_matches_only(self):
  poly={'type':'Polygon','coordinates':[[[10,59],[11,59],[11,60],[10,60],[10,59]]]}
  f={'type':'Feature','properties':{'NVRID':'1','NAMN':'Test'},'geometry':poly}
  p={'reference':'SE-1234','name':'Test Nature Reserve','latitude':59.5,'longitude':10.5}
  self.assertEqual(g.se_match(p,{'name:test':[f]})['id'],'1')
  with self.assertRaises(ValueError):g.se_match(p,{'name:test':[f,dict(f,properties={'NVRID':'2','NAMN':'Test'})]})
  with self.assertRaises(ValueError):g.se_match(dict(p,name='Testing Nature Reserve'),{'name:test':[f]})
  with self.assertRaises(ValueError):g.se_match(dict(p,longitude=20),{'name:test':[f]})
 def test_holes_and_parts(self):
  ring=[[10,59],[11,59],[11,60],[10,60],[10,59]];hole=[[10.2,59.2],[10.3,59.2],[10.3,59.3],[10.2,59.2]]
  p={'type':'Polygon','coordinates':[ring,hole]};r=g.merge([{'geometry':p},{'geometry':p}])
  self.assertEqual(r['type'],'MultiPolygon');self.assertEqual(len(r['coordinates']),2);self.assertEqual(r['coordinates'][0][1],hole)
 def test_invalid_coordinates(self):
  self.assertFalse(g.valid({'type':'Point','coordinates':[200,59]}))
  self.assertFalse(g.valid({'type':'Point','coordinates':[10,float('nan')]}))
 def test_dataset_integrity(self):
  for cc in ['NO','SE']:
   file=g.ROOT/'data/geometries'/f'{cc}-index.json'
   if not file.exists():continue
   d=json.loads(file.read_text());overview=json.loads(file.with_name(f'{cc}-overview.geojson').read_text());refs={x['properties']['reference'] for x in overview['features']}
   self.assertEqual(refs,set(d['parks']))
   shards={}
   for ref,meta in d['parks'].items():
    if meta['shard'] not in shards:shards[meta['shard']]=json.loads(file.with_name(meta['shard']).read_text())
    r=shards[meta['shard']][ref];self.assertTrue(g.valid(r['geometry']),ref);self.assertEqual(meta['bbox'],g.bounds(r['geometry']))
if __name__=='__main__':unittest.main()
