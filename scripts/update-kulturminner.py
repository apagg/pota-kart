#!/usr/bin/env python3
"""Refresh verified heritage geometry for all Kulturminnesok IDs in POTA data.

Failed requests never replace an existing verified geometry. The manifest
records which park IDs have geometry and which need attention.
"""
import argparse
import concurrent.futures
import datetime as dt
import json
import math
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

SOURCE_BASE = 'https://api.ra.no/LokaliteterEnkeltminnerOgSikringssoner/collections/lokaliteter/items/'


def kulturminne_id(website):
    try:
        url = urllib.parse.urlsplit(website or '')
        if url.scheme not in ('http', 'https') or url.hostname not in ('kulturminnesok.no', 'www.kulturminnesok.no'):
            return None
        value = urllib.parse.parse_qs(url.query).get('id', [''])[0]
        if not value:
            match = re.fullmatch(r'/ra/lokalitet/(\d+)/?', url.path)
            value = match[1] if match else ''
        return value if re.fullmatch(r'\d+', value) else None
    except (TypeError, ValueError):
        return None


def validate_feature(feature, heritage_id):
    if not isinstance(feature, dict) or feature.get('type') != 'Feature':
        raise ValueError('Not a GeoJSON Feature')
    properties = feature.get('properties') or {}
    if str(properties.get('kulturminneId') or feature.get('id')) != heritage_id:
        raise ValueError('Kulturminne ID mismatch')
    if not str(properties.get('navn') or '').strip():
        raise ValueError('Missing official name')
    geometry = feature.get('geometry') or {}
    kind = geometry.get('type')
    coordinates = geometry.get('coordinates')
    if kind not in ('Polygon', 'MultiPolygon', 'Point', 'MultiPoint', 'LineString', 'MultiLineString'):
        raise ValueError('Missing or unsupported geometry')

    def point(value):
        if not isinstance(value, list) or len(value) < 2:
            raise ValueError('Invalid coordinate')
        lon, lat = value[:2]
        if any(isinstance(n, bool) or not isinstance(n, (int, float)) or not math.isfinite(n) for n in (lon, lat)):
            raise ValueError('Non-finite coordinate')
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError('Coordinates are not WGS84')

    def line(value, minimum=2, ring=False):
        if not isinstance(value, list) or len(value) < minimum:
            raise ValueError('Empty or incomplete line/ring')
        for coordinate in value:
            point(coordinate)
        if ring and value[0][:2] != value[-1][:2]:
            raise ValueError('Unclosed polygon ring')

    def polygon(value):
        if not isinstance(value, list) or not value:
            raise ValueError('Empty polygon')
        for ring in value:
            line(ring, 4, True)

    if kind == 'Point':
        point(coordinates)
    elif kind in ('MultiPoint', 'LineString'):
        line(coordinates, 1 if kind == 'MultiPoint' else 2)
    elif kind == 'Polygon':
        polygon(coordinates)
    else:
        if not isinstance(coordinates, list) or not coordinates:
            raise ValueError('Empty multipart geometry')
        for part in coordinates:
            (polygon if kind == 'MultiPolygon' else line)(part)
    return feature


WFS_BASE = 'https://wfs.geonorge.no/skwms1/wfs.kulturminner'
APP_NS = 'http://skjema.geonorge.no/SOSI/produktspesifikasjon/LokaliteterEnkeltminnerOgSikringssoner/20210217'
GML_NS = 'http://www.opengis.net/gml/3.2'


def wfs_url(heritage_id, start=0):
    if not re.fullmatch(r'\d+', heritage_id):
        raise ValueError('Invalid heritage ID')
    query = (f'<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:app="{APP_NS}">'
             '<fes:Or><fes:PropertyIsEqualTo><fes:ValueReference>app:kulturminneId</fes:ValueReference>'
             f'<fes:Literal>{heritage_id}</fes:Literal></fes:PropertyIsEqualTo>'
             '<fes:PropertyIsEqualTo><fes:ValueReference>app:linkKulturminnesøk</fes:ValueReference>'
             f'<fes:Literal>https://kulturminnesok.no/ra/lokalitet/{heritage_id}</fes:Literal>'
             '</fes:PropertyIsEqualTo></fes:Or></fes:Filter>')
    return WFS_BASE + '?' + urllib.parse.urlencode({
        'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature',
        'typeNames': 'app:Lokalitet', 'srsName': 'urn:ogc:def:crs:EPSG::4326',
        'count': 1000, 'startIndex': start, 'filter': query})


def parse_wfs_page(xml, heritage_id):
    root = ET.fromstring(xml)
    if root.tag != '{http://www.opengis.net/wfs/2.0}FeatureCollection':
        raise ValueError('WFS did not return a feature collection')
    members = root.findall(f'.//{{{APP_NS}}}Lokalitet')
    polygons, names, source_ids = [], [], []
    for member in members:
        source_id = member.findtext(f'{{{APP_NS}}}kulturminneId') or ''
        source_link_id = kulturminne_id(member.findtext(f'{{{APP_NS}}}linkKulturminnesøk'))
        if source_id != heritage_id and not (re.fullmatch(re.escape(heritage_id) + r'-\d+', source_id) and source_link_id == heritage_id):
            raise ValueError('WFS kulturminne ID mismatch')
        name = member.findtext(f'{{{APP_NS}}}navn')
        if not name or not name.strip():
            raise ValueError('Missing WFS official name')
        names.append(name)
        source_ids.append(member.get(f'{{{GML_NS}}}id'))
        area = member.find(f'{{{APP_NS}}}område')
        if area is None:
            raise ValueError('WFS locality has no area')
        shapes = [e for e in area.iter() if e.tag in (f'{{{GML_NS}}}Polygon', f'{{{GML_NS}}}PolygonPatch')]
        if not shapes:
            raise ValueError('Unsupported WFS surface geometry')
        for shape in shapes:
            # EPSG:4326 in GML has latitude, longitude axis order.
            srs = shape.get('srsName') or next((e.get('srsName') for e in area.iter() if e.get('srsName')), None)
            if srs != 'urn:ogc:def:crs:EPSG::4326':
                raise ValueError('Unexpected WFS coordinate system')
            rings = []
            exteriors = shape.findall(f'{{{GML_NS}}}exterior')
            if len(exteriors) != 1:
                raise ValueError('Polygon needs exactly one exterior')
            for boundary in exteriors + shape.findall(f'{{{GML_NS}}}interior'):
                linear = boundary.find(f'{{{GML_NS}}}LinearRing')
                if linear is None:
                    raise ValueError('Unsupported WFS boundary')
                poslist = linear.find(f'{{{GML_NS}}}posList')
                if poslist is not None:
                    if poslist.get('srsDimension', '2') != '2':
                        raise ValueError('Unexpected WFS coordinate dimension')
                    values = [float(n) for n in (poslist.text or '').split()]
                    if len(values) % 2:
                        raise ValueError('Incomplete WFS coordinate')
                    ring = [[values[i+1], values[i]] for i in range(0, len(values), 2)]
                else:
                    positions = [[float(n) for n in (e.text or '').split()] for e in linear.findall(f'{{{GML_NS}}}pos')]
                    if any(len(p) != 2 for p in positions):
                        raise ValueError('Unexpected WFS coordinate dimension')
                    ring = [[p[1], p[0]] for p in positions]
                rings.append(ring)
            polygons.append(rings)
    return polygons, names, source_ids, len(members)


def fetch_wfs(heritage_id, timeout):
    polygons, names, source_ids, urls = [], [], [], []
    for start in range(0, 100000, 1000):
        url = wfs_url(heritage_id, start)
        with urllib.request.urlopen(url, timeout=timeout) as response:
            parts, labels, ids, count = parse_wfs_page(response.read(), heritage_id)
        polygons.extend(parts)
        names.extend(labels)
        source_ids.extend(ids)
        urls.append(url)
        if count < 1000:
            break
    else:
        raise ValueError('WFS result exceeds paging limit')
    if not polygons:
        raise ValueError('No verified WFS locality for ID ' + heritage_id)
    feature = {'type': 'Feature', 'id': heritage_id,
               'properties': {'kulturminneId': heritage_id, 'navn': ' / '.join(dict.fromkeys(names)),
                              'sourceFeatureIds': source_ids,
                              'linkKulturminnesøk': 'https://kulturminnesok.no/ra/lokalitet/' + heritage_id},
               'geometry': {'type': 'MultiPolygon', 'coordinates': polygons}}
    return validate_feature(feature, heritage_id), urls


def refresh_one(heritage_id, directory, attempts=2, timeout=60):
    path = directory / (heritage_id + '.geojson')
    source_url = SOURCE_BASE + heritage_id + '?f=json'
    error = ''
    # Both services publish the same official locality data. Prefer the JSON
    # API; if unavailable, assemble every exact-ID WFS locality and its holes.
    for attempt in range(attempts):
        for service in ('api', 'wfs'):
            try:
                if service == 'api':
                    request = urllib.request.Request(source_url, headers={'Accept': 'application/geo+json, application/json'})
                    with urllib.request.urlopen(request, timeout=timeout) as response:
                        feature = validate_feature(json.load(response), heritage_id)
                    sources = [source_url]
                else:
                    feature, sources = fetch_wfs(heritage_id, timeout)
                feature['cacheMetadata'] = {'verifiedDate': dt.datetime.now(dt.timezone.utc).date().isoformat(),
                                            'sourceUrl': sources[0], 'sourceUrls': sources, 'service': service}
                temporary = path.with_suffix('.tmp')
                temporary.write_text(json.dumps(feature, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
                temporary.replace(path)
                return {'id': heritage_id, 'available': True, 'refreshStatus': 'updated', 'verifiedDate': feature['cacheMetadata']['verifiedDate']}
            except Exception as exc:
                error = service + ': ' + str(exc)
        if attempt + 1 < attempts:
            time.sleep(1 + attempt)
    if path.exists():
        try:
            previous = validate_feature(json.loads(path.read_text(encoding='utf-8')), heritage_id)
            return {'id': heritage_id, 'available': True, 'refreshStatus': 'kept_previous', 'verifiedDate': previous.get('cacheMetadata', {}).get('verifiedDate'), 'refreshError': error}
        except Exception:
            pass
    return {'id': heritage_id, 'available': False, 'refreshStatus': 'unavailable', 'refreshError': error}


def run(parks_path, directory, attempts=2, timeout=60):
    parks = json.loads(parks_path.read_text(encoding='utf-8'))
    if not isinstance(parks, list) or not parks:
        raise ValueError('POTA park data must be a nonempty array')
    inventory = {}
    missing_ids = []
    for park in parks:
        heritage_id = kulturminne_id(park.get('website'))
        if heritage_id:
            inventory.setdefault(heritage_id, []).append({'reference': park['reference'], 'name': park['name']})
        elif re.match(r'^https?://(?:www\.)?kulturminnesok\.no(?:/|$)', park.get('website') or ''):
            missing_ids.append({'reference': park['reference'], 'name': park['name']})
    directory.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        results = list(executor.map(lambda item: refresh_one(item, directory, attempts, timeout), sorted(inventory)))
    for result in results:
        result['parks'] = inventory[result['id']]
        print(json.dumps(result, ensure_ascii=False), flush=True)
    manifest = {'generatedDate': dt.datetime.now(dt.timezone.utc).date().isoformat(), 'entries': results, 'parksWithoutId': missing_ids}
    (directory / 'index.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--parks', type=Path, default=Path('data/pota-NO.json'))
    parser.add_argument('--output', type=Path, default=Path('data/kulturminner'))
    parser.add_argument('--attempts', type=int, default=2)
    parser.add_argument('--timeout', type=int, default=60)
    args = parser.parse_args()
    if args.attempts < 1 or args.timeout < 1:
        parser.error('attempts and timeout must be positive')
    run(args.parks, args.output, args.attempts, args.timeout)
