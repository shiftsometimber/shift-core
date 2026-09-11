import difflib, hashlib, json, pathlib, subprocess
root=pathlib.Path.cwd()
out=root/'release-evidence';out.mkdir(exist_ok=True)
source=root/'radar-public-v1.js'
candidate=source.read_bytes()
before=subprocess.check_output(['git','show','39cd8fa9d3694867ced4acb6012775c25a84709d:radar-public-v1.js'])
changes=subprocess.check_output(['git','diff','--name-only','39cd8fa9d3694867ced4acb6012775c25a84709d','HEAD']).decode().splitlines()
assert changes==['radar-public-v1.js'],changes
assert hashlib.sha256(before).hexdigest()=='4cd96f5c4e05c8604106ba93fbc36dc1f9e45e888de4c4eb494e1d3fbfede2ce'
try:
 for label,content in [('baseline',before),('candidate',candidate)]:
  source.write_bytes(content)
  result=subprocess.run(['npx','wrangler','deploy','--dry-run','--outdir','../'+label+'-build'],capture_output=True,text=True)
  if result.returncode:
   print(result.stdout[-2500:]);print(result.stderr[-2500:]);raise SystemExit('Dry build failed: '+label)
  print(label+' dry build PASS')
finally:source.write_bytes(candidate)
old=(root.parent/'baseline-build/worker-entry-v6.js').read_bytes()
new=(root.parent/'candidate-build/worker-entry-v6.js').read_bytes()
patch=''.join(difflib.unified_diff(old.decode().splitlines(True),new.decode().splitlines(True),fromfile='baseline/worker-entry-v6.js',tofile='candidate/worker-entry-v6.js'))
(out/'compiled-change.patch').write_text(patch)
print(json.dumps({'application_files_changed':changes,'baseline_bundle_sha256':hashlib.sha256(old).hexdigest(),'candidate_bundle_sha256':hashlib.sha256(new).hexdigest(),'compiled_diff_lines':len(patch.splitlines()),'source_sha256':hashlib.sha256(candidate).hexdigest()}))
print(patch[:18000])
