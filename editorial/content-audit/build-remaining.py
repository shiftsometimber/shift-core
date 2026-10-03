"""Scoped repairs against the exact published source, preserving unrelated bytes."""
import argparse, copy, gzip, hashlib, html, json, pathlib, re

BASE = 'e19a08cba5db493d7002269081aecedf03a35b2140132b4b85f2216aff1d9534'
def digest(b): return hashlib.sha256(b).hexdigest()
def entry(n,s):
    b=s.encode();return dict(path=n,sha256=digest(b),bytes=len(b))
def once(s,old,new):
    assert s.count(old)==1,(old,s.count(old));return s.replace(old,new,1)
def build(source,out):
    p=json.loads(gzip.decompress(source.read_bytes()));assert p['source_fingerprint']==BASE
    original=copy.deepcopy(p);entries={e['path']:e for e in p['files']};updates={};reports=[]
    specs=json.loads(pathlib.Path(__file__).with_name('remaining-guides.json').read_text())['articles']
    esc=html.escape
    for a in specs:
        name=a['path'];old=p['overrides'][name];assert entry(name,old)==entries[name]
        main=re.search(r'<main\b[^>]*>.*?</main>',old,re.S);assert main
        body='<div class="standard-layout"><h1>'+esc(a['title'])+'</h1><p class="byline-v12">Prepared by the Shift Some Timber Editorial Team. Sources checked 3 October 2026; this is not independent clinical review.</p><p class="standfirst">'+esc(a['intro'])+'</p>'
        for heading,content in a['sections']:
            body+='<h2>'+esc(heading)+'</h2>'
            body+=('<ul>'+''.join('<li>'+esc(t)+'</li>' for t in content)+'</ul>') if isinstance(content,list) else '<p>'+esc(content)+'</p>'
        body+='<section class="sourcebox"><h2>Sources and further reading</h2><ul>'+''.join('<li><a href="'+esc(url,quote=True)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a></li>' for label,url in a['sources'])+'</ul></section>'
        body+='<aside class="editorial-note-v2222"><h3>About this guide</h3><p>General information for adults, not a prescription or an individual assessment. Product information and your own clinician’s instructions take priority. This update replaces an incomplete guide with medicine-specific information and direct sources.</p></aside><section class="context-cta-v30c"><h2>Keep the everyday support going</h2><p>My Timber is free to use without a treatment purchase.</p><div class="actions"><a class="btn btn-primary" href="/member/dashboard">Open My Timber</a><a class="btn" href="/compare-weight-loss-treatments">Compare treatment options</a></div></section></div>'
        opening=re.match(r'<main\b[^>]*>',main[0])[0]
        new=old[:main.start()]+opening+body+'</main>'+old[main.end():]
        new=re.sub(r'<title>.*?</title>','<title>'+esc(a['title'])+' | Shift Some Timber</title>',new,flags=re.S)
        def meta(m):
            s=m[0]
            if re.search(r'(?:name|property)="(?:description|twitter:description|og:description)"',s):s=re.sub(r'content="[^"]*"','content="'+esc(a['intro'],quote=True)+'"',s)
            if re.search(r'(?:name|property)="(?:twitter:title|og:title)"',s):s=re.sub(r'content="[^"]*"','content="'+esc(a['title'],quote=True)+'"',s)
            return s
        new=re.sub(r'<meta\b[^>]*>',meta,new)
        def schema(m):
            data=json.loads(m[1])
            def visit(o):
                if isinstance(o,list):
                    for v in o:visit(v)
                elif isinstance(o,dict):
                    if o.get('@type') in ['Article','MedicalWebPage','WebPage']:
                        o['name']=a['title'];o['headline']=a['title'];o['description']=a['intro'];o['dateModified']='2026-10-03';o.pop('reviewedBy',None)
                        if 'author' in o:o['author']={'@type':'Organization','name':'Shift Some Timber Editorial Team','url':'https://shiftsometimber.co.uk/authors/shift-some-timber-editorial-team'}
                    for v in list(o.values()):visit(v)
            visit(data)
            return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>'
        new=re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',schema,new,flags=re.S)
        updates[name]=new

    changes={
      'privacy.html': [
        ('<li>Delete the account separately.</li>','<li>Request account deletion separately. Submitting the request signs you out of current sessions and sends it for review; it does not immediately erase every record. We will explain the outcome and any records that must be retained.</li>'),
        ('withdrawal stops new optional health-tracking entries under that consent-led flow.','withdrawal stops new optional health-tracking entries under that consent-led flow. Withdrawal and erasure are different: use the health-history erasure control if you also want to remove the supported optional history. Necessary consent and privacy records remain separate.'),
        ('<h2>Retention</h2>','<h2>Coaching and help requests</h2><p>The everyday My Timber coach stores the goals, routine details and feedback you confirm. Its fixed-action coaching does not send that saved coaching snapshot to a model. The separate Ask Timber question-and-answer service is a different feature. You can correct or erase coaching memory. Coaching audit and preparation history older than 90 days is pruned when the snapshot is next changed; this is not a nightly purge of inactive accounts. If you explicitly send a help request, its message enters the separate SHIFT support queue. Erasing coaching does not erase that support record.</p><h2>Retention</h2>')
      ],
      'privacy-centre.html': [('change cookie choices or delete the account.','change cookie choices or request account deletion. An account-deletion request goes for review and signs you out; receipt is not confirmation that all data has been erased.')],
      'data-governance.html': [('Account settings, rights request, account deletion','Account settings, rights request, account-deletion request and reviewed fulfilment'),('Provide export, deletion and consent controls.','Provide export, optional health-history erasure, account-deletion request and consent controls. Keep request receipt separate from completed erasure.')],
      'dpia-summary.html': [('Export, health-history erasure and account deletion controls.','Export, health-history erasure and account-deletion request controls. Account requests enter a review queue; receipt and sign-out do not establish completed deletion.')]
    }
    for name,edits in changes.items():
        new=p['overrides'][name]
        for before,after in edits:new=once(new,before,after)
        updates[name]=new
    for n,s in updates.items():
        old=p['overrides'][n]
        for tag in ['header','footer']:assert re.findall(r'<'+tag+r'\b.*?</'+tag+'>',s,re.S)==re.findall(r'<'+tag+r'\b.*?</'+tag+'>',old,re.S)
        assert re.findall(r'<script\b[^>]*src="[^"]*"[^>]*>.*?</script>',s,re.S)==re.findall(r'<script\b[^>]*src="[^"]*"[^>]*>.*?</script>',old,re.S)
        reports.append(dict(path=n,before=entries[n]['sha256'],after=entry(n,s)['sha256']))
        for folder,content in [('before',old),('after',s)]:
            target=out/folder/n;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
    integrity=json.loads(p['overrides']['release-body-integrity.json'])
    for n,s in updates.items():integrity[n]=digest(s.split('</head>',1)[1].encode())
    updates['release-body-integrity.json']=json.dumps({n:integrity[n] for n in sorted(integrity)},indent=2)+'\n'
    fp=json.loads(p['overrides']['DEPLOYMENT-FINGERPRINT.json']);fpe={e['path']:e for e in fp['files']}
    for n,s in updates.items():fpe[n]=entry(n,s)
    fp['files']=[fpe[n] for n in sorted(fpe)];fp['file_count']=len(fp['files']);fp['aggregate_sha256']=digest(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode())
    updates['DEPLOYMENT-FINGERPRINT.json']=json.dumps(fp,indent=2)+'\n'
    for n,s in updates.items():p['overrides'][n]=s;entries[n]=entry(n,s)
    expected={a['path'] for a in specs}|set(changes)|{'release-body-integrity.json','DEPLOYMENT-FINGERPRINT.json'}
    assert set(updates)==expected
    assert all(entries[e['path']]==e for e in original['files'] if e['path'] not in updates)
    p['files']=[entries[n] for n in sorted(entries)];p['baseline_fingerprint']=BASE;p['source_fingerprint']=fp['aggregate_sha256']
    packed=gzip.compress(json.dumps(p,ensure_ascii=False,separators=(',',':')).encode(),mtime=0);out.mkdir(parents=True,exist_ok=True)
    (out/'source.json.gz').write_bytes(packed)
    (out/'control.json').write_text(json.dumps(dict(mode='preview',expected_live_fingerprint=BASE,source_fingerprint=p['source_fingerprint'],payload_sha256=digest(packed),preview_browser_checks_passed=False),indent=2))
    proof=dict(baseline=BASE,candidate=p['source_fingerprint'],changedFiles=sorted(updates),preservedFiles=len(entries)-len(updates),reports=reports)
    (out/'proof.json').write_text(json.dumps(proof,indent=2));print(json.dumps(proof))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=pathlib.Path,required=True);parser.add_argument('--out',type=pathlib.Path,required=True);args=parser.parse_args();build(args.source,args.out)
