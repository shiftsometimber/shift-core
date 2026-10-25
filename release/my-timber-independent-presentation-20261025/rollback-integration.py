"""Run only for an authorised rollback of this exact presentation correction.
No Core, routes, bindings, schedules, communication or database operations.
Refuses if either Worker has advanced beyond the recorded correction.
"""
from pathlib import Path
import json,re,urllib.request,datetime
p=Path('/Users/shiftsometimberltd/SST/my-timber-independent-presentation-20261025')
receipt=json.loads((p/'integration-deployment.json').read_text())
output=p/'integration-rollback-execution.json'
assert not output.exists(),'Inspect existing rollback receipt before doing anything'
token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M)[1]
base='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/'
def call(name,suffix,method='GET',payload=None):
 data=json.dumps(payload).encode() if payload is not None else None
 request=urllib.request.Request(base+name+suffix,data=data,method=method,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 with urllib.request.urlopen(request,timeout=60)as response:body=json.load(response)
 assert body['success'],body.get('errors')
 return body['result']
for name,row in receipt['workers'].items():
 assert call(name,'/deployments')['deployments'][0]['id']==row['deployment']['id'],'Newer deployment exists: stop'
 assert call(name,'/settings')==row['settingsBefore']
 assert call(name,'/schedules')==row['schedulesBefore']
state={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'workers':{},'state':'ROLLBACK_STARTED_DO_NOT_REPLAY'}
output.write_text(json.dumps(state,indent=2))
for name,row in receipt['workers'].items():
 target=row['priorDeployment']['versions']
 result=call(name,'/deployments','POST',{'strategy':'percentage','versions':target,'annotations':{'workers/message':'Rollback exact My Timber integration correction to preserved predecessor'}})
 after=call(name,'/deployments')['deployments'][0]
 assert after['versions']==target
 state['workers'][name]={'deployment':after,'restoredExactPriorVersion':True}
 output.write_text(json.dumps(state,indent=2))
state['state']='ROLLED_BACK_TO_EXACT_PRIOR_PRESENTATION';output.write_text(json.dumps(state,indent=2))
print(state['state'])
