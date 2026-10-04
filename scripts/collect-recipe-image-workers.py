#!/usr/bin/env python3
"""Normalise compact worker receipts; failed or unreviewed outputs cannot enter bindings."""
import json,gzip,hashlib,os
from pathlib import Path
from PIL import Image
from recipe_image_lock import acquire
ROOT=Path(__file__).resolve().parents[1];STATE=ROOT/'evidence/recipe-image-worker';SCRATCH=ROOT.parent
checkpoint_lock=acquire(STATE)
groups={g['id']:g for g in json.loads(gzip.decompress((ROOT/'evidence/grub-image-coverage-2026-10-04/recipe-image-queue.json.gz').read_bytes()))['groups']}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,obj):
 p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(obj,indent=2)+'\n');os.replace(tmp,p)
def walk(x):
 if isinstance(x,list):
  for y in x:yield from walk(y)
 elif isinstance(x,dict):
  if 'groupId' in x:yield x
  else:
   for y in x.values():yield from walk(y)
reviews=json.loads((STATE/'visual-reviews.json').read_text()) if (STATE/'visual-reviews.json').exists() else {}
added=0;blocked=[]
rejected_sources={(r['groupId'],r['source_sha256']) for p in (STATE/'rejected').glob('*.json') for r in [json.loads(p.read_text())]}
for folder in sorted(STATE.glob('worker-*')):
 for file in sorted(folder.rglob('*.json')):
  try:document=json.loads(file.read_text())
  except (ValueError,OSError):continue
  for r in walk(document):
   gid=r['groupId'];g=groups.get(gid)
   if not g:continue
   review=r.get('review',{});review=review if isinstance(review,dict) else {}
   passed=r.get('reviewStatus')=='passed' or review.get('passed') is True or review.get('status')=='pass' or review.get('decision')=='pass' or r.get('status','').startswith('reviewed_pass')
   if not passed:continue
   sourcehash=r.get('source_sha256',r.get('sourceSha256'))
   if (gid,sourcehash) in rejected_sources:continue
   target=STATE/'staged'/f'{gid}.json'
   if target.exists():
    existing=json.loads(target.read_text())
    if existing.get('review',{}).get('decision')=='pass':reviews[gid]=existing['review']
    continue
   ids=r.get('recipe_ids',r.get('recipeIds'));assert ids==g['recipe_ids'],f'Worker changed recipe IDs: {file}'
   titles=r.get('titles',[r.get('title')] if r.get('title') else None)
   prompt=r.get('exact_prompt',r.get('prompt'));assert g['prompt'] in prompt,f'Untraceable prompt: {file}'
   if titles is None and len(g['titles'])==1 and ('Exact recipe: '+g['titles'][0]+'.') in prompt:titles=g['titles']
   assert titles==g['titles'],f'Worker must review every shared title: {file}'
   notes=review.get('notes',review.get('reason',r.get('reviewReasons')));alt=review.get('alt',r.get('alt'));assert notes and alt
   source=Path(r['sourcePath']);source=source if source.is_absolute() else SCRATCH/source
   if not source.is_file():continue
   assert sourcehash and sha(source)==sourcehash,f'Source hash mismatch: {file}'
   assets=r.get('assets',r.get('variants',[]));assets=[a for a in assets if isinstance(a,dict) and (a.get('file') or a.get('asset') or a.get('path'))]
   asset=r.get('assetPath',r.get('asset_path'))
   if asset:assets.append({'file':asset,'width':r.get('width',r.get('assetDimensions',[960,720])[0]),'height':r.get('height',r.get('assetDimensions',[960,720])[1]),'sha256':r.get('asset_sha256',r.get('assetSha256'))})
   if not assets:continue
   variants={};bad=False
   for a in assets:
    path=Path(a.get('file',a.get('asset',a.get('path'))));path=path if path.is_absolute() else ROOT/path
    if not path.is_file() or sha(path)!=a['sha256']:
     blocked.append({'groupId':gid,'receipt':str(file.relative_to(ROOT)),'asset':str(path),'reason':'missing file or recorded SHA256 mismatch'});bad=True;break
    im=Image.open(path);im.load();assert im.size==(a['width'],a['height'])
    snapshot=STATE/'snapshots'/folder.name/(path.stem+'-'+a['sha256'][:12]+path.suffix);snapshot.parent.mkdir(parents=True,exist_ok=True)
    if not snapshot.exists():
     temp=snapshot.with_suffix('.tmp.webp');temp.write_bytes(path.read_bytes());assert sha(temp)==a['sha256'];Image.open(temp).verify();os.replace(temp,snapshot)
    assert sha(snapshot)==a['sha256']
    variants[a['width']]={'width':im.width,'height':im.height,'asset':snapshot.relative_to(ROOT).as_posix(),'sha256':sha(snapshot),'bytes':snapshot.stat().st_size}
   if bad:continue
   assert 960 in variants
   if 480 not in variants:
    original=Image.open(source).convert('RGB');small=original.resize((480,round(original.height*480/original.width)),Image.Resampling.LANCZOS);path=STATE/'snapshots'/folder.name/('catalogue-'+gid[:20]+'-480.webp');path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_suffix('.tmp.webp');small.save(temp,'WEBP',quality=82,method=6);Image.open(temp).verify();os.replace(temp,path)
    variants[480]={'width':small.width,'height':small.height,'asset':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'bytes':path.stat().st_size}
   timestamp=review.get('reviewed_at',r.get('reviewedAt',r.get('reviewed_at')))
   decision={'decision':'pass','source_sha256':sourcehash,'recipe_ids':ids,'titles':titles,'notes':notes,'alt':alt,'reviewed_at':timestamp,'reviewer':r.get('reviewer',review.get('reviewer',folder.name)),'receipt':file.relative_to(ROOT).as_posix()}
   write(target,{'groupId':gid,'recipe_ids':ids,'titles':titles,'prompt':prompt,'ingredients':g['ingredients'],'method':g['method'],'sourcePath':str(source),'source_sha256':sourcehash,'generated_at':r.get('completed_at',r.get('generated_at')),'elapsed_ms':r.get('elapsed_ms',r.get('elapsedSeconds',r.get('elapsed_seconds',0))*1000),'variants':[variants[480],variants[960]],'review_status':'pass','review':decision,'integrated':False,'live':False})
   reviews[gid]=decision;added+=1
write(STATE/'visual-reviews.json',reviews);write(STATE/'blocked-integrity.json',blocked);print(json.dumps({'collected_reviewed_groups':added,'total_reviewed_receipts':len(reviews),'blocked_integrity':len(blocked)}))
