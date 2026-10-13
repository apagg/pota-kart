#!/usr/bin/env python3
"""Import a reviewed Oslofjorden KML snapshot for Norwegian coastal trails.

The source permits private use; check data/coastal/README.md before reusing it.
No remote downloads occur here; output retains route categories and provenance.
"""
import argparse
from datetime import date
import hashlib
import json
import math
import re
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {'k': 'http://www.opengis.net/kml/2.2'}
SOURCE = 'https://www.oslofjorden.com/geodata/turer_oslofjorden_plain82.kml'
ROOT = Path(__file__).resolve().parents[1]
COLORS = {
    'ffff0000': 'marked-walking-route',
    'ffffff00': 'walking-suggestion',
    'ffffff55': 'walking-suggestion',
    'ff00ff00': 'cycling-alternative',
    'ff00ff55': 'cycling-alternative',
    'ff00aa00': 'cycling-alternative',
    'ff0000aa': 'ferry',
    'ff0000ff': 'closed-or-warning',
}


def convert(raw, snapshot_date=None, source_last_modified=None, reference="NO-2542", folder_name="turer_oestfold"):
    root = ET.fromstring(raw)
    styles = {s.get('id'): s for s in root.findall('.//k:Style', NS)}
    maps = {s.get('id'): s for s in root.findall('.//k:StyleMap', NS)}
    folders = [f for f in root.findall('.//k:Folder', NS)
               if f.findtext('k:name', '', NS) == folder_name]
    if len(folders) != 1:
        raise ValueError('Expected exactly one source folder: ' + folder_name)
    features = []

    def walk(folder, path):
        path = path + [folder.findtext('k:name', '', NS)]
        for mark in folder.findall('k:Placemark', NS):
            name = mark.findtext('k:name', '', NS)
            style = mark.findtext('k:styleUrl', '', NS).lstrip('#')
            if style in maps:
                style = next((p.findtext('k:styleUrl', '', NS).lstrip('#')
                              for p in maps[style].findall('k:Pair', NS)
                              if p.findtext('k:key', '', NS) == 'normal'), '')
            color = styles.get(style, ET.Element('none')).findtext('k:LineStyle/k:color', '', NS).lower()
            category = COLORS.get(color, 'unclassified')
            lines = []
            for el in mark.findall('.//k:LineString/k:coordinates', NS):
                line = [[float(v) for v in point.split(',')[:2]]
                        for point in (el.text or '').split()]
                if len(line) < 2 or any(len(c) != 2 or not all(math.isfinite(v) for v in c)
                                       or not (-180 <= c[0] <= 180 and -90 <= c[1] <= 90) for c in line):
                    raise ValueError('Invalid route coordinates: ' + name)
                lines.append(line)
            if not name or not lines:
                raise ValueError('Missing route name or geometry')
            description = mark.findtext('k:description', '', NS)
            urls = re.findall(r'https?://[^\s"<>]+', description)
            source_url = next((u for u in urls if 'oslofjorden.com/' in u), SOURCE)
            geometry = {'type': 'LineString', 'coordinates': lines[0]} if len(lines) == 1 else {'type': 'MultiLineString', 'coordinates': lines}
            features.append({'type': 'Feature', 'properties': {
                'name': name, 'folderPath': path, 'sourceUrl': source_url,
                'sourceColor': color, 'category': category,
                'includedInPota': category in ('marked-walking-route', 'walking-suggestion', 'cycling-alternative'),
                'reference': reference,
            }, 'geometry': geometry})
        for child in folder.findall('k:Folder', NS):
            walk(child, path)

    walk(folders[0], [])
    if not features or not any(f['properties']['includedInPota'] for f in features):
        raise ValueError('No usable walking/cycling routes')
    return {'type': 'FeatureCollection', 'metadata': {
        'schemaVersion': 1, 'source': SOURCE, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'snapshotDate': snapshot_date or date.today().isoformat(), 'sourceLastModified': source_last_modified,
        'reference': reference, 'sourceFeatureCount': len(features),
        'includedFeatureCount': sum(f['properties']['includedInPota'] for f in features),
        'usage': 'Private use according to source. Reassess permission before wider or commercial use.',
        'termsUrl': 'https://www.oslofjorden.com/om_oss.html',
    }, 'features': features}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--snapshot-date', default=date.today().isoformat())
    parser.add_argument('--source-last-modified')
    parser.add_argument('--output', type=Path, default=ROOT / 'data/coastal/oslofjorden-ostfold-test.geojson')
    parser.add_argument('--reference', default='NO-2542', choices=['NO-2542', 'NO-2590', 'NO-2641'])
    parser.add_argument('--folder', default='turer_oestfold')
    args = parser.parse_args()
    data = convert(args.input.read_bytes(), args.snapshot_date, args.source_last_modified, args.reference, args.folder)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    print(args.reference + ':', data['metadata']['includedFeatureCount'], 'walking/cycling routes of', len(data['features']))
