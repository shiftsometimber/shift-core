from pathlib import Path
import json,re,html,hashlib
root=Path(__file__).parent
specs=[('upper-arm-blood-collection','upper-arm-blood-collection','Upper-arm home collection explained','Understand SHIFT’s proposed upper-arm blood collection option, its trial status, costs and limits, and how it differs from choosing a test panel.'),('understanding-blood-test-results','understanding-blood-test-results','Understanding blood-test results and follow-up','A practical guide to reading a blood-test report, asking useful questions and confirming who explains results and arranges follow-up.'),('weight-loss-blood-tests-refresh','weight-loss-blood-tests','Blood tests and weight management: what they tell you','What blood tests can tell you about health and weight management, how to prepare and why the right investigations depend on your circumstances.')]
def inline(s):
 s=html.escape(s)
 s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'<a href="\2">\1</a>',s)
 s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
 return s
sections=[];candidates=[]
for file,slug,seo,summary in specs:
 text=(root/(file+'.md')).read_text();lines=text.splitlines();title=lines[0][2:];body='\n'.join(lines[2:]).strip()
 sources=list(dict.fromkeys(re.findall(r'\]\((https://[^)]+)\)',body)))
 data=dict(slug=slug,title=title,seo_title=seo+' | SHIFT',summary=summary,body=body,sources=[dict(url=u,note='Primary source checked 18 October 2026. See editorial review notes for limitations.') for u in sources],status='draft',approval_status='not_yet_approved',clinical_review='not_claimed',prepared_at='2026-10-18',preserve_existing_identity=(slug=='weight-loss-blood-tests'))
 (root/(file+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 blocks=[]
 for block in text.split('\n\n'):
  if block.startswith('### '):blocks.append('<h3>'+inline(block[4:])+'</h3>')
  elif block.startswith('## '):blocks.append('<h2>'+inline(block[3:])+'</h2>')
  elif block.startswith('# '):blocks.append('<h1>'+inline(block[2:])+'</h1>')
  elif block.startswith('- '):blocks.append('<ul>'+''.join('<li>'+inline(x[2:])+'</li>' for x in block.splitlines())+'</ul>')
  elif block.startswith('*') and block.endswith('*'):blocks.append('<p class="note">'+inline(block[1:-1])+'</p>')
  else:blocks.append('<p>'+inline(block)+'</p>')
 sections.append('<article id="'+file+'"><div class="eyebrow">COMPLETE DRAFT · NOT PUBLISHED</div>'+''.join(blocks)+'</article>')
 candidates.append(dict(file=file+'.json',slug=slug,words=len(body.split()),sha256=hashlib.sha256(text.encode()).hexdigest(),new_page=slug!='weight-loss-blood-tests'))
(root/'draft-manifest.json').write_text(json.dumps(dict(prepared_at='2026-10-18',publication_authorized=False,articles=candidates),indent=2)+'\n')
page='''<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SHIFT Bloods — complete blog drafts</title><style>*{box-sizing:border-box}body{margin:0;background:#f1eee6;color:#22251e;font:18px/1.65 system-ui,sans-serif}header,article{max-width:850px;margin:auto;padding:50px 28px}header{background:#22281d;color:#f1eee6;max-width:none}header>div{max-width:794px;margin:auto}article{border-bottom:2px solid #707762}h1{font-size:2.3rem;line-height:1.15}h2{font-size:1.45rem;margin-top:2rem;line-height:1.3}h3{font-size:1.12rem}a{color:#435236;text-underline-offset:3px}header a{color:#eeeade}nav{display:flex;gap:14px;flex-wrap:wrap}.eyebrow,.note{font-size:.82rem}.eyebrow{letter-spacing:.1em;color:#526044}.note{border-top:1px solid #bbb;padding-top:15px}li{margin-bottom:10px}@media print{header{background:white;color:black}article{break-before:page}header a{color:black}}</style><header><div><div>SHIFT BLOODS · EDITORIAL REVIEW · 18 OCTOBER 2026</div><h1>Three complete launch articles</h1><p>Two new articles and a full replacement for the existing blood-test guide. These are review drafts, not live publications. Ordering stays closed; no device performance or clinical review is claimed.</p><nav><a href="#upper-arm-blood-collection">Collection</a><a href="#understanding-blood-test-results">Results</a><a href="#weight-loss-blood-tests-refresh">Existing article refresh</a></nav></div></header>'''+''.join(sections)+'</html>'
(root/'shift-bloods-blog-review.html').write_text(page)
print(json.dumps(candidates,indent=2))
