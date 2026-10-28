import importlib.util, pathlib, unittest
spec=importlib.util.spec_from_file_location('release',pathlib.Path(__file__).with_name('publish_walkthrough.py'));r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
class ReleaseGuards(unittest.TestCase):
 def base(self):return {'/index.html':'home',r.ASSET:'old','/other.html':'other'}
 def test_one_owned_asset(self):
  b=self.base();r.assert_scope(b,{**b,r.ASSET:'new'})
 def test_homepage_change_rejected(self):
  b=self.base()
  with self.assertRaises(AssertionError):r.assert_scope(b,{**b,r.ASSET:'new','/index.html':'wrong'})
 def test_foreign_change_rejected(self):
  b=self.base()
  with self.assertRaises(AssertionError):r.assert_scope(b,{**b,r.ASSET:'new','/other.html':'wrong'})
 def test_new_asset_rejected(self):
  b=self.base()
  with self.assertRaises(AssertionError):r.assert_scope(b,{**b,r.ASSET:'new','/new.html':'wrong'})
 def test_deletion_rejected(self):
  b=self.base();a={**b,r.ASSET:'new'};del a['/other.html']
  with self.assertRaises(AssertionError):r.assert_scope(b,a)
 def test_noop_rejected(self):
  with self.assertRaises(AssertionError):r.assert_scope(self.base(),self.base())
 def headers(self):return {'status':200,'headers':dict.fromkeys(r.CONTRACT)}
 def test_headers_match(self):self.assertTrue(r.headers_match(self.headers(),self.headers()))
 def test_preview_noindex_is_only_allowed_environment_difference(self):
  a=self.headers();b=self.headers();b['headers']['x-robots-tag']='noindex';self.assertTrue(r.headers_match(a,b));self.assertFalse(r.headers_match(a,b,False))
 def test_security_header_removal_rejected(self):
  a=self.headers();b=self.headers();a['headers']['content-security-policy']="default-src 'self'";self.assertFalse(r.headers_match(a,b))
 def test_private_cache_removal_rejected(self):
  a=self.headers();b=self.headers();a['headers']['cache-control']='no-store';b['headers']['cache-control']='public';self.assertFalse(r.headers_match(a,b))
if __name__=='__main__':unittest.main()
