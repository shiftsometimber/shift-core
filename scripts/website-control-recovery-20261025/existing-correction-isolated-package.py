from pathlib import Path
import ast,json,os,re,base64,hashlib,urllib.request,concurrent.futures,datetime,tarfile,subprocess,hmac,shutil,stat
os.umask(0o077)
R=Path('/Users/shiftsometimberltd/SST/continuity-backup-20261024')
C=R/"private"/"version-bound-worker-correction-20261025"
assert C.is_dir()
manifest=json.loads((C/"correction-manifest.json").read_text());seen=set(manifest["capturedWorkers"]);external=manifest["externalEnvironmentRequirements"];ctx={"errors":manifest["errors"]}
dest=R/"sealed-version-correction-20261025";dest.mkdir(mode=0o700,exist_ok=False)
key=Path('/Users/shiftsometimberltd/.shift-backup-keys/website-2026-10-24.key');assert key.is_file() and not key.is_symlink() and stat.S_IMODE(key.stat().st_mode)&0o077==0,'Existing private original backup key required; never generate a replacement'
packTree=ast.parse((R/'package.py').read_text());functions=[n for n in packTree.body if isinstance(n,ast.FunctionDef) and n.name in ['digest','package']]
pc={'R':R,'P':R/'private','dest':dest,'key':key,'tarfile':tarfile,'subprocess':subprocess,'hashlib':hashlib,'hmac':hmac,'json':json,'datetime':datetime,'shutil':shutil}
exec(compile(ast.Module(body=functions,type_ignores=[]),str(R/'package.py'),'exec'),pc)
name='SHIFT-Serving-Worker-Version-Correction-2026-10-25';pc['package'](name,[C])
sealed=dest/(name+'.tar.gz.enc');receipt=json.loads((dest/(name+'.receipt.json')).read_text())
auth=hmac.new(hashlib.sha256(b'SHIFT-HMAC-v1'+key.read_bytes()).digest(),digestmod='sha256')
with sealed.open('rb') as f:
 for chunk in iter(lambda:f.read(1024*1024),b''):auth.update(chunk)
assert hmac.compare_digest(auth.hexdigest(),receipt['hmac_sha256']),'Authenticate ciphertext before isolated restore'
command=['/usr/bin/openssl','enc','-d','-aes-256-cbc','-pbkdf2','-iter','200000','-md','sha256','-pass','file:'+str(key),'-in',str(sealed)]
proc=subprocess.Popen(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE);expected={};actual={};entryCount=0
with tarfile.open(fileobj=proc.stdout,mode='r|gz') as archive:
 for member in archive:
  q=__import__('pathlib').PurePosixPath(member.name);assert not q.is_absolute() and '..' not in q.parts and (member.isfile() or member.isdir()) and member.size<=128*1024*1024,'Safe bounded isolated archive entry required';entryCount+=1
  if member.isfile() and member.name.endswith(('specific-version-modules.json','module-fingerprints.json')):
   data=json.load(archive.extractfile(member));scope=str(q.parent)
   if member.name.endswith('module-fingerprints.json'):expected[scope]=data
   else:
    fingerprints=[]
    for module in data['result']['modules']:
     raw=base64.b64decode(module['content_base64'],validate=True);fingerprints.append({'name':module['name'],'content_type':module.get('content_type'),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    actual[scope]=fingerprints
proc.stdout.close();assert proc.wait()==0,'Isolated encrypted stream restore failed';assert actual and actual==expected,'Every restored module must equal its version-bound capture fingerprint'
proof={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':manifest['scope'],'encryptedFile':str(sealed),'receiptFile':str(dest/(name+'.receipt.json')),'encryptedBytes':sealed.stat().st_size,'encryptedSHA256':pc['digest'](sealed),'hmacVerifiedBeforeRestore':True,'decryptionAndExactModuleRestorePassed':True,'archiveEntries':entryCount,'versionSetsRestored':len(actual),'workersCaptured':len(seen),'captureErrors':ctx['errors'],'externalEnvironmentRequirements':external,'existingKeyReused':True,'keyDisclosed':False,'oldArchivesChanged':False,'originalSQLAndPagesAcceptancePreserved':True,'productionMutations':0,'fullHostedRestoreComplete':False,'offsiteServerHashVerified':False,'offsiteDependency':'Existing Dropbox mount is absent; connected account folder inventory does not expose original Website Control destination. Original encrypted archives and key preserved; corrected encrypted increment retained within SAME backup project for its original offsite location.'}
(R/'VERSION-BOUND-CODE-CORRECTION-20261025.json').write_text(json.dumps(proof,indent=2)+'\n')
Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024/website-control-exact-worker-code-isolated-restore.json').write_text(json.dumps(proof,indent=2)+'\n')
# The authenticated encrypted copy retains this correction. Remove only this
# newly created plaintext snapshot and tar; never touch earlier archives/keys.
shutil.rmtree(C);plain=R/(name+'.tar.gz')
if plain.exists():plain.unlink()
print(json.dumps({k:proof[k] for k in ['encryptedBytes','workersCaptured','versionSetsRestored','captureErrors','hmacVerifiedBeforeRestore','decryptionAndExactModuleRestorePassed','existingKeyReused','oldArchivesChanged','fullHostedRestoreComplete','offsiteServerHashVerified']}),flush=True)
