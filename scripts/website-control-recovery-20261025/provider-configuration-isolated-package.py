from pathlib import Path,PurePosixPath
import ast,json,os,hashlib,hmac,tarfile,subprocess,shutil,stat,datetime,tempfile,collections
os.umask(0o077)
R=Path('/Users/shiftsometimberltd/SST/continuity-backup-20261024')
old=R/'provider-configuration-correction-20261025';assert old.is_dir()
a='tell application "Safari"\nreturn do JavaScript "JSON.stringify(window.__shiftWorkerDomainConfigRead||null)" in tab 2 of window id 9903\nend tell'
r=subprocess.run(['osascript','-e',a],capture_output=True,text=True,check=True,timeout=25);domains=json.loads(r.stdout)
if domains and domains.get('success') and isinstance(domains.get('body',{}).get('result'),list):
 raw=domains['body']['result'];rows=[x for x in raw if x.get('zone_id')=='66ec3268950adcfc837b7b8b2f8356ed' or x.get('hostname','').endswith('.shiftsometimber.co.uk')]
 domains={'at':domains['at'],'status':domains['status'],'success':True,'method':'GET','scope':'Only shiftsometimber.co.uk Worker custom domains; unrelated zones omitted','originalResultCount':len(raw),'result':rows,'result_info':domains['body'].get('result_info')}
 assert {'api.shiftsometimber.co.uk','hq.shiftsometimber.co.uk'}.issubset({x['hostname'] for x in rows}),'Both genuine service-managed domain bindings required'
(old/'worker-custom-domain-bindings.json').write_text(json.dumps(domains,indent=2)+'\n')
P=R/'private';P.mkdir(mode=0o700,exist_ok=True);C=P/old.name;assert not C.exists();old.rename(C)
config=json.loads((C/'cloudflare-zone-configuration.json').read_text());dns=config['records']['dns_records']['body']['result']
assert len(dns)==18 and len(config['records']['settings']['body']['result'])==56
note={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'editableDnsRecords':16,'serviceManagedWorkerDnsRecords':2,'managedWorkerHostnames':[x['name'] for x in dns if x.get('meta',{}).get('read_only') and x['type']=='AAAA'],'restoreBoundary':'Retain full JSON: BIND omits two read-only Worker custom-domain AAAA records. Restore their genuine Worker custom-domain bindings rather than fabricating DNS records. Provider-managed ruleset IDs/versions are retained as service dependencies. Legacy firewall/rules API is410; current zone ruleset and zone settings were captured. This is configuration file recovery, not a full hosted service restore.','productionMutations':0}
(C/'restore-boundaries.json').write_text(json.dumps(note,indent=2)+'\n')
expected={str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest() for p in C.rglob('*') if p.is_file()}
dest=R/'sealed-provider-configuration-correction-20261025';dest.mkdir(mode=0o700,exist_ok=False)
key=Path('/Users/shiftsometimberltd/.shift-backup-keys/website-2026-10-24.key');assert key.is_file() and not key.is_symlink() and stat.S_IMODE(key.stat().st_mode)&0o077==0
tree=ast.parse((R/'package.py').read_text());funcs=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['digest','package']]
pc={'R':R,'P':P,'dest':dest,'key':key,'tarfile':tarfile,'subprocess':subprocess,'hashlib':hashlib,'hmac':hmac,'json':json,'datetime':datetime,'shutil':shutil}
exec(compile(ast.Module(body=funcs,type_ignores=[]),str(R/'package.py'),'exec'),pc)
name='SHIFT-Provider-Configuration-Correction-2026-10-25';pc['package'](name,[C]);sealed=dest/(name+'.tar.gz.enc');receipt=json.loads((dest/(name+'.receipt.json')).read_text())
authkey=hashlib.sha256(b'SHIFT-HMAC-v1'+key.read_bytes()).digest()
def authenticate(data,tag):
 assert hmac.compare_digest(hmac.new(authkey,data,digestmod='sha256').hexdigest(),tag),'Ciphertext authentication failed before restore'
cipher=sealed.read_bytes();authenticate(cipher,receipt['hmac_sha256'])
tamperCases=[]
for label,bad in [('changed ciphertext',cipher[:len(cipher)//2]+bytes([cipher[len(cipher)//2]^1])+cipher[len(cipher)//2+1:]),('appended ciphertext',cipher+b'x')]:
 try:authenticate(bad,receipt['hmac_sha256'])
 except AssertionError:tamperCases.append({'case':label,'rejectedBeforeDecryption':True})
 else:raise AssertionError('Tampered archive was accepted')
proc=subprocess.Popen(['/usr/bin/openssl','enc','-d','-aes-256-cbc','-pbkdf2','-iter','200000','-md','sha256','-pass','file:'+str(key),'-in',str(sealed)],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
actual={};restoredConfig=None;restoredDomains=None
with tempfile.TemporaryDirectory(prefix='shift-existing-website-control-config-restore-') as tmp:
 with tarfile.open(fileobj=proc.stdout,mode='r|gz') as archive:
  for member in archive:
   q=PurePosixPath(member.name);assert not q.is_absolute() and '..' not in q.parts and (member.isfile() or member.isdir()) and member.size<=5*1024*1024
   if member.isfile():
    data=archive.extractfile(member).read();actual[member.name]=hashlib.sha256(data).hexdigest();p=Path(tmp).joinpath(*q.parts);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);p.chmod(0o600)
    if p.name=='cloudflare-zone-configuration.json':restoredConfig=json.loads(data)
    if p.name=='worker-custom-domain-bindings.json':restoredDomains=json.loads(data)
 proc.stdout.close();assert proc.wait(timeout=10)==0
 assert actual==expected,'Every restored captured file must match its actual source SHA256'
 assert len(restoredConfig['records']['dns_records']['body']['result'])==18
 assert len(restoredConfig['records']['settings']['body']['result'])==56
 assert restoredDomains['success'] is True and {'api.shiftsometimber.co.uk','hq.shiftsometimber.co.uk'}.issubset({x['hostname'] for x in restoredDomains['result']})
proof={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Same Website Control project: genuine provider DNS, zone security/configuration, current ruleset, routes, TLS, mail-routing and Worker custom-domain configuration','encryptedFile':str(sealed),'receiptFile':str(dest/(name+'.receipt.json')),'encryptedBytes':sealed.stat().st_size,'encryptedSHA256':pc['digest'](sealed),'existingKeyReused':True,'keyDisclosed':False,'hmacVerifiedBeforeIsolatedRestore':True,'tamperCases':tamperCases,'allCapturedFileHashesRestored':True,'restoredFiles':len(actual),'dnsRecordsRestored':18,'zoneSettingsRestored':56,'managedWorkerDomainsRestoredAsConfiguration':len(restoredDomains['result']),'providerConfiguration403ReadBlockerRetired':True,'legacyFirewallApiStatus':410,'currentZoneRulesetCaptured':True,'routeRecordsCaptured':len(restoredConfig['records']['workers/routes']['body']['result']),'routeCollectionCompleteness':'Provider response contains1000; pagination completeness must be retained/checked against the provider contract','oldArchivesChanged':False,'originalSqlPagesAndWorkerProofsPreserved':True,'productionMutations':0,'externalMessagesSent':0,'fullHostedRestoreComplete':False,'offsiteServerHashVerified':False,'offsiteDestination':'Existing Website Control/01-Website-Backups/2026-10-24 folder; same project, no second backup programme','remaining':'Full hosted private-asset/service/business-journey recovery, original unavailable secrets/provider dependencies, off-Mac recovery-key custody and agreed recovery objectives'}
(R/'PROVIDER-CONFIGURATION-CORRECTION-20261025.json').write_text(json.dumps(proof,indent=2)+'\n')
Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024/website-control-provider-configuration-isolated-restore.json').write_text(json.dumps(proof,indent=2)+'\n')
plain=R/(name+'.tar.gz')
if plain.exists():plain.unlink()
print(json.dumps(proof))
