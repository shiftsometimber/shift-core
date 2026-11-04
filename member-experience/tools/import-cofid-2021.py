"""Convert the official, pinned CoFID workbook into public catalogue SQL.

No network, credentials, member data, defaults or guessed ingredient matches.
Usage: python3 import-cofid-2021.py official.xlsx output.sql
"""
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as E
import zipfile

EXPECTED_SHA256 = '436e9445ef2adb2a75f3d7edd51302de3adad25385f9795fc94ba58bd030e97d'
SOURCE_URL = 'https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def convert(source, target):
    raw = Path(source).read_bytes()
    if hashlib.sha256(raw).hexdigest() != EXPECTED_SHA256:
        raise ValueError('CoFID source checksum differs; review the new dataset before importing.')
    with zipfile.ZipFile(source) as archive:
        strings = [''.join(x.itertext()) for x in E.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', NS)]

        def rows(name):
            result = []
            for row in E.fromstring(archive.read('xl/worksheets/' + name)).findall('s:sheetData/s:row', NS)[2:]:
                item = {}
                for cell in row:
                    value = cell.find('s:v', NS)
                    if value is not None:
                        column = ''.join(c for c in cell.attrib['r'] if c.isalpha())
                        item[column] = strings[int(value.text)] if cell.attrib.get('t') == 's' else value.text
                if item.get('A'):
                    result.append(item)
            return result

        prox = rows('sheet4.xml')
        inorganic = {r['A']: r for r in rows('sheet5.xml')}

    def number(value):
        # Trace, missing and N/A stay unknown; never convert them to zero.
        try:
            value = float(value)
            return value if value >= 0 else None
        except (ValueError, TypeError):
            return None

    def sql(value):
        return "'" + str(value).replace("'", "''") + "'"

    lines = [
        '-- UK CoFID 2021; Open Government Licence v3.0. Public food data only.',
        '-- Source: ' + SOURCE_URL,
        '-- SHA256: ' + EXPECTED_SHA256,
        '-- Sodium mg/100g to salt g/100g: sodium * 2.5 / 1000 (UK FoP guidance).',
    ]
    for row in prox:
        sodium = number(inorganic.get(row['A'], {}).get('H'))
        values = {key: number(row.get(column)) for key, column in {
            'proteinG': 'J', 'fatG': 'K', 'carbohydrateG': 'L', 'kcal': 'M',
            'sugarsG': 'Q', 'fibreG': 'Z', 'saturatesG': 'AB',
        }.items()}
        values['saltG'] = None if sodium is None else sodium * 2.5 / 1000
        food = {
            'id': 'cofid:2021:' + row['A'], 'name': row['B'],
            # CoFID is per 100g. Do not pretend this is per 100ml for a drink.
            'kind': 'food', 'unit': 'g', 'per100': values,
            # The workbook has no machine-readable food/drink classification or
            # density. Suppress colours until that record's basis is reviewed.
            'suppressTrafficLights': True,
            'description': row.get('C', ''),
            'source': {'name': 'UK CoFID 2021', 'version': '2021', 'recordId': row['A'],
                       'url': SOURCE_URL, 'sha256': EXPECTED_SHA256,
                       'licence': 'Open Government Licence v3.0'},
            'estimate': True,
        }
        body = json.dumps(food, ensure_ascii=False, separators=(',', ':'))
        lines.append('INSERT INTO member_food_catalogue(id,name,source,body_json,updated_at) VALUES('
                     + ','.join(map(sql, [food['id'], food['name'], 'cofid', body, '2021-03-19T00:00:00Z']))
                     + ') ON CONFLICT(id) DO UPDATE SET name=excluded.name,body_json=excluded.body_json,updated_at=excluded.updated_at;')
    Path(target).write_text('\n'.join(lines) + '\n')
    print(json.dumps({'foods': len(prox), 'sha256': EXPECTED_SHA256, 'output': str(target)}))


if __name__ == '__main__':
    convert(*sys.argv[1:])
