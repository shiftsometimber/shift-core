#!/usr/bin/env python3
"""One-shot compatible schema preparation. Never a Worker publisher or delivery replay."""
from pathlib import Path
import datetime, hashlib, json, re, sqlite3, subprocess, sys, urllib.request, urllib.error
ROOT=Path('/Users/shiftsometimberltd/SST')
E=ROOT/'release-recovery-evidence-20261024'
REPO=ROOT/'my-timber-joined-2daf-20261025'
SOURCE='f8f05127c6578a8e9f040e6275d431348b102db6'
MAIN_TREE='6ee5b2df4ec3b69ef51bb02de53da5a41288e06d'
CANDIDATE='8ad691488cd003c899f4c8cfbb7439a97f8a3e49'
TREE='533599af22e5f673bc82a3075f75d1b064e8dffd'
RUN=40188985851
JOB=121155798159
VERSION='ac4e60d9-6f40-4bd5-a96f-83d6108dd716'
DEPLOYMENT='486b4ea3-4fe5-4e79-9792-c67bac1155fe'
ACCOUNT='9e5386dcf455be34c582d93f8bfc79e6'
DATABASE='88f40aed-cb23-4372-8c94-8a73f48bc847'
MODE=sys.argv[1] if len(sys.argv)==2 else None
assert MODE in ['--prepare','--apply']
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def git(*args):return subprocess.run(['git',*args],cwd=REPO,capture_output=True,check=True,timeout=30).stdout
assert git('rev-parse','HEAD').decode().strip()==CANDIDATE
assert git('rev-parse','HEAD^{tree}').decode().strip()==TREE
credentials=subprocess.run(['git','credential','fill'],cwd=ROOT/'my-timber-recording-preflight-20261024',input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,check=True,timeout=15)
gh_token=dict(l.split('=',1) for l in credentials.stdout.splitlines() if '=' in l)['password']
cfg=Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text()
cf_token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',cfg,re.M).group(1)
def request(url,token,body=None):
    headers={'Authorization':'Bearer '+token,'Accept':'application/json','Cache-Control':'no-cache'}
    if body is not None:headers['Content-Type']='application/json'
    req=urllib.request.Request(url,data=None if body is None else json.dumps(body).encode(),headers=headers)
    try:
        with urllib.request.urlopen(req,timeout=40) as r:return json.load(r)
    except urllib.error.HTTPError as err:
        raise RuntimeError('Provider read/write failed HTTP '+str(err.code)) from None
def gh(path):return request('https://api.github.com/repos/shiftsometimber/shift-core/'+path,gh_token)
def cf(path,body=None):
    d=request('https://api.cloudflare.com/client/v4/'+path,cf_token,body)
    assert d.get('success'),'Cloudflare operation failed'
    return d['result']
def query(sql,params=[]):
    r=cf('accounts/'+ACCOUNT+'/d1/database/'+DATABASE+'/query',{'sql':sql,'params':params})
    assert len(r)==1 and r[0]['success']
    return r[0]
def ownership():
    main=gh('git/ref/heads/main')['object']['sha'];assert main==SOURCE,'Current main changed; preserve newer source'
    assert gh('git/commits/'+SOURCE)['tree']['sha']==MAIN_TREE,'Current main tree differs from pinned immutable input'
    job=gh('actions/jobs/'+str(JOB));assert job['run_id']==RUN
    assert job['status']=='completed' and job['conclusion']=='cancelled','Retired pre-upload run changed; re-evaluate current owner'
    live=cf('accounts/'+ACCOUNT+'/workers/scripts/shift-core/deployments')['deployments']
    live=max(live,key=lambda d:d['created_on'])
    assert live['id']==DEPLOYMENT and live['versions']==[{'version_id':VERSION,'percentage':100}],'Serving Core owner changed; do not mutate against stale ownership'
    return {'main':main,'tree':MAIN_TREE,'approvedSchemaCandidateTree':TREE,'run':RUN,'retiredRunConclusion':job['conclusion'],'deployment':DEPLOYMENT,'version':VERSION}
prep=json.loads((E/'owned-delivery-schema-preparation-20261025.json').read_text())
specs=prep['sources'];statements=prep['schemaStatements'];assert len(specs)==len(statements)==3
tables=['commerce_service_delivery','commerce_receipt_delivery','auth_delivery_event_links']
assert [x['table'] for x in specs]==tables
assert [x['table'] for x in statements]==tables
for spec,statement in zip(specs,statements):
    current=git('show',CANDIDATE+':'+spec['path'])
    assert hashlib.sha1(b'blob '+str(len(current)).encode()+b'\0'+current).hexdigest()==spec['sourceBlob'],'Actual approved schema module changed'
    assert hashlib.sha256(statement['sql'].encode()).hexdigest()==spec['sqlSHA256'],'Prepared SQL changed'
    assert statement['sql'].startswith('CREATE TABLE IF NOT EXISTS '+statement['table'])
    safe=statement['sql'].replace('ON DELETE CASCADE','')
    assert not re.search(r';|\b(?:INSERT|UPDATE|DELETE|DROP|ALTER|TRIGGER)\b',safe,re.I),'Only exact additive table creation allowed'
# Match each exact schema module in current main, in addition to the retained approved native object.
for spec in specs:
    current=gh('contents/'+spec['path']+'?ref='+SOURCE)
    assert current['sha']==spec['sourceBlob'],'Current main schema source changed; no stale table application'
serving=(E/'serving-core-ac4e60d9-rollback-worker.js').read_bytes()
assert hashlib.sha256(serving).hexdigest()=='a3a1ba0bff57832793bb4d23efaa991da2ccdb34e496de79dc7e5469863df550'
assert b'commerce_service_delivery' not in serving and b'auth_delivery_event_links' not in serving
old_sql=re.search(rb'CREATE TABLE IF NOT EXISTS commerce_receipt_delivery \([\s\S]+?\n  \)',serving).group().decode()
assert re.sub(r'\s+',' ',old_sql).strip()==statements[1]['sql'],'Serving receipt schema differs'
memory=sqlite3.connect(':memory:');memory.row_factory=sqlite3.Row
memory.execute('CREATE TABLE auth_delivery_events(id INTEGER PRIMARY KEY)')
for statement in statements:memory.execute(statement['sql'])
expected={t:{'fields':[dict(x) for x in memory.execute('PRAGMA table_info('+t+')')],'foreignKeys':[dict(x) for x in memory.execute('PRAGMA foreign_key_list('+t+')')]} for t in tables}
proof={'at':now(),'kind':'INDEPENDENT_COMPATIBLE_ADDITIVE_DELIVERY_SCHEMA_PREPARATION','guardChange':'Retired source-gate progress is not a dependency of three byte-exact additive compatible schemas. Current-main source identity, current serving owner, approved SQL and uniqueness/FK assertions remain enforced; no Core publication or acceptance waiver.','mode':MODE,'source':SOURCE,'run':RUN,'approvedSchemaSource':prep['approvedSchemaSource'],'servingCompatibility':{'version':VERSION,'modernVersionContentSHA256':'a3a1ba0bff57832793bb4d23efaa991da2ccdb34e496de79dc7e5469863df550','serviceAndAuthLinkTablesUnusedByServingRuntime':True,'receiptDDLAlreadyExactlyPresentInServingRuntime':True,'existingReceiptClaimsAndProcessedEventDeduplicationRetained':True},'newWorkerDeployed':False,'messagesSent':0,'eventsReplayed':0,'historicalRowsBackfilled':0,'financialOrMemberDML':0,'rollbackPolicy':'Retain additive tables; never DROP tables a later release may have used','sources':specs}
out=E/('compatible-delivery-ledgers-'+('application' if MODE=='--apply' else 'preparation')+'-20261025.json')
try:
    proof['beforeOwner']=ownership()
    proof['before']=query("SELECT name,sql FROM sqlite_master WHERE type='table' AND name IN (?,?,?)",tables)['results']
    assert query("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_delivery_events'")['results'],'Existing auth parent store required'
    # Record this finite D1-only action in the existing coordinator before mutation.
    if MODE=='--apply':
        p=E/'backend-completion-coordination.json';old=p.read_bytes();d=json.loads(old)
        prior=d.get('compatibleDeliveryLedgerPreparation',{})
        assert prior.get('state') not in ['APPLYING'],'Another owner is applying this preparation'
        d['compatibleDeliveryLedgerPreparation']={'at':now(),'owner':'Existing backend completion task','state':'APPLYING','source':SOURCE,'run':RUN,'tables':tables,'workerUpload':False,'externalMessages':0,'preservedOriginalPostDeploymentVerifier':True}
        assert p.read_bytes()==old,'Coordinator changed; preserve newer work';p.write_text(json.dumps(d,indent=2)+'\n')
        proof['applied']=[]
        for statement in statements:
            ownership()
            result=query(statement['sql'])
            assert result['meta']['changes']==0,'DDL unexpectedly changed business rows'
            table=statement['table']
            actual={'fields':query('PRAGMA table_info('+table+')')['results'],'foreignKeys':query('PRAGMA foreign_key_list('+table+')')['results']}
            assert actual==expected[table],'Existing schema differs; retain it and investigate'
            proof['applied'].append({'table':table,'sqlSHA256':hashlib.sha256(statement['sql'].encode()).hexdigest(),'schema':actual,'resultMeta':result['meta'],'retainedRows':query('SELECT COUNT(*) count FROM '+table)['results'][0]['count']})
        proof['afterOwner']=ownership()
        proof['verified']=True
        proof['productionStatus']='Three exact additive schemas installed and independently verified; Core handlers remain pending original guarded deployment'
    else:
        proof['prepared']=True;proof['productionMutations']=0
except Exception as err:
    proof['verified']=False;proof['error']=str(err);raise
finally:
    proof['finishedAt']=now();out.write_text(json.dumps(proof,indent=2)+'\n')
    if MODE=='--apply':
        p=E/'backend-completion-coordination.json';old=p.read_bytes();d=json.loads(old)
        d['compatibleDeliveryLedgerPreparation']={'at':now(),'owner':'Existing backend completion task','state':'VERIFIED' if proof.get('verified') else 'STOPPED_PRESERVE_APPLIED_TABLES','source':SOURCE,'run':RUN,'tables':tables,'receipt':str(out),'workerUpload':False,'externalMessages':0,'preservedOriginalPostDeploymentVerifier':True,'error':proof.get('error')}
        assert p.read_bytes()==old,'Coordinator changed; receipt retained separately';p.write_text(json.dumps(d,indent=2)+'\n')
    print(json.dumps({'mode':MODE,'prepared':proof.get('prepared'),'verified':proof.get('verified'),'error':proof.get('error'),'receipt':str(out)}))
