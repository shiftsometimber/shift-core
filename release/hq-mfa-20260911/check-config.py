"""Check the exact MFA dependency without exposing credentials or touching user records."""
import json, os, urllib.request, urllib.error

account=os.environ['CLOUDFLARE_ACCOUNT_ID']
base='https://api.cloudflare.com/client/v4/accounts/'+account
headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':'application/json'}
def api(path,body=None,method='GET'):
    request=urllib.request.Request(base+path,headers=headers,method=method,data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(request,timeout=35) as response: result=json.load(response)
    except urllib.error.HTTPError as error:
        raise SystemExit('Cloudflare request failed: HTTP '+str(error.code)) from None
    if not result.get('success'): raise SystemExit('Cloudflare request did not succeed')
    return result['result']

secrets=api('/workers/scripts/shift-core/secrets')
present=any(s.get('name')=='HQ_MFA_ENCRYPTION_KEY' for s in secrets)
deployments=api('/workers/scripts/shift-core/deployments')
latest=deployments.get('deployments',[])[0]
report={'worker':'shift-core','secret_name':'HQ_MFA_ENCRYPTION_KEY','secret_present':present,'deployment_id':latest.get('id'),'versions':latest.get('versions'),'mutation_performed':False}
if not present:
    data=api('/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query',{'sql':"SELECT COUNT(*) AS existing_mfa_records FROM hq_users WHERE mfa_enabled=1 OR (mfa_secret IS NOT NULL AND mfa_secret<>'')"},'POST')
    report['existing_mfa_records']=data[0]['results'][0]['existing_mfa_records']
print(json.dumps(report,sort_keys=True))
