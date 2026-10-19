from pathlib import Path
import json,sqlite3
p=Path(__file__).parent
d=json.loads((p/'approved-preparation.json').read_text()); old=d['before']['articles'][0]; receipt=d['before']['receipts'][0]
apply=json.loads((p/'guarded-update.json').read_text()); rollback=json.loads((p/'guarded-rollback.json').read_text())
def db():
 c=sqlite3.connect(':memory:')
 for name,row in [('knowledge_articles',old),('babylove_receipts',receipt)]:
  c.execute('CREATE TABLE '+name+' ('+','.join(k+(' INTEGER' if isinstance(v,int) else ' TEXT') for k,v in row.items())+')')
  c.execute('INSERT INTO '+name+' VALUES ('+','.join('?' for _ in row)+')',list(row.values()))
 return c
def run(c,op): return c.execute(op['sql'],op['params']).rowcount
cases=[]
c=db(); assert run(c,apply)==1; assert run(c,apply)==0; assert run(c,rollback)==1; cases+=['fresh apply','replay excluded','exact rollback']
for field in ['body','title','updated_at']:
 c=db(); c.execute('UPDATE knowledge_articles SET '+field+'=?',('another editor',));assert run(c,apply)==0;cases+=['stale '+field+' excluded']
c=db();c.execute("UPDATE babylove_receipts SET payload_hash='another receipt'");assert run(c,apply)==0;cases+=['changed source receipt excluded']
c=db();assert run(c,apply)==1;c.execute("UPDATE knowledge_articles SET body='later author edit'");assert run(c,rollback)==0;cases+=['rollback preserves later edit']
c=db();assert run(c,apply)==1
row=dict(zip(old,c.execute('SELECT * FROM knowledge_articles').fetchone()))
for k in old:
 if k not in ['title','seo_title','summary','body','updated_at']:assert row[k]==old[k],k
assert c.execute('SELECT * FROM babylove_receipts').fetchone()==tuple(receipt.values())
cases+=['identity dates author status and receipt preserved']
(p/'guard-tests.json').write_text(json.dumps({'ok':True,'cases':cases},indent=2))
print(json.dumps({'ok':True,'guardChecks':len(cases),'cases':cases}))
