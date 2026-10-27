"""Read-only capture of the two current owners for one scoped candidate."""
from pathlib import Path
import email,hashlib,json,re,sys,urllib.request,subprocess
root=Path.cwd();out=Path(sys.argv[1]).resolve()
assert not out.exists(),'Use the existing capture; inspect it before repeating.'
old=json.loads((root.parent/'support-service-release/provider-baseline.json').read_text())
token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M)[1]
workers='/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/'
def call(path):
    with urllib.request.urlopen(urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers={'Authorization':'Bearer '+token}),timeout=30) as r:return dict(r.headers),r.read()
def get(path):
    _,body=call(path);d=json.loads(body);assert d['success'];return d['result']
def capture(row,folder):
    worker=row['worker'];h,b=call(workers+worker+'/content/v2');ct=next(v for k,v in h.items() if k.lower()=='content-type');m=email.message_from_bytes(('Content-Type: '+ct+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+b);assert m.is_multipart()
    files={p.get_filename() or p.get_param('name',header='content-disposition'):p.get_payload(decode=True) for p in m.walk() if not p.is_multipart()}
    assert all('/' not in n and n not in ['.','..'] for n in files)
    folder.mkdir(parents=True)
    for n,v in files.items():(folder/n).write_bytes(v)
    return {'worker':worker,'deployment':get(workers+worker+'/deployments')['deployments'][0],'settings':get(workers+worker+'/settings'),'schedules':get(workers+worker+'/schedules'),'moduleHashes':{n:hashlib.sha256(v).hexdigest() for n,v in files.items()}}
out.mkdir(parents=True)
baseline=capture(old,out/'before');baseline['routePath']=old['routePath'];baseline['memberDocumentOwner']=capture(old['memberDocumentOwner'],out/'before-hq')
(out/'provider-baseline.json').write_text(json.dumps(baseline,indent=2)+'\n')
asset=subprocess.run(['curl','-fsS','--max-time','30','https://shiftsometimber.co.uk/assets/my-timber-layout.mjs'],capture_output=True,check=True)
(out/'live-layout-before.mjs').write_bytes(asset.stdout)
print(json.dumps({'state':'CAPTURED_CURRENT_OWNERS','workers':{baseline['worker']:baseline['deployment']['id'],baseline['memberDocumentOwner']['worker']:baseline['memberDocumentOwner']['deployment']['id']},'writesToProduction':0}))
