import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("routes", Path(__file__).resolve().parents[1] / "scripts/cloudflare-route-capacity.py")
routes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(routes)


def rule(n, path, owner="shift-core", fail_open=False):
    return {"id": str(n), "pattern": path, "script": owner, "request_limit_fail_open": fail_open}


class CapacityTests(unittest.TestCase):
    def test_full_table_allows_content_update(self):
        self.assertEqual(routes.capacity([rule(i, "example.com/" + str(i)) for i in range(1000)])["remaining"], 0)

    def test_new_route_is_rejected_before_upload(self):
        with self.assertRaisesRegex(ValueError, "capacity exceeded before upload"):
            routes.capacity([rule(i, "example.com/" + str(i)) for i in range(1000)], [rule(1001, "example.com/new")])

    def test_repeated_same_rule_does_not_consume_capacity(self):
        self.assertEqual(routes.capacity([rule(1, "example.com/a")], [rule(2, "example.com/b"), rule(3, "example.com/b")])["newRules"], 1)

    def test_other_service_is_never_reassigned(self):
        with self.assertRaisesRegex(ValueError, "reassigned"):
            routes.capacity([rule(1, "example.com/private*", "clinical")], [rule(2, "example.com/private*")])

    def test_exact_and_prefix_core_rules_are_covered(self):
        result = routes.redundant_routes([rule(1, "example.com/*"), rule(2, "example.com/member*"), rule(3, "example.com/member/a")])
        self.assertEqual([r["id"] for r in result["retained"]], ["1"])

    def test_intermediate_other_service_prevents_removal(self):
        result = routes.redundant_routes([rule(1, "example.com/*"), rule(2, "example.com/member*", "members"), rule(3, "example.com/member/a*")])
        self.assertEqual(result["remove"], [])

    def test_more_specific_other_service_is_preserved(self):
        original = [rule(1, "example.com/*"), rule(2, "example.com/member*"), rule(3, "example.com/member/private*", "members")]
        result = routes.redundant_routes(original)
        self.assertEqual({r["id"] for r in result["retained"]}, {"1", "3"})

    def test_main_www_and_schemes_remain_separate(self):
        original = [rule(1, "https://example.com/*"), rule(2, "example.com/member*"), rule(3, "www.example.com/member*")]
        self.assertEqual(routes.redundant_routes(original)["remove"], [])

    def test_https_exception_cannot_be_exposed(self):
        original = [rule(1, "example.com/*"), rule(2, "https://example.com/member*", "members"), rule(3, "example.com/member/a*")]
        self.assertEqual(routes.redundant_routes(original)["remove"], [])

    def test_same_owner_different_failure_behaviour_is_preserved(self):
        original = [rule(1, "example.com/*"), rule(2, "example.com/member*", fail_open=True)]
        self.assertEqual(routes.redundant_routes(original)["remove"], [])

    def test_no_worker_exception_is_preserved(self):
        original = [rule(1, "example.com/*"), rule(2, "example.com/private*", None), rule(3, "example.com/private/a*")]
        self.assertEqual(routes.redundant_routes(original)["remove"], [])

    def test_unsupported_shape_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "Unsupported"):
            routes.redundant_routes([rule(1, "*.example.com/*")])

    def test_jsonc_preserves_urls_and_string_punctuation(self):
        self.assertEqual(routes.jsonc('{//comment\n"url":"https://example.com/a,}","routes":[1,],/*x*/}'), {"url": "https://example.com/a,}", "routes": [1]})


if __name__ == "__main__":
    unittest.main()
