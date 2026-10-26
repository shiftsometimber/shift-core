import importlib.util
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('scope', ROOT / 'scripts/cloudflare-route-maintenance-scope.py')
scope = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scope)


class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.contents = {p: (ROOT / p).read_bytes() for p in set(scope.PINS) | {scope.WORKFLOW}}

    def test_exact_maintenance_does_not_upload_runtime(self):
        self.assertTrue(scope.classify(scope.ALLOWED, self.contents))

    def test_any_application_change_keeps_original_production_checks(self):
        self.assertFalse(scope.classify(scope.ALLOWED | {'worker-entry-v6.js'}, self.contents))

    def test_unreviewed_configuration_is_not_maintenance(self):
        self.contents['wrangler.jsonc'] += b'\n// unexpected change\n'
        self.assertFalse(scope.classify(scope.ALLOWED, self.contents))

    def test_deployment_script_mutation_is_not_maintenance(self):
        self.contents['release/member-runtime-deploy.mjs'] += b'\nprocess.exit(0);\n'
        self.assertFalse(scope.classify(scope.ALLOWED, self.contents))

    def test_unrelated_workflow_change_is_not_maintenance(self):
        self.contents[scope.WORKFLOW] = self.contents[scope.WORKFLOW].replace(b'timeout-minutes: 360', b'timeout-minutes: 359')
        self.assertFalse(scope.classify(scope.ALLOWED, self.contents))

    def test_all_original_promotion_bytes_have_an_exact_inverse(self):
        original = subprocess.check_output(['git', 'show', scope.BASE + ':' + scope.WORKFLOW], cwd=ROOT).decode()
        self.assertEqual(scope.updated_workflow(original).encode(), self.contents[scope.WORKFLOW])


if __name__ == '__main__':
    unittest.main()
