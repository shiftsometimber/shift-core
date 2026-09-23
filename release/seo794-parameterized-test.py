import json, sqlite3, pathlib

root=pathlib.Path(__file__).resolve().parent.parent
changes=json.loads((root/'preview/seo-repairs/generated/changes.json').read_text())
batch=json.loads((root/'seo794-release-proof/executed-parameterized-correction.json').read_text())['batch']
fields=['id','status','content_package_json','source_evidence_json','updated_at','reviewed_at','created_at','first_published_at']
results=[]
for stale in [False,True]:
 db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
 db.execute('CREATE TABLE radar_events(id INTEGER PRIMARY KEY,status TEXT,content_package_json TEXT,source_evidence_json TEXT,updated_at TEXT,reviewed_at TEXT,created_at TEXT,first_published_at TEXT)')
 db.execute('CREATE TABLE radar_audit(event_id INTEGER,action TEXT,actor TEXT,detail_json TEXT)')
 for x in changes:
  row={**x['before'],'status':'published'}
  db.execute('INSERT INTO radar_events VALUES('+','.join('?' for _ in fields)+')',[row.get(f) for f in fields])
 db.execute("INSERT INTO radar_events VALUES(999999,'published','untouched','[]','original',NULL,'original','original')")
 if stale:db.execute("UPDATE radar_events SET reviewed_at='newer decision' WHERE id=?",[changes[0]['id']])
 before=[dict(x) for x in db.execute('SELECT * FROM radar_events ORDER BY id')]
 for statement in batch:db.execute(statement['sql'],statement['params'])
 after=[dict(x) for x in db.execute('SELECT * FROM radar_events ORDER BY id')]
 audit=list(db.execute('SELECT * FROM radar_audit'))
 if stale:
  assert after==before and len(audit)==0
 else:
  assert len(audit)==13
  for x in changes:
   row=next(r for r in after if r['id']==x['id'])
   for f in fields:
    if f!='status':assert row[f]==x['after'].get(f),(x['id'],f)
  assert after[-1]==before[-1]
  for statement in batch:db.execute(statement['sql'],statement['params'])
  assert [dict(x) for x in db.execute('SELECT * FROM radar_events ORDER BY id')]==after
  assert len(list(db.execute('SELECT * FROM radar_audit')))==13
 results.append({'stale':stale,'passed':True,'auditRows':len(audit)})
out={'passed':True,'exactApprovedContent':True,'allOrNoneGuard':True,'retryDoesNotDuplicateAudit':True,'unrelatedRowsPreserved':True,'scenarios':results}
(root/'seo794-release-proof/parameterized-sql-tests.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out))
