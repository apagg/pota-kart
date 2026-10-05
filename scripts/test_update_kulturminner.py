import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('refresh', Path(__file__).with_name('update-kulturminner.py'))
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)


def xml_feature(identifier='94448', link='94448'):
    return f'''<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"
        xmlns:app="{refresh.APP_NS}" xmlns:gml="{refresh.GML_NS}">
      <wfs:member><app:Lokalitet gml:id="locality.1">
        <app:kulturminneId>{identifier}</app:kulturminneId><app:navn>Test</app:navn>
        <app:linkKulturminnesøk>https://kulturminnesok.no/ra/lokalitet/{link}</app:linkKulturminnesøk>
        <app:område><gml:Polygon srsName="urn:ogc:def:crs:EPSG::4326">
          <gml:exterior><gml:LinearRing><gml:posList>59 11 59 12 60 12 59 11</gml:posList></gml:LinearRing></gml:exterior>
          <gml:interior><gml:LinearRing><gml:posList>59.2 11.4 59.3 11.5 59.4 11.6 59.2 11.4</gml:posList></gml:LinearRing></gml:interior>
        </gml:Polygon></app:område>
      </app:Lokalitet></wfs:member></wfs:FeatureCollection>'''


class RefreshTests(unittest.TestCase):
    def test_links(self):
        self.assertEqual(refresh.kulturminne_id('http://kulturminnesok.no/ra/lokalitet/226593'), '226593')
        self.assertEqual(refresh.kulturminne_id('https://www.kulturminnesok.no/kart/?zoom=16&id=94448'), '94448')
        self.assertIsNone(refresh.kulturminne_id('https://kulturminnesok.no.evil.test/?id=94448'))

    def test_wfs_preserves_holes_and_axis_order(self):
        parts, names, ids, count = refresh.parse_wfs_page(xml_feature(), '94448')
        self.assertEqual(count, 1)
        self.assertEqual(parts[0][0][0], [11, 59])
        self.assertEqual(len(parts[0]), 2)
        self.assertEqual(parts[0][1][0], [11.4, 59.2])
        self.assertEqual(names, ['Test'])

    def test_subnumber_needs_parent_link(self):
        self.assertEqual(refresh.parse_wfs_page(xml_feature('94448-1'), '94448')[3], 1)
        for identifier, link in [('94449', '94448'), ('94448-1', '94449')]:
            with self.assertRaises(ValueError):
                refresh.parse_wfs_page(xml_feature(identifier, link), '94448')

    def test_invalid_geometry_rejected(self):
        feature = {'type': 'Feature', 'id': '94448', 'properties': {'navn': 'Test'},
                   'geometry': {'type': 'Polygon', 'coordinates': [[[11, 59], [12, 59], [12, 60], [11, 60]]]}}
        with self.assertRaises(ValueError):
            refresh.validate_feature(feature, '94448')

    def test_source_failure_preserves_verified_copy(self):
        feature = {'type': 'Feature', 'id': '94448', 'properties': {'navn': 'Test'},
                   'geometry': {'type': 'Point', 'coordinates': [11, 59]},
                   'cacheMetadata': {'verifiedDate': '2026-10-04'}}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / '94448.geojson'
            original = json.dumps(feature).encode()
            path.write_bytes(original)
            with patch.object(refresh.urllib.request, 'urlopen', side_effect=OSError('outage')):
                result = refresh.refresh_one('94448', Path(directory), 1, 1)
                missing = refresh.refresh_one('94449', Path(directory), 1, 1)
            self.assertEqual(result['refreshStatus'], 'kept_previous')
            self.assertEqual(result['verifiedDate'], '2026-10-04')
            self.assertEqual(path.read_bytes(), original)
            self.assertFalse(missing['available'])
            self.assertFalse((Path(directory) / '94449.geojson').exists())


if __name__ == '__main__':
    unittest.main()
