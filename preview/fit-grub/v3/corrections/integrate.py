"""Apply reviewed replacements; never infer a pass from image generation alone.

Run from repository root. review-checkpoint.json and candidates are local inputs;
the portable review.json, baseline.json and selected images are committed outputs.
"""
import csv
import hashlib
import json
from pathlib import Path
import shutil
import struct

ROOT = Path('preview/fit-grub/v3')
CORRECTIONS = ROOT / 'corrections'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def write(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

pack = json.loads((ROOT / 'approval.json').read_text())
reviews = json.loads((CORRECTIONS / 'review-checkpoint.json').read_text())
assert len(reviews) == 45 and all(r['status'] == 'pass' for r in reviews.values())
assert {r['id'] for r in pack['records'] if r['status'] == 'held'} == set(reviews), 'Apply once to the original 45 holds'
baseline = {'commit': 'c812b11ccd0b1e6603f4de6967b960a0aea1e1a0', 'approvalSha256': sha(ROOT / 'approval.json'), 'guidanceSha256': sha(Path('preview/fit-grub/guidance/workbook.json')), 'records': pack['records']}
write(CORRECTIONS / 'baseline.json', baseline)
portable = {'date': '2026-09-14', 'authorisation': 'Can you resolve the 45 holds yourself ??', 'reviewer': 'Codex — delegated AI visual QA', 'scope': 'Image defects only; no professional technique certification or member-release approval', 'generator': 'built-in image_gen', 'records': []}
for record in pack['records']:
    if record['id'] not in reviews:
        continue
    identifier = record['id']
    review = reviews[identifier]
    candidate = CORRECTIONS / 'candidates' / (identifier + '.png')
    assert sha(candidate) == sha(Path(review['path']))
    data = candidate.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    width, height = struct.unpack('>II', data[16:24])
    selected = ROOT / 'images' / (identifier + '.png')
    assert not selected.exists()
    shutil.copy2(candidate, selected)
    rejected = [{**{k: a[k] for k in ('status', 'observation')}, 'generationFile': Path(a['path']).name, 'sha256': sha(Path(a['path']))} for a in review.get('previousAttempts', [])]
    decision = {'id': identifier, 'status': 'pass', 'observation': review['observation'], 'originalHoldReason': record['reason'], 'originalRejectedSha256': record['sha256'], 'asset': str(selected), 'sha256': sha(selected), 'width': width, 'height': height, 'generationFile': Path(review['path']).name, 'previousAttempts': rejected}
    portable['records'].append(decision)
    record.update(status='approved', approvalMethod='delegated AI visual correction review', reason=None, sha256=decision['sha256'], width=width, height=height, image=f'/fit-v3-images/{identifier}.png', correctionReview={k: decision[k] for k in ('status', 'observation', 'originalHoldReason', 'originalRejectedSha256', 'sha256')})
    record['correctionReview'].update(reviewer=portable['reviewer'], date=portable['date'])

pack['originalVisualApproval'] = {k: pack[k] for k in ('approvedBy', 'approvalQuote', 'approvedImages', 'heldImages')}
pack['approvedBy'] = 'Matt (255 original images); Codex delegated visual QA (45 corrections)'
pack['correctionAuthorisation'] = portable['authorisation']
pack['approvedImages'] = sum(r['status'] == 'approved' for r in pack['records'])
pack['heldImages'] = sum(r['status'] == 'held' for r in pack['records'])
pack['approvedImageVariantRows'] = sum(len(r['variants']) for r in pack['records'] if r['status'] == 'approved')
write(ROOT / 'approval.json', pack)
write(CORRECTIONS / 'review.json', portable)
with (CORRECTIONS / 'MANIFEST.csv').open('w', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=['variant_id', 'canonical_movement', 'image_path', 'image_sha256', 'visual_review', 'technique_review'])
    writer.writeheader()
    for record in pack['records']:
        if record['id'] in reviews:
            for variant in record['variants']:
                writer.writerow({'variant_id': variant['id'], 'canonical_movement': record['id'], 'image_path': record['image'], 'image_sha256': record['sha256'], 'visual_review': record['approvalMethod'], 'technique_review': record['techniqueReview']})
print(f"Integrated {len(portable['records'])} reviewed images; {pack['approvedImages']} ready, {pack['heldImages']} held")
