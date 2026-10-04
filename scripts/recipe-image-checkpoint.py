#!/usr/bin/env python3
"""Stage returned assets and bind only explicit visual passes. Never generates or deploys."""
import argparse, hashlib, json, re, os
from pathlib import Path
from PIL import Image
from recipe_image_lock import acquire

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'evidence/recipe-image-worker'
ASSETS = ROOT / 'frontend/member/assets/member-experience/food'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p, value):
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(value,indent=2)+'\n');os.replace(tmp,p)
def main():
    checkpoint_lock=acquire(STATE)
    cli=argparse.ArgumentParser();cli.add_argument('command',choices=['stage','bind','summary']);args=cli.parse_args()
    inventory=json.loads(__import__('gzip').decompress((ROOT/'evidence/grub-image-coverage-2026-10-04/recipe-image-queue.json.gz').read_bytes()))
    groups={g['id']:g for g in inventory['groups']}; recipes={r['id']:r for r in inventory['recipes']}
    records=STATE/'staged';records.mkdir(parents=True,exist_ok=True)
    rejected_sources={(r['groupId'],r['source_sha256']) for p in (STATE/'rejected').glob('*.json') for r in [json.loads(p.read_text())]}
    for p in records.glob('*.json'):
        r=json.loads(p.read_text())
        if (r['groupId'],r['source_sha256']) in rejected_sources:p.unlink()
    if args.command=='stage':
        for f in sorted(list((STATE/'results').glob('*.json'))+list((STATE/'results-retries').glob('*.json'))):
            returned=json.loads(f.read_text());gid=returned['groupId'];g=groups[gid]
            target=records/(gid+'.json')
            if target.exists(): continue
            result=returned['result'];paths=re.findall(r'/workspace/[^\s]+\.png',result['output_hint']);assert paths
            source=Path(paths[0])
            if not source.is_file() or (gid,sha(source)) in rejected_sources:continue
            im=Image.open(source).convert('RGB');im.load()
            assert im.width>=960 and im.height>=640
            name='catalogue-'+gid[:20]+('-retry'+str(returned['attempt']) if returned.get('attempt') else ''); staged=STATE/'assets';staged.mkdir(exist_ok=True)
            variants=[]
            for width in [480,960]:
                resized=im.resize((width,round(im.height*width/im.width)),Image.Resampling.LANCZOS)
                dest=staged/(name+('' if width==960 else '-480')+'.webp');temp=dest.with_suffix('.tmp.webp');resized.save(temp,'WEBP',quality=82,method=6);Image.open(temp).verify();os.replace(temp,dest)
                variants.append({'width':resized.width,'height':resized.height,'asset':dest.relative_to(ROOT).as_posix(),'sha256':sha(dest),'bytes':dest.stat().st_size})
            write(target,{'groupId':gid,'recipe_ids':g['recipe_ids'],'titles':g['titles'],'prompt':g['prompt'],'ingredients':g['ingredients'],'method':g['method'],'sourcePath':str(source),'source_sha256':sha(source),'generated_at':returned['generated_at'],'elapsed_ms':returned['elapsed_ms'],'variants':variants,'review_status':'pending','integrated':False,'live':False})
            # Keep the durable receipt compact; original bytes remain at sourcePath.
            write(f,{k:v for k,v in returned.items() if k!='result'} | {'result':{'output_hint':result['output_hint']}})
    elif args.command=='bind':
        reviews=json.loads((STATE/'visual-reviews.json').read_text()); mapper=ROOT/'member-experience/grub-image-map.mjs'
        text=mapper.read_text();start=text.index('export const grubImages=')+len('export const grubImages=');mappings,length=json.JSONDecoder().raw_decode(text[start:]);end=start+length;byid={m['id']:m for m in mappings}
        completed=[];blocked=[]
        for f in sorted(records.glob('*.json')):
            record=json.loads(f.read_text());review=reviews.get(record['groupId'])
            if not review: continue
            if review['decision']=='reject':
                assert not record['integrated'], 'Cannot silently withdraw integrated image'
                record.update(review_status='reject',review=review);write(f,record);continue
            assert review['decision']=='pass'
            if review.get('source_sha256'):assert review['source_sha256']==record['source_sha256']
            else:review['source_sha256']=record['source_sha256']
            g=groups[record['groupId']];assert review['recipe_ids']==g['recipe_ids'];assert review['alt'] and review['notes']
            # Sharing requires all member titles to have been reviewed explicitly.
            assert review['titles']==g['titles']
            if any(not (ROOT/v['asset']).is_file() or sha(ROOT/v['asset'])!=v['sha256'] for v in record['variants']):
                blocked.append(record['groupId']);continue
            for v in record['variants']:
                src=ROOT/v['asset'];ASSETS.mkdir(parents=True,exist_ok=True)
                dest=ASSETS/src.name
                if dest.exists(): assert sha(dest)==v['sha256']
                else:
                    tmp=dest.with_suffix('.tmp.webp');tmp.write_bytes(src.read_bytes());assert sha(tmp)==v['sha256'];os.replace(tmp,dest)
            small,large=record['variants'];src='/assets/member-experience/food/'+Path(large['asset']).name
            for rid in g['recipe_ids']:
                r=recipes[rid];binding={'id':rid,'title':r['title'],'ingredients':r['ingredients'],'method':r['method'],'src':src,'alt':review['alt'],'sha256':large['sha256'],'width':large['width'],'height':large['height'],'srcSet':'/assets/member-experience/food/'+Path(small['asset']).name+' 480w, '+src+' 960w'}
                if rid in byid: assert byid[rid]==binding, 'Refusing to overwrite existing binding '+rid
                else: mappings.append(binding);byid[rid]=binding
            record.update(review_status='pass',review=review,integrated=True);completed.append((f,record))
            # Checkpoint only durable production paths, so resumption does not
            # depend on worker conversion caches or duplicate private snapshots.
            for variant in record['variants']:
                variant['asset']=(ASSETS/Path(variant['asset']).name).relative_to(ROOT).as_posix()
        tmp=mapper.with_suffix('.tmp.mjs');tmp.write_text(text[:start]+json.dumps(mappings,separators=(',',':'),ensure_ascii=False)+text[end:]);os.replace(tmp,mapper)
        for f,record in completed:write(f,record)
        write(STATE/'visual-reviews.json',reviews)
        write(STATE/'binding-blocked-integrity.json',blocked)
    staged=[json.loads(f.read_text()) for f in records.glob('*.json')]
    mapper=(ROOT/'member-experience/grub-image-map.mjs').read_text();bindings,_=json.JSONDecoder().raw_decode(mapper[mapper.index('export const grubImages=')+len('export const grubImages='):]);boundids={r['id'] for r in bindings}
    byid={r['id']:r for r in bindings}
    integrated=sum(all(rid in byid and byid[rid]['sha256']==r['variants'][-1]['sha256'] for rid in r['recipe_ids']) for r in staged)
    summary={'catalogue_recipes':len(recipes),'distinct_groups':len(groups),'generated_new':len(staged),'reviewed_pass_new':sum(r['review_status']=='pass' for r in staged),'reviewed_reject_new':sum(r['review_status']=='reject' for r in staged),'integrated_new':integrated,'integrated_recipe_bindings_total':len(boundids),'remaining_recipe_bindings':len(recipes)-len(boundids),'live_new':0,'remaining_groups_without_prepared_asset':2604-len(staged),'remaining_groups_without_usable_new_asset':2604-sum(r['review_status']=='pass' for r in staged),'complete':len(boundids)==len(recipes)}
    write(STATE/'summary.json',summary);print(json.dumps(summary))
if __name__=='__main__': main()
