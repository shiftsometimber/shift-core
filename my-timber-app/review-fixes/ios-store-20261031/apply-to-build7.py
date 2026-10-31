#!/usr/bin/env python3
"""Apply the scoped iOS correction only to recovered, matching build-7 sources.

Does not sign, upload, change store declarations or submit a review.
"""
import argparse
import hashlib
import re
import shutil
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('source', type=Path, help='Recovered my-timber-app directory')
args = p.parse_args()
root = args.source.resolve()
expected = {
    'shared/native-presentation.js': '00fe5e04f7e1ab9f757ba0106a95b6622314748f388ee17b40c2961f3958e88b',
    'shared/native-health.js': '23baaac0a83081e5c4ac6b26f9a25c771b405cde8138c35b933df0a4037f489f',
    'shared/native-treatment.js': '105fcbd97b47b4a2d8ccd186abe4bcd19a3db47671c8b4e74c224deae0b65da1',
}
for relative, digest in expected.items():
    path = root / relative
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        raise SystemExit(f'Not the matching build-7 source: {relative}. No files changed.')
project = (root / 'ios/project.yml').read_text()
if not re.search(r'CURRENT_PROJECT_VERSION:\s*[\"\x27]?7\b', project) or 'Widget' not in project:
    raise SystemExit('Expected build-7 project and widget target. No files changed.')
controller = root / 'ios/Sources/MyTimberViewController.swift'
controller_text = controller.read_text()
marker = '        config.applicationNameForUserAgent="MyTimber/1.0.0"'
if controller_text.count(marker) != 1:
    raise SystemExit('Controller integration point differs. Review source; no files changed.')
prepare = root / 'scripts/prepare.py'
prepare_text = prepare.read_text()
resource_marker = "    resources=ROOT/'ios/Resources';resources.mkdir(parents=True,exist_ok=True)"
if prepare_text.count(resource_marker) != 1:
    raise SystemExit('Resource generator differs. Review source; no files changed.')
if 'ios-store-presentation' in controller_text or 'ios-store-presentation' in prepare_text:
    raise SystemExit('An integration already exists. Inspect it instead of applying twice.')
hook = '''
        if let url=Bundle.main.url(forResource:"ios-store-presentation",withExtension:"js"),
           let source=try? String(contentsOf:url,encoding:.utf8){
            config.userContentController.addUserScript(WKUserScript(source:source,injectionTime:.atDocumentStart,forMainFrameOnly:true))
        }'''
copy = "\n    shutil.copyfile(ROOT/'ios/ios-store-presentation.js',resources/'ios-store-presentation.js')"
asset = Path(__file__).with_name('ios-store-presentation.js')
destination = root / 'ios/ios-store-presentation.js'
if destination.exists():
    raise SystemExit('Target asset already exists. No files changed.')
# All identity and integration checks pass before the first write.
shutil.copyfile(asset, destination)
controller.write_text(controller_text.replace(marker, marker + hook))
prepare.write_text(prepare_text.replace(resource_marker, resource_marker + copy))
print('Applied iOS-only resource and document-start hook. Android/shared resources unchanged.')
print('Build number remains 7: choose the next unused number after checking App Store Connect.')
