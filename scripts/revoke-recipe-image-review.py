import argparse,json,datetime,os
from pathlib import Path
from recipe_image_lock import acquire
ROOT=Path(__file__).resolve().parents[1];STATE=ROOT/'evidence/recipe-image-worker';lock=acquire(STATE)
p=argparse.ArgumentParser();p.add_argument('--group-ids',nargs='+',required=True);p.add_argument('--reason',required=True);a=p.parse_args()
mapper=ROOT/'member-experience/grub-image-map.mjs';text=mapper.read_text();start=text.index('export const grubImages=')+len('export const grubImages=');rows,length=json.JSONDecoder().raw_decode(text[start:]);end=start+length
reviews=json.loads((STATE/'visual-reviews.json').read_text())
for gid in a.group_ids:
    f=STATE/'staged'/(gid+'.json')
    if not f.exists():continue
    r=json.loads(f.read_text());ids=set(r['recipe_ids']);assert all(m['sha256']==r['variants'][-1]['sha256'] for m in rows if m['id'] in ids)
    rows=[m for m in rows if m['id'] not in ids];r.update(integrated=False,review_status='reject',review={'decision':'reject','source_sha256':r['source_sha256'],'notes':a.reason,'reviewed_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
    dest=STATE/'rejected'/(gid+'-'+r['source_sha256'][:16]+'.json');dest.parent.mkdir(exist_ok=True);dest.write_text(json.dumps(r,indent=2)+'\n');f.unlink();reviews.pop(gid,None)
tmp=mapper.with_suffix('.tmp.mjs');tmp.write_text(text[:start]+json.dumps(rows,separators=(',',':'),ensure_ascii=False)+text[end:]);os.replace(tmp,mapper)
(STATE/'visual-reviews.json').write_text(json.dumps(reviews,indent=2)+'\n')
