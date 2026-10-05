#!/usr/bin/env python3
"""Preserve generated attempts separately from reviewed and bound groups."""
import gzip,hashlib,json,os,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];STATE=ROOT/'evidence/recipe-image-worker';SCRATCH=ROOT.parent
groups={g['id']:g for g in json.loads(gzip.decompress((ROOT/'evidence/grub-image-coverage-2026-10-04/recipe-image-queue.json.gz').read_bytes()))['groups']}
def walk(value):
 if isinstance(value,list):
  for child in value:yield from walk(child)
 elif isinstance(value,dict):
  if value.get('groupId',value.get('id')) in groups:yield value
  else:
   for child in value.values():yield from walk(child)
ledger={}
previous=STATE/'attempts.json'
if previous.exists():ledger={a['attemptId']:a for a in json.loads(previous.read_text())['attempts']}
files=list((STATE/'results').glob('*.json'))+list((STATE/'results-retries').glob('*.json'))+list((STATE/'rejected').glob('*.json'))+list((STATE/'staged').glob('*.json'))+list(STATE.glob('*retry.json'))
for folder in STATE.glob('worker-*'):files.extend(folder.rglob('*.json'))
hashes={}
for file in sorted(set(files)):
 try:document=json.loads(file.read_text())
 except (ValueError,OSError):continue
 for record in walk(document):
  gid=record.get('groupId',record.get('id'));source=record.get('sourcePath')
  if not source:
   paths=re.findall(r'/workspace/[^\s]+\.png',record.get('output_hint',record.get('result',{}).get('output_hint','')))
   source=paths[0] if paths else None
  path=Path(source) if source else None;path=path if path is None or path.is_absolute() else SCRATCH/path
  digest=record.get('source_sha256',record.get('sourceSha256'))
  if path is not None and path.is_file():
   if str(path) not in hashes:hashes[str(path)]=hashlib.sha256(path.read_bytes()).hexdigest()
   if digest:assert digest==hashes[str(path)]
   digest=hashes[str(path)]
  if not digest:continue
  key=hashlib.sha256((gid+digest).encode()).hexdigest()
  review=record.get('review',{});review=review if isinstance(review,dict) else {}
  status=review.get('decision',review.get('status',record.get('review_status',record.get('reviewStatus','pending'))))
  if review.get('passed') is True or str(record.get('status','')).startswith('reviewed_pass'):status='pass'
  if review.get('passed') is False:status='reject'
  if status=='passed':status='pass'
  if status not in ('pass','reject'):status='pending'
  attempt=ledger.get(key,{})
  attempt.update(attemptId=key,groupId=gid,recipe_ids=groups[gid]['recipe_ids'],titles=groups[gid]['titles'],source_sha256=digest,sourcePath=str(path) if path else None,source_available=bool(path and path.is_file()))
  prompt=record.get('exact_prompt',record.get('prompt'))
  if prompt:attempt['prompt']=prompt;attempt['prompt_provenance']='submission receipt'
  elif 'prompt' not in attempt:attempt['prompt']=groups[gid]['prompt'];attempt['prompt_provenance']='canonical inventory prompt'
  if status!='pending' or 'review_status' not in attempt:
   attempt.update(review_status=status,review=review,alt=review.get('alt',record.get('alt')))
  for field in ('generated_at','dispatched_at','completed_at','elapsed_ms','elapsed_seconds','attempt'):
   if field in record:attempt[field]=record[field]
  attempt.setdefault('receipts',[])
  receipt=file.relative_to(ROOT).as_posix()
  if receipt not in attempt['receipts']:attempt['receipts'].append(receipt)
  ledger[key]=attempt
for p in (STATE/'rejected').glob('*.json'):
 r=json.loads(p.read_text());key=hashlib.sha256((r['groupId']+r['source_sha256']).encode()).hexdigest()
 if key in ledger:ledger[key].update(review_status='reject',review=r.get('review',{'notes':r.get('reason')}))
attempts=sorted(ledger.values(),key=lambda a:(a['groupId'],a['attemptId']))
summary={'generated_attempts':len(attempts),'generated_distinct_groups':len({a['groupId'] for a in attempts}),'reviewed_pass_attempts':sum(a['review_status']=='pass' for a in attempts),'reviewed_reject_attempts':sum(a['review_status']=='reject' for a in attempts),'awaiting_review_attempts':sum(a['review_status']=='pending' for a in attempts)}
temp=previous.with_suffix('.tmp.json');temp.write_text(json.dumps({'summary':summary,'attempts':attempts},indent=2)+'\n');os.replace(temp,previous)
print(json.dumps(summary))
