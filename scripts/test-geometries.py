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
 def test_confirmed_nationalparks(self):
  poly={'type':'Polygon','coordinates':[[[10,58],[12,58],[12,60],[10,60],[10,58]]]}
  park={'type':'Feature','properties':{'NVRID':'2014914','NAMN':'Kosterhavets nationalpark','SKYDDSTYP':'Nationalpark'},'geometry':poly}
  p={'reference':'SE-0016','name':'Kosterhavet National Park','latitude':58.8803,'longitude':11.0329}
  self.assertEqual(g.se_match(p,{'id:2014914':[park]})['id'],'2014914')
  wrong=dict(park,properties={'NVRID':'2001110','NAMN':'Tyresta','SKYDDSTYP':'Naturreservat'})
  right=dict(park,properties={'NVRID':'2001214','NAMN':'Tyresta','SKYDDSTYP':'Nationalpark'})
  p=dict(p,reference='SE-0021',name='Tyresta National Park')
  self.assertEqual(g.se_match(p,{'id:2001214':[right],'name:tyresta':[right,wrong]})['id'],'2001214')
  with self.assertRaises(ValueError):g.se_match(p,{'id:2001110':[wrong],'name:tyresta':[wrong]})
 def test_confirmed_reserves_ignore_name_conflicts(self):
  poly={'type':'Polygon','coordinates':[[[11,57],[12,57],[12,58],[11,58],[11,57]]]}
  right={'type':'Feature','properties':{'NVRID':'2000791','NAMN':'Tofta','SKYDDSTYP':'Naturreservat'},'geometry':poly}
  wrong=dict(right,properties={'NVRID':'2048337','NAMN':'Tofta','SKYDDSTYP':'Landskapsbildsskyddsområde'})
  p={'reference':'SE-0468','name':'Tofta Nature Reserve','latitude':57.8556,'longitude':11.697}
  self.assertEqual(g.se_match(p,{'id:2000791':[right],'name:tofta':[wrong,right]})['id'],'2000791')
  with self.assertRaises(ValueError):g.se_match(p,{'name:tofta':[wrong],'id:2048337':[wrong]})
 def test_confirmed_county_parts_and_alternative_name(self):
  poly={'type':'Polygon','coordinates':[[[10,55],[17,55],[17,61],[10,61],[10,55]]]}
  for ref,name,sid,official in [('SE-1319','Fyledalen','2043731','Naturreservatet Fyledalen'),('SE-1783','Ridö-Sundbyholmsarkipelagen','2001300','Ridö-Sundbyholmsarkipelagen'),('SE-2032','Hökensås','2001952','Hökensås'),('SE-2033','Hökensås','2002586','Hökensås')]:
   with self.subTest(ref=ref):
    f={'type':'Feature','properties':{'NVRID':sid,'NAMN':official},'geometry':poly}
    p={'reference':ref,'name':name+' Nature Reserve','latitude':58,'longitude':14}
    self.assertEqual(g.se_match(p,{'id:'+sid:[f]})['id'],sid)
    with self.assertRaises(ValueError):g.se_match(p,{'name:'+g.norm(name):[f]})
 def test_catalogue_requests_confirmed_ids(self):
  from unittest.mock import patch
  with patch.object(g,'request',return_value={'features':[]}) as request:
   g.se_catalog('national',[{'name':'Kosterhavet National Park'}])
   filters=''.join(call.args[1]['filter'] for call in request.call_args_list)
   for ref in ['SE-0006','SE-0011','SE-0016','SE-0021','SE-0026','SE-0028','SE-0030']:
    self.assertIn('<fes:Literal>'+g.SE_CONFIRMED_IDS[ref]+'</fes:Literal>',filters)
 def test_holes_and_parts(self):
  ring=[[10,59],[11,59],[11,60],[10,60],[10,59]];hole=[[10.2,59.2],[10.3,59.2],[10.3,59.3],[10.2,59.2]]
  p={'type':'Polygon','coordinates':[ring,hole]};r=g.merge([{'geometry':p},{'geometry':p}])
  self.assertEqual(r['type'],'MultiPolygon');self.assertEqual(len(r['coordinates']),2);self.assertEqual(r['coordinates'][0][1],hole)
 def test_multisegment_trail(self):
  a=[[10,59],[10.01,59.01]];b=[[10.02,59.02],[10.03,59.03]]
  r=g.merge([{'geometry':{'type':'LineString','coordinates':a}},{'geometry':{'type':'MultiLineString','coordinates':[b]}}])
  self.assertEqual(r,{'type':'MultiLineString','coordinates':[a,b]})
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
