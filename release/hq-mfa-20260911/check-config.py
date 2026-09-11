"""Check the exact MFA dependency without exposing credentials or touching user records."""
import json, os, secrets as random_secrets, urllib.request, urllib.error

account=os.environ['CLOUDFLARE_ACCOUNT_ID']
base='https://api.cloudflare.com/client/v4/accounts/'+account
headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':'application/json'}
def api(path,body=None,method='GET'):
    request_headers=dict(headers)
    if method=='PATCH': request_headers['Content-Type']='application/merge-patch+json'
    request=urllib.request.Request(base+path,headers=request_headers,method=method,data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(request,timeout=35) as response: result=json.load(response)
    except urllib.error.HTTPError as error:
        try: codes=[e.get('code') for e in json.load(error).get('errors',[])]
        except Exception: codes=[]
        raise SystemExit('Cloudflare request failed: HTTP '+str(error.code)+'; codes='+json.dumps(codes)+'; endpoint='+path) from None
    if not result.get('success'): raise SystemExit('Cloudflare request did not succeed')
    return result['result']

deployments=api('/workers/scripts/shift-core/deployments')
latest=deployments.get('deployments',[])[0]
assert len(latest['versions'])==1 and latest['versions'][0]['percentage']==100, 'Unexpected active traffic split'
active=api('/workers/scripts/shift-core/versions/'+latest['versions'][0]['version_id'])
present=any(b.get('name')=='HQ_MFA_ENCRYPTION_KEY' for b in active['resources']['bindings'])
report={'worker':'shift-core','secret_name':'HQ_MFA_ENCRYPTION_KEY','secret_present':present,'deployment_id':latest.get('id'),'versions':latest.get('versions'),'mutation_performed':False}
if not present:
    data=api('/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query',{'sql':"SELECT COUNT(*) AS existing_mfa_records FROM hq_users WHERE mfa_enabled=1 OR (mfa_secret IS NOT NULL AND mfa_secret<>'')"},'POST')
    report['existing_mfa_records']=data[0]['results'][0]['existing_mfa_records']
print(json.dumps(report,sort_keys=True))

if os.environ.get('APPLY_MISSING_MFA_SECRET')=='true':
    if present:
        print('No change: MFA encryption secret already exists. It will not be replaced.')
        raise SystemExit(0)
    assert report['existing_mfa_records']==0, 'Existing MFA records require recovery of the original key'
    expected='9c3cd9d1-deb2-4fc8-8973-0616915e84a5'
    assert latest['versions']==[{'percentage':100,'version_id':expected}], 'Active Worker version changed'
    versions=api('/workers/scripts/shift-core/versions')
    before=api('/workers/scripts/shift-core/versions/'+expected)
    newest_id=versions['items'][0]['id']
    newest=api('/workers/scripts/shift-core/versions/'+newest_id)
    def runtime_identity(version):
        resources=version['resources']
        return {'etag':resources['script'].get('etag'),'runtime':resources.get('script_runtime'),'bindings':sorted([b for b in resources.get('bindings',[]) if b.get('name')!='HQ_MFA_ENCRYPTION_KEY'],key=lambda b:b['name'])}
    equivalent=runtime_identity(before)==runtime_identity(newest)
    print(json.dumps({'active_version':expected,'latest_upload':newest_id,'identical_code_runtime_bindings':equivalent},sort_keys=True))
    assert equivalent, 'Latest upload differs from the active Worker; refuse accidental promotion'
    etag=before['resources']['script']['etag']
    assert etag, 'Cannot establish current script identity'
    # The key exists only in process memory and the encrypted Cloudflare binding.
    # No secret value is printed, committed, returned or saved as an artifact.
    if any(b.get('name')=='HQ_MFA_ENCRYPTION_KEY' for b in newest['resources']['bindings']):
        candidate_id=newest_id
    else:
        value=random_secrets.token_urlsafe(48)
        result=api('/workers/workers/shift-core/versions/latest',{'env':{'HQ_MFA_ENCRYPTION_KEY':{'text':value,'type':'secret_text'}},'annotations':{'workers/message':'Add missing HQ MFA encryption key; preserve live code'}},'PATCH')
        del value
        candidate_id=result.get('id')
    assert candidate_id, 'Candidate version was not returned'
    candidate=api('/workers/scripts/shift-core/versions/'+candidate_id)
    identity=runtime_identity(candidate)
    bindings=candidate['resources']['bindings']
    assert isinstance(bindings,list), 'Unexpected binding representation'
    new_binding=[b for b in bindings if b.get('name')=='HQ_MFA_ENCRYPTION_KEY']
    assert len(new_binding)==1 and new_binding[0].get('type')=='secret_text', 'Encrypted secret binding missing'
    print(json.dumps({'candidate_version':candidate_id,'code_equal':identity['etag']==runtime_identity(before)['etag'],'runtime_equal':identity['runtime']==runtime_identity(before)['runtime'],'other_bindings_equal':identity['bindings']==runtime_identity(before)['bindings']},sort_keys=True))
    assert identity==runtime_identity(before), 'Candidate differs beyond the MFA secret; no deployment'
    still_live=api('/workers/scripts/shift-core/deployments')['deployments'][0]
    assert still_live['versions']==latest['versions'], 'Production moved during preparation; no deployment'
    api('/workers/scripts/shift-core/deployments',{'strategy':'percentage','versions':[{'version_id':candidate_id,'percentage':100}],'annotations':{'workers/message':'Enable HQ MFA configuration with unchanged Worker code'}},'POST')
    after_deployment=api('/workers/scripts/shift-core/deployments')['deployments'][0]
    assert len(after_deployment['versions'])==1 and after_deployment['versions'][0]['percentage']==100, 'Unexpected traffic split after secret update'
    after_id=after_deployment['versions'][0]['version_id']
    after=api('/workers/scripts/shift-core/versions/'+after_id)
    assert after['resources']['script']['etag']==etag, 'Worker code identity changed unexpectedly'
    remaining=after['resources']['bindings']
    assert any(s.get('name')=='HQ_MFA_ENCRYPTION_KEY' for s in remaining), 'Secret is not present after update'
    print(json.dumps({'status':'PASS','worker':'shift-core','secret_added':'HQ_MFA_ENCRYPTION_KEY','before_version':expected,'after_version':after_id,'script_etag_unchanged':etag,'user_records_changed':False,'secret_value_logged':False},sort_keys=True))
