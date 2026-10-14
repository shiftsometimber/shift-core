import importlib.util,json,pathlib,sqlite3,tempfile,unittest
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('stage',HERE/'stage.py');stage=importlib.util.module_from_spec(spec);spec.loader.exec_module(stage)
class StageTests(unittest.TestCase):
 def fixture(self,root,ni=False,missing=False):
  p=root/'source.sqlite';db=sqlite3.connect(p);db.executescript((HERE/'schema.sql').read_text());v='a'*24
  counts={n:100 for n in stage.NATIONS}
  if missing:counts.pop('Wales')
  db.execute('INSERT INTO gp_directory_versions VALUES(?,?,?,?,1)',(v,'2026-10-12T00:00:00Z',json.dumps(counts),'[]'))
  db.execute('INSERT INTO gp_directory_active VALUES(1,?)',(v,))
  for nation in counts:
   for i in range(100):
    db.execute('INSERT INTO gp_directory_practices VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(v,nation+str(i),nation,"O'Brien practice",'name','["High Street"]','BT1 1AA' if nation=='Northern Ireland' else 'AB1 1CD','ACTIVE','official',1 if ni and nation=='Northern Ireland' else None,None,None,'practice'))
  db.commit();db.close();return p,v
 def test_limits_escape_and_complete_rows(self):
  rows=[('a'*24,'O\'Brien Æ surgery'+str(i),'é'*50) for i in range(1100)]
  chunks=list(stage.chunks('gp_directory_practices',['version','code','name'],rows,limit=4000,row_limit=80))
  self.assertEqual(sum(n for _,n in chunks),1100);self.assertTrue(all(len(s.encode())<=4000 and n<=80 for s,n in chunks))
  db=sqlite3.connect(':memory:');db.execute('CREATE TABLE gp_directory_practices(version,code PRIMARY KEY,name)')
  for sql,_ in chunks:db.executescript(sql)
  self.assertEqual(db.execute('SELECT count(*) FROM gp_directory_practices').fetchone()[0],1100)
  for sql,_ in chunks:db.executescript(sql)
  self.assertEqual(db.execute('SELECT count(*) FROM gp_directory_practices').fetchone()[0],1100)
 def test_reject_nul_and_oversized_single_row(self):
  with self.assertRaises(ValueError):stage.literal('a\x00b')
  with self.assertRaises(ValueError):list(stage.chunks('gp_directory_postcodes',['postcode'],[('x'*100000,)]))
 def test_unknown_table_and_nonfinite_value(self):
  with self.assertRaises(ValueError):list(stage.chunks('users',['name'],[('a',)]))
  with self.assertRaises(ValueError):stage.literal(float('nan'))
 def test_partial_and_complete_staging_never_activate(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);p,v=self.fixture(root);out=root/'out';summary=stage.prepare(p,out,HERE/'schema.sql')
   db=sqlite3.connect(':memory:');db.executescript((HERE/'schema.sql').read_text())
   db.execute('INSERT INTO gp_directory_versions VALUES(?,?,?,?,1)',('old','date','{}','[]'));db.execute('INSERT INTO gp_directory_active VALUES(1,"old")');db.commit()
   db.executescript((out/'000001-stage-version.sql').read_text())
   self.assertEqual(db.execute('SELECT complete FROM gp_directory_versions WHERE version=?',(v,)).fetchone()[0],0)
   files=sorted(out.glob('*-gp_directory_practices.sql'))
   for f in files:db.executescript(f.read_text())
   self.assertEqual(db.execute('SELECT count(*) FROM gp_directory_practices').fetchone()[0],400)
   self.assertEqual(db.execute('SELECT version FROM gp_directory_active').fetchone()[0],'old')
   self.assertEqual(db.execute('SELECT complete FROM gp_directory_versions WHERE version=?',(v,)).fetchone()[0],0)
   self.assertEqual(summary['remoteCalls'],0);self.assertFalse(summary['activationPerformed'])
   source=sqlite3.connect('file:'+str(p)+'?mode=ro',uri=True);self.assertEqual(source.execute('SELECT version FROM gp_directory_active').fetchone()[0],v)
 def test_missing_nation_or_ni_coordinates_refused_before_output(self):
  for kw in ({'missing':True},{'ni':True}):
   with tempfile.TemporaryDirectory() as d:
    root=pathlib.Path(d);p,_=self.fixture(root,**kw);out=root/'out'
    with self.assertRaises(ValueError):stage.prepare(p,out,HERE/'schema.sql')
    self.assertFalse(out.exists())
 def test_previous_packet_never_overwritten(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);p,_=self.fixture(root);out=root/'out';out.mkdir();sentinel=out/'keep';sentinel.write_text('receipt')
   with self.assertRaises(ValueError):stage.prepare(p,out,HERE/'schema.sql')
   self.assertEqual(sentinel.read_text(),'receipt')
if __name__=='__main__':unittest.main()
