#!/usr/bin/env python3
"""Prepare native resources from the existing approved PNG; never invent a logo.
Requires network access to the owned site, or --icon with the approved PNG.
No accounts, APIs, payments, production credentials or backend writes.
"""
import argparse, hashlib, json, shutil, struct, subprocess, sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument('--platform',choices=['android','ios'],required=True)
p.add_argument('--icon',type=Path)
a=p.parse_args()
contract=json.loads((ROOT/'contract.json').read_text())
url=contract['iconUrl']
if a.icon:
    data=a.icon.read_bytes()
else:
    with urlopen(Request(url,headers={'User-Agent':'MyTimberAppPreview/0.1'}),timeout=30) as response:
        if response.geturl()!=url: raise SystemExit('Icon redirect rejected; review the new authority explicitly.')
        data=response.read(2_000_001)
if not 33<=len(data)<=2_000_000 or data[:8]!=b'\x89PNG\r\n\x1a\n':
    raise SystemExit('Approved icon is not a valid-size PNG; no fallback artwork will be used.')
width,height=struct.unpack('>II',data[16:24])
if width!=height or not 64<=width<=4096: raise SystemExit('Unexpected icon dimensions; review required.')
digest=hashlib.sha256(data).hexdigest()
if contract.get('iconSha256') and digest!=contract['iconSha256']: raise SystemExit('Approved icon hash changed.')
evidence=ROOT/'evidence';evidence.mkdir(exist_ok=True)
(evidence/'approved-icon.png').write_bytes(data)
(evidence/'icon-source.json').write_text(json.dumps({'url':url,'sha256':digest,'sourceWidth':width,'sourceHeight':height,'redrawn':False,'storeResolutionReviewRequired':width<1024},indent=2)+'\n')
if a.platform=='android':
    assets=ROOT/'android/app/src/main/assets';assets.mkdir(parents=True,exist_ok=True)
    res=ROOT/'android/app/src/main/res/drawable';res.mkdir(parents=True,exist_ok=True)
    (res/'my_timber_icon.png').write_bytes(data)
    shutil.copyfile(ROOT/'shared/native-presentation.js',assets/'native-presentation.js')
else:
    if sys.platform!='darwin': raise SystemExit('iOS resource generation requires macOS sips (no replacement icon).')
    resources=ROOT/'ios/Resources';resources.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(ROOT/'shared/native-presentation.js',resources/'native-presentation.js')
    catalog=resources/'Assets.xcassets';catalog.mkdir(exist_ok=True)
    (catalog/'Contents.json').write_text(json.dumps({'info':{'author':'xcode','version':1}}))
    icons=catalog/'AppIcon.appiconset';icons.mkdir(exist_ok=True)
    icon=icons/'AppIcon.png';icon.write_bytes(data)
    subprocess.run(['sips','-z','1024','1024',str(icon)],check=True,capture_output=True)
    (icons/'Contents.json').write_text(json.dumps({'images':[{'idiom':'universal','platform':'ios','size':'1024x1024','filename':'AppIcon.png'}],'info':{'author':'xcode','version':1}}))
    bg=catalog/'LaunchBackground.colorset';bg.mkdir(exist_ok=True)
    (bg/'Contents.json').write_text(json.dumps({'colors':[{'idiom':'universal','color':{'color-space':'srgb','components':{'red':'0.019608','green':'0.019608','blue':'0.019608','alpha':'1.000'}}}],'info':{'author':'xcode','version':1}}))
print(json.dumps({'platform':a.platform,'approvedIconSHA256':digest,'sourcePixels':width,'productionWrites':0}))
