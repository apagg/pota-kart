"""Check category filtering, scope and integrity of the coastal test snapshot."""
import importlib.util
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('coast', ROOT / 'scripts/import-oslofjorden-coast.py')
coast = importlib.util.module_from_spec(spec)
spec.loader.exec_module(coast)

fixture = b'''<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
<Style id="walk"><LineStyle><color>ffff0000</color></LineStyle></Style>
<Style id="bike"><LineStyle><color>ff00ff00</color></LineStyle></Style>
<Style id="ferry"><LineStyle><color>ff0000aa</color></LineStyle></Style>
<StyleMap id="mapped"><Pair><key>normal</key><styleUrl>#walk</styleUrl></Pair></StyleMap>
<Folder><name>sverige</name><Placemark><name>Outside</name></Placemark></Folder>
<Folder><name>turer_oestfold</name><Folder><name>Hvaler</name>
<Placemark><name>Walk</name><styleUrl>#mapped</styleUrl><LineString><coordinates>10,59,0 11,59,0</coordinates></LineString></Placemark>
<Placemark><name>Bike</name><styleUrl>#bike</styleUrl><LineString><coordinates>10,59 11,59</coordinates></LineString></Placemark>
<Placemark><name>Ferry</name><styleUrl>#ferry</styleUrl><LineString><coordinates>10,59 11,59</coordinates></LineString></Placemark>
<Placemark><name>Unknown</name><styleUrl>#missing</styleUrl><LineString><coordinates>10,59 11,59</coordinates></LineString></Placemark>
</Folder></Folder></Document></kml>'''
result = coast.convert(fixture, '2026-10-11', 'fixture')
assert len(result['features']) == 4
assert [f['properties']['includedInPota'] for f in result['features']] == [True, True, False, False]
assert result['features'][0]['properties']['folderPath'] == ['turer_oestfold', 'Hvaler']
for bad in (fixture.replace(b'10,59,0', b'nan,59,0'), fixture.replace(b'10,59,0', b'190,59,0'), fixture.replace(b'turer_oestfold', b'other')):
    try:
        coast.convert(bad)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid input must fail')

data = json.loads((ROOT / 'data/coastal/oslofjorden-ostfold-test.geojson').read_text())
assert data['metadata']['sourceSha256'] == 'cdfb490ce5a4b9b79de9d92b2d5402ccef9a8d9531c247ed80a69cce849775c6'
assert data['metadata']['sourceFeatureCount'] == len(data['features']) == 125
included = [f for f in data['features'] if f['properties']['includedInPota']]
assert len(included) == data['metadata']['includedFeatureCount'] == 122
assert sum(f['properties']['category'] == 'cycling-alternative' for f in included) == 13
assert sum(f['properties']['category'] != 'cycling-alternative' for f in included) == 109
hvaler = [f for f in data['features'] if 'Turer Hvaler kommune' in f['properties']['folderPath']]
assert len(hvaler) == 31 and sum(f['properties']['includedInPota'] for f in hvaler) == 31
for f in data['features']:
    p = f['properties']
    assert p['reference'] == 'NO-2542' and p['folderPath'][0] == 'turer_oestfold'
    assert p['includedInPota'] == (p['category'] in ('marked-walking-route', 'walking-suggestion', 'cycling-alternative'))
    lines = [f['geometry']['coordinates']] if f['geometry']['type'] == 'LineString' else f['geometry']['coordinates']
    for line in lines:
        assert len(line) >= 2
        assert all(len(c) == 2 and all(math.isfinite(v) for v in c) and -180 <= c[0] <= 180 and -90 <= c[1] <= 90 for c in line)
print('PASS coastal importer: scope, style maps, invalid input, 122 walking/cycling routes, 31 Hvaler routes')
