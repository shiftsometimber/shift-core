"""Prepare normal password login for one already-authorised fictional account.
No invitation, email, real account or staff permission is created.
"""
from pathlib import Path
import base64, datetime, hashlib, json, os, re, secrets, urllib.request

root=Path(__file__).resolve().parent.parent
folder=root.parent/'v6-live-acceptance'
email='my-timber-v6-dan@example.invalid'
tag='my_timber_release_test_v6'
token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M)[1]
baseline=json.loads((root.parent/'support-service-release/provider-baseline.json').read_text())
database=next(x['id'] for x in baseline['settings']['bindings'] if x['name']=='DB' and x['type']=='d1')
def query(sql,params):
    body=json.dumps({'sql':sql,'params':params}).encode()
    request=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/d1/database/'+database+'/query',data=body,method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=30) as response:data=json.load(response)
    assert data['success'] and data['result'][0]['success'],'Test-account operation failed'
    return data['result'][0].get('results',[])
rows=query('SELECT u.id,m.source,a.email_verified FROM users u JOIN member_status m ON m.user_id=u.id JOIN user_auth a ON a.user_id=u.id WHERE u.email=?',[email])
assert len(rows)==1 and rows[0]['source']==tag and rows[0]['email_verified']==1,'Reserved, verified fictional account required'
uid=rows[0]['id'];file=folder/'manual-review-access.json'
previous=json.loads(file.read_text()) if file.exists() else {}
password=previous.get('password') if previous.get('userId')==uid and previous.get('email')==email else 'Timber-Review7-'+secrets.token_urlsafe(18)
salt=secrets.token_bytes(16);derived=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,100000)
encode=lambda value:base64.urlsafe_b64encode(value).decode().rstrip('=')
hashed='pbkdf2$100000$'+encode(salt)+'$'+encode(derived)
at=datetime.datetime.now(datetime.timezone.utc).isoformat()
query('UPDATE user_auth SET password_hash=?,failed_login_attempts=0,locked_until=NULL,updated_at=? WHERE user_id=? AND EXISTS(SELECT 1 FROM member_status m JOIN users u ON u.id=m.user_id WHERE m.user_id=user_auth.user_id AND m.source=? AND u.email=?)',[hashed,at,uid,tag,email])
assert query('SELECT password_hash FROM user_auth WHERE user_id=?',[uid])[0]['password_hash']==hashed
data={'userId':uid,'email':email,'password':password,'preparedAt':at,'loginURL':'https://shiftsometimber.co.uk/member/dashboard#today','fictionalSharedReviewAccount':True,'useInventedInformationOnly':True}
fd=os.open(file,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
with os.fdopen(fd,'w') as stream:json.dump(data,stream)
os.chmod(file,0o600)
print(json.dumps({'state':'SYNTHETIC_REVIEW_LOGIN_PREPARED','email':email,'realAccountsCreated':0,'staffPermissionsGranted':0,'passwordPrinted':False,'communicationsSent':0}))
