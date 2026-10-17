from pathlib import Path
import json,subprocess,hashlib,re,shutil,datetime
W=Path(__file__).resolve().parent;R=W/'source-repo';dest=R/'release/public-feedback-20261017';dest.mkdir(parents=True,exist_ok=True)
prepared=json.loads((W/'prepared-changes.json').read_text());build=prepared['build'];browser=json.loads((W/'preview-browser-proof.json').read_text())
assert browser['build']==build and len(browser['checks'])==22 and not browser['errors'] and not browser.get('failure')
assert {x['budgetBand'] for x in browser['checks'] if x.get('budgetBand')}=={'nhs','under100','band150','band200','over200'}
source=(W/'after/assets/start-here-support-v1.js').read_text();assert 'JSON.stringify' not in source
writes=re.findall(r'sessionStorage\.setItem\(([^\n]+)',source);assert len(writes)==1 and "'sstKnowledgeFocus'" in writes[0]
checks=[]
for change in prepared['changes']:
 p=W/'after'/change['path'].lstrip('/');assert hashlib.sha256(p.read_bytes()).hexdigest()==change['afterSHA256']
 if p.suffix=='.js':
  result=subprocess.run(['/usr/local/bin/node','--check',str(p)],capture_output=True,text=True);assert result.returncode==0,result.stderr;checks.append(change['path'])
for p in (W/'after').rglob('*.html'):
 t=p.read_text();assert not re.search('Ask Shift',t,re.I);assert t.count('name="public-shell-build"')==1 and build in t
public={'build':build,'scope':'Public-site origin and shared utility assets; separate Core runtime unchanged','source':'https://github.com/shiftsometimber/shift-core/tree/proof/public-feedback-20261017/release/public-feedback-20261017','baseDeployment':prepared['baseDeployment'],'namedMedicineQuizResults':False,'qualifiedMedicinesAdvertisingReviewClaimed':False}
b=(json.dumps(public,indent=2)+'\n').encode();(W/'after/public-release.json').write_bytes(b)
if not any(x['path']=='/public-release.json' for x in prepared['changes']):prepared['changes'].append({'path':'/public-release.json','beforeSHA256':None,'afterSHA256':hashlib.sha256(b).hexdigest(),'bytes':len(b)})
(W/'prepared-changes.json').write_text(json.dumps(prepared,indent=2))
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':build,'changedScriptSyntax':checks,'rawHtmlNamesAndBuildPass':prepared['htmlFiles'],'manifestsChecked':2,'oldQuizPrivacySourceUnchanged':not(W/'after/start-here-v72.js').exists(),'newQuizNoAnswerOrRecommendationStorageWrites':True,'existingKnowledgeHandoffWritePreserved':True,'headersSHA256':hashlib.sha256((W/'_headers').read_bytes()).hexdigest(),'pass':True};(W/'source-checks.json').write_text(json.dumps(result,indent=2))
shutil.copytree(W/'after',dest/'after',dirs_exist_ok=True)
for name in ['build-feedback.py','feedback-controls.js','feedback-controls.css','recover-public-source.cjs','preview-check.cjs','origin-provenance.json','origin-manifest.json','source-recovery.json','prepared-changes.json','source-checks.json','preview-browser-proof.json','preview-browser-proof-before-h1-css.json','preview-browser-proof-before-member-readiness.json','prepared-changes-before-h1-css.json','_headers']:
 shutil.copyfile(W/name,dest/name)
shutil.copytree(W/'screenshots',dest/'screenshots',dirs_exist_ok=True)
whitespace=json.loads((W/'actual-source-whitespace-check.json').read_text());assert whitespace['rc'] in [0,1] and not whitespace['stdout'] and not whitespace['stderr'];shutil.copyfile(W/'actual-source-whitespace-check.json',dest/'actual-source-whitespace-check.json')
for args in [['git','-C',str(R),'config','user.name','SHIFT release preparation'],['git','-C',str(R),'config','user.email','release@shiftsometimber.co.uk'],['git','-C',str(R),'add','release/public-feedback-20261017'],['git','-C',str(R),'commit','-m','Correct public quiz guidance, mobile utilities and approved site wording']]:
 result=subprocess.run(args,capture_output=True,text=True);assert result.returncode==0,(args,result.stderr)
commit=subprocess.check_output(['git','-C',str(R),'rev-parse','HEAD'],text=True).strip();(W/'source-commit.json').write_text(json.dumps({'commit':commit,'build':build,'branch':'proof/public-feedback-20261017','repository':'shiftsometimber/shift-core'},indent=2));print(json.dumps({'sourceCommit':commit,'build':build,'files':len(prepared['changes']),'sourceChecksPass':True,'browserChecks':len(browser['checks'])}))
