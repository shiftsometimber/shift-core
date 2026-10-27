"""Finite live acceptance setup. Synthetic accounts only; never send invitations.

Credentials stay in a mode-0600 local file. No member data or credentials are printed.
The HQ test role has no normal HQ permissions and is accepted only by the scoped
support handler, which additionally restricts it to synthetic-account threads.
"""
from pathlib import Path
import datetime, hashlib, json, os, re, secrets, sys, urllib.request

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT.parent
STATE = BASE / 'v6-live-acceptance'
ACCOUNT_ID = '9e5386dcf455be34c582d93f8bfc79e6'
TAG = 'my_timber_release_test_v6'
EMAILS = ['my-timber-v6-dan@example.invalid', 'my-timber-v6-lee@example.invalid','my-timber-v6-moderator@example.invalid','my-timber-v6-review@example.invalid']
HQ_EMAIL = 'my-timber-v6-operator@example.invalid'
token = re.search(r'^oauth_token\s*=\s*"([^"]+)"', Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(), re.M)[1]
baseline = json.loads((BASE / 'support-service-release/provider-baseline.json').read_text())
bindings = baseline['settings']['bindings']
database = next(x['id'] for x in bindings if x['type'] == 'd1' and x['name'] == 'DB')

def query(sql, params=()):
    body = json.dumps({'sql': sql, 'params': list(params)}).encode()
    req = urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{database}/query', data=body, method='POST', headers={'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.load(response)
    if not data.get('success') or any(not r.get('success', True) for r in data.get('result', [])):
        raise RuntimeError('Synthetic account database operation failed')
    return data['result'][0].get('results', [])

if sys.argv[1:] == ['inspect']:
    print(json.dumps({name: query('PRAGMA table_info('+name+')') for name in ['users','user_auth','user_sessions','member_status','member_state','consents','hq_users','hq_sessions']}, indent=2))
    raise SystemExit
if sys.argv[1:] == ['reset']:
    for email in EMAILS[:2]:
        rows=query('SELECT u.id,m.source FROM users u JOIN member_status m ON m.user_id=u.id WHERE u.email=?',[email])
        if len(rows)!=1 or rows[0]['source']!=TAG:
            raise RuntimeError('Only reserved synthetic fixtures may be reset')
        query("UPDATE member_state SET preferences=json_remove(preferences,'$.lifeBack') WHERE user_id=? AND EXISTS(SELECT 1 FROM member_status m WHERE m.user_id=member_state.user_id AND m.source=?)",[rows[0]['id'],TAG])
    print(json.dumps({'state':'ONLY_SYNTHETIC_LIFE_BACK_FIXTURES_RESET','realMemberWrites':0}))
    raise SystemExit
if sys.argv[1:] != ['prepare']:
    raise SystemExit('Use inspect, prepare or reset')
STATE.mkdir(mode=0o700, exist_ok=True)
os.chmod(STATE, 0o700)
credential_path = STATE / 'synthetic-sessions.json'
old = json.loads(credential_path.read_text()) if credential_path.exists() else {}
at = datetime.datetime.now(datetime.timezone.utc)
expires = (at + datetime.timedelta(hours=12)).isoformat()
accounts = []
for name, email in zip(['Dan','Lee','Fictional moderator','Programme review'], EMAILS):
    rows = query('SELECT u.id,u.email,m.source FROM users u LEFT JOIN member_status m ON m.user_id=u.id WHERE u.email=?', [email])
    if rows and rows[0]['source'] != TAG:
        raise RuntimeError('Reserved test address belongs to an unrecognised account; no mutation made')
    if not rows:
        query('INSERT INTO users(email,first_name,last_name,created_at,updated_at) VALUES(?,?,?,?,?)', [email,name,'Fictional release test',at.isoformat(),at.isoformat()])
        uid = query('SELECT id FROM users WHERE email=?', [email])[0]['id']
        query('INSERT INTO member_status(user_id,lifecycle_stage,membership_status,source,created_at,updated_at) VALUES(?,?,?,?,?,?)', [uid,'registered','none',TAG,at.isoformat(),at.isoformat()])
        query('INSERT INTO member_state(user_id,preferences,updated_at) VALUES(?,?,?)', [uid,'{}',at.isoformat()])
    else:
        uid = rows[0]['id']
    query('UPDATE users SET date_of_birth=? WHERE id=? AND email=?', ['1990-01-01',uid,email])
    if not query('SELECT id FROM user_auth WHERE user_id=?',[uid]):
        query('INSERT INTO user_auth(user_id,password_hash,email_verified,email_verified_at,created_at,updated_at) VALUES(?,?,1,?,?,?)',[uid,'disabled-synthetic-login-'+secrets.token_hex(32),at.isoformat(),at.isoformat(),at.isoformat()])
    previous = next((x for x in old.get('members',[])+([old['moderator']] if old.get('moderator') else [])+([old['review']] if old.get('review') else []) if x.get('id')==uid), None)
    session = previous['token'] if previous else secrets.token_urlsafe(40)
    digest = hashlib.sha256(session.encode()).hexdigest()
    query('INSERT INTO user_sessions(user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL', [uid,digest,expires,at.isoformat()])
    accounts.append({'id':uid,'name':name,'email':email,'token':session,'source':TAG})
rows = query('SELECT id,email,role FROM hq_users WHERE email=?', [HQ_EMAIL])
if rows and rows[0]['role'] != 'support_test':
    raise RuntimeError('Reserved HQ test address has an unexpected role; no HQ mutation made')
if not rows:
    query('INSERT INTO hq_users(email,name,password_hash,role,status,mfa_enabled,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)', [HQ_EMAIL,'My Timber automated test operator','disabled-test-login-'+secrets.token_hex(32),'support_test','active',0,at.isoformat(),at.isoformat()])
    rows = query('SELECT id,email,role FROM hq_users WHERE email=?', [HQ_EMAIL])
hq = rows[0]
session = old.get('hq',{}).get('token') or secrets.token_urlsafe(40)
digest = hashlib.sha256(session.encode()).hexdigest()
query('INSERT INTO hq_sessions(hq_user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL', [hq['id'],digest,expires,at.isoformat()])
# Install only the isolated test namespace. The real community remains disabled.
schema=(ROOT/'member-experience/timber-shed-forums.sql').read_text()+(ROOT/'member-experience/timber-shed-private.sql').read_text()
import subprocess
schema+=subprocess.check_output(['node','--input-type=module','-e',"import {shedSupportSchema} from './member-experience/shed-support-loop.mjs';process.stdout.write(shedSupportSchema)"],cwd=ROOT,text=True)
query(re.sub(r'\btimber_shed_', 'timber_shed_v6test_',schema))
query('INSERT OR IGNORE INTO timber_shed_v6test_forum_moderators(user_id,active,created_at) VALUES(?,1,?)',[accounts[2]['id'],at.isoformat()])
data={'tag':TAG,'expiresAt':expires,'members':accounts[:2],'moderator':accounts[2],'review':accounts[3],'hq':{**hq,'token':session},'communicationsSent':0}
fd=os.open(credential_path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
with os.fdopen(fd,'w') as stream:
    json.dump(data,stream)
print(json.dumps({'state':'SYNTHETIC_ACCOUNTS_PREPARED','members':[{'id':x['id'],'name':x['name']} for x in accounts],'hqRole':'support_test','expiresAt':expires,'credentialsPrinted':False,'communicationsSent':0}))
