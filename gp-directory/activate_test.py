import unittest,sqlite3,json,hashlib
from activate import activation_sql
from stage import NATIONS
class Activation(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:')
  self.db.executescript(__import__('pathlib').Path(__file__).with_name('schema.sql').read_text())
  counts={n:1 for n in NATIONS}
  meta={'counts_json':json.dumps(counts),'sources_json':'{}','imported_at':'2026-10-14T00:00:00Z'}
  self.plan={'version':'a'*24,'activePractices':counts,'sourceMetadata':meta,'tableRows':{'gp_directory_practices':4,'gp_directory_postcodes':1},'tableOrderedContentSHA256':{'practices':'fixture','postcodes':'fixture'},'sourceDatabaseSHA256':'fixture','schemaSHA256':'fixture'}
  self.proof={k:self.plan[k] for k in ('version','tableRows','tableOrderedContentSHA256','sourceDatabaseSHA256','schemaSHA256')}
  self.proof.update(kind='independent-d1-content-readback',verified=True,versionWritesFrozen=True,checkedAt='fixture-test-only')
  self.db.execute('INSERT INTO gp_directory_versions VALUES(?,?,?,?,0)',(self.plan['version'],meta['imported_at'],meta['counts_json'],meta['sources_json']))
  self.db.execute("INSERT INTO gp_directory_versions VALUES('previous','date','{}','{}',1)")
  self.db.execute("INSERT INTO gp_directory_active VALUES(1,'previous')")
  for i,n in enumerate(NATIONS):self.db.execute('INSERT INTO gp_directory_practices VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',('a'*24,str(i),n,n,n,'[]','TEST','ACTIVE','source',None,None,None,'practice'))
  self.db.execute('INSERT INTO gp_directory_postcodes VALUES(?,?,?,?)',('a'*24,'SK101AA',1,1))
 def tearDown(self):self.db.close()
 def pointer(self):return self.db.execute('SELECT version FROM gp_directory_active').fetchone()[0]
 def apply(self,prior):
  p=activation_sql(self.plan,self.proof,prior);self.db.execute(p['completionSQL']);self.db.execute(p['atomicPointerCAS']);return p
 def test_exact_pointer_changes_once(self):
  self.apply('previous');self.assertEqual(self.pointer(),'a'*24)
  self.db.execute("UPDATE gp_directory_active SET version='previous'")
  self.apply('different');self.assertEqual(self.pointer(),'previous')
 def test_partial_never_activates(self):
  self.db.execute("DELETE FROM gp_directory_practices WHERE nation='Wales'")
  self.apply('previous');self.assertEqual(self.pointer(),'previous')
  self.assertEqual(self.db.execute("SELECT complete FROM gp_directory_versions WHERE version=?",('a'*24,)).fetchone()[0],0)
 def test_metadata_drift_never_activates(self):
  self.db.execute("UPDATE gp_directory_versions SET sources_json='changed' WHERE version=?",('a'*24,))
  self.apply('previous');self.assertEqual(self.pointer(),'previous')
 def test_ni_coordinates_rejected_at_cas(self):
  self.db.execute("UPDATE gp_directory_postcodes SET postcode='BT11AA'")
  self.apply('previous');self.assertEqual(self.pointer(),'previous')
 def test_readback_or_freeze_gap_prevents_plan(self):
  for field in ('verified','versionWritesFrozen'):
   p=dict(self.proof);p[field]=False
   with self.assertRaises(ValueError):activation_sql(self.plan,p,'previous')
  p=dict(self.proof);p['schemaSHA256']='changed'
  with self.assertRaises(ValueError):activation_sql(self.plan,p,'previous')
 def test_absent_prior_cannot_overwrite_existing(self):
  self.apply(None);self.assertEqual(self.pointer(),'previous')
  self.db.execute('DELETE FROM gp_directory_active')
  self.apply(None);self.assertEqual(self.pointer(),'a'*24)
if __name__=='__main__':unittest.main()
