"""Identify the exact approved routing-only patch; never authorise a runtime upload.

All application paths must be unchanged. Unknown successors use the original
production promotion checks. The maintenance branch performs read-only checks.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess

BASE = '3a401235d1a6ae26374dfe33611c0cd9eda93b91'
WORKFLOW = '.github/workflows/cloudflare-production-promote.yml'
WORKFLOW_BEFORE = '1104b68dfcb15cf70ab7dcfc99ede03fb4332a0bce85050937cb75e9ae238fb9'
PINS = {
    'wrangler.jsonc': '722c9ce2f2296a3f281f5154b5a795d0cde78d9bd37fdf5c4997991884fcbb2b',
    'package.json': 'd5e481995b2d3a42255b7a9e4a9a7b8cdb529143f364b40cd075a3685a7f805f',
    'release/member-runtime-deploy.mjs': '4843bc97637c353de05f9d4938c12ec511c73a6684e6b4f4a523f75d8778ca2d',
    'scripts/cloudflare-route-capacity.py': '049c18dd7a764f31d1a2276b899f1133a36f379e8fd6005c89c3843c038186e2',
    'tests/test_cloudflare_route_capacity.py': '594d87e9c780bf9de1963481cab4a2e1737ad2b0d4a9ebc580ba670d953ebdb9',
}
ALLOWED = set(PINS) | {WORKFLOW, 'scripts/cloudflare-route-maintenance-scope.py', 'tests/test_cloudflare_route_maintenance_scope.py'}
PATHS_BEFORE = '      - "wrangler.jsonc"\n'
PATHS_AFTER = PATHS_BEFORE + '      - "scripts/cloudflare-route-*.py"\n      - "tests/test_cloudflare_route_*.py"\n'
OUTPUT_BEFORE = '      current: ${{ steps.current.outputs.current }}\n'
OUTPUT_AFTER = OUTPUT_BEFORE + '      routes_only: ${{ steps.route_scope.outputs.routes_only }}\n'
IF_BEFORE = "    if: ${{ needs.select-current.outputs.current == 'true' && (github.event_name == 'push' || inputs.confirm == 'PROMOTE_CURRENT_MAIN') }}\n"
IF_AFTER = "    if: ${{ needs.select-current.outputs.current == 'true' && needs.select-current.outputs.routes_only != 'true' && (github.event_name == 'push' || inputs.confirm == 'PROMOTE_CURRENT_MAIN') }}\n"
STEPS = """      - id: route_scope
        name: Identify exact routing maintenance without a runtime upload
        if: steps.current.outputs.current == 'true'
        run: python3 scripts/cloudflare-route-maintenance-scope.py
      - name: Verify routing maintenance and live capacity read-only
        if: steps.route_scope.outputs.routes_only == 'true'
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          python3 -m unittest discover -s tests -p 'test_cloudflare_route_*.py' -v
          node --check release/member-runtime-deploy.mjs
          python3 scripts/cloudflare-route-capacity.py check --intent routes --config wrangler.jsonc --report route-capacity-proof.json
      - uses: actions/upload-artifact@v4
        if: steps.route_scope.outputs.routes_only == 'true'
        with:
          name: routing-maintenance-${{ github.sha }}
          path: route-capacity-proof.json
          if-no-files-found: error
"""


def sha(data):
    return hashlib.sha256(data).hexdigest()


def updated_workflow(before):
    assert sha(before.encode()) == WORKFLOW_BEFORE
    for old, new in ((PATHS_BEFORE, PATHS_AFTER), (OUTPUT_BEFORE, OUTPUT_AFTER), (IF_BEFORE, IF_AFTER), ('\n  promote:\n', '\n' + STEPS + '\n  promote:\n')):
        assert before.count(old) == 1
        before = before.replace(old, new, 1)
    return before


def classify(changes, contents):
    if set(changes) != ALLOWED:
        return False
    for path, pin in PINS.items():
        if path not in contents or sha(contents[path]) != pin:
            return False
    try:
        workflow = contents[WORKFLOW].decode()
        for new, old in ((PATHS_AFTER, PATHS_BEFORE), (OUTPUT_AFTER, OUTPUT_BEFORE), (IF_AFTER, IF_BEFORE), ('\n' + STEPS + '\n  promote:\n', '\n  promote:\n')):
            if workflow.count(new) != 1:
                return False
            workflow = workflow.replace(new, old, 1)
        return sha(workflow.encode()) == WORKFLOW_BEFORE
    except (KeyError, UnicodeError):
        return False


def main():
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    changes = subprocess.check_output(['git', 'diff', '--name-only', BASE, head], text=True).splitlines()
    dirty = subprocess.check_output(['git', 'diff', 'HEAD', '--name-only'], text=True).strip()
    contents = {p: Path(p).read_bytes() for p in set(PINS) | {WORKFLOW}}
    only = not dirty and classify(changes, contents)
    result = {'routes_only': only, 'source': head, 'base': BASE, 'applicationChanged': bool(set(changes) - ALLOWED), 'runtimeUpload': False if only else 'original guarded promotion required'}
    print(json.dumps(result, sort_keys=True))
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write('routes_only=' + str(only).lower() + '\n')


if __name__ == '__main__':
    main()
