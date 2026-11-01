import base64
import contextlib
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from local_worker import serve
from food_gate import GatedPredictor
from core import parse_request


class LocalWorkerChecks(unittest.TestCase):
    def test_default_gated_model_refuses_before_loading_dependencies_or_files(self):
        with self.assertRaisesRegex(ValueError, "production invocation refused"):
            GatedPredictor(Path('absent'), Path('absent'), Path('absent'))

    def test_stream_has_one_readiness_then_bounded_results_without_echoing_private_fields(self):
        class FixtureModel:
            def recognise(self, request):
                parse_request(request)
                return {"items": ["fixture-food"], "nutrition": {}}
        good = {"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(b'\xff\xd8fixture').decode()}
        raw = b'\n'.join([json.dumps(good).encode(), json.dumps({**good, "memberId": "PRIVATE-MEMBER"}).encode(), b'bad-json', json.dumps(good).encode()]) + b'\n'
        output = io.StringIO()
        with patch('sys.stdin', io.TextIOWrapper(io.BytesIO(raw))), contextlib.redirect_stdout(output):
            serve(FixtureModel())
        lines = [json.loads(x) for x in output.getvalue().splitlines()]
        self.assertEqual(lines[0]['type'], 'ready'); self.assertEqual([r['ok'] for r in lines[1:]], [True, False, False, True])
        self.assertNotIn('PRIVATE-MEMBER', output.getvalue()); self.assertNotIn('base64', output.getvalue())

    def test_model_failure_returns_unavailable_without_exception_text_or_fabricated_food(self):
        class BrokenModel:
            def recognise(self, request): raise RuntimeError('PRIVATE-REQUEST-TEXT')
        output = io.StringIO()
        with patch('sys.stdin', io.TextIOWrapper(io.BytesIO(b'{}\n'))), contextlib.redirect_stdout(output): serve(BrokenModel())
        response = json.loads(output.getvalue().splitlines()[1])
        self.assertEqual(response, {'ok': False, 'error': 'model_unavailable'}); self.assertNotIn('PRIVATE', output.getvalue())

    def test_oversized_protocol_request_is_rejected_without_model_call(self):
        class NeverCalled:
            def recognise(self, request): raise AssertionError('Must not infer')
        with patch('sys.stdin', io.TextIOWrapper(io.BytesIO(b'x' * 1100001))), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(ValueError, 'Bounded'): serve(NeverCalled())


if __name__ == '__main__': unittest.main()
