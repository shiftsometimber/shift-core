import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/cloudflare-production-promote.yml',import.meta.url),'utf8');
function check(text){
 const steps=text.split('      - name: ');
 const before=steps.find(x=>x.startsWith('Capture protected catalogue and stock without customer records\n'));
 const ordinary=steps.find(x=>x.startsWith('Verify B1 protected catalogue and stock remain identical\n'));
 const rollback=steps.findIndex(x=>x.startsWith('Restore the captured runtime if a post-deployment gate failed\n'));
 const after=steps.findIndex(x=>x.startsWith('Verify protected catalogue and stock after owned rollback\n'));
 const pages=steps.findIndex(x=>x.startsWith('Verify nine public tool pages after owned rollback\n'));
 assert.ok(before?.includes('id: protected_stock_before\n'));
 assert.ok(before?.includes('run: node scripts/b1-release-scope.mjs --snapshot before'));
 assert.ok(ordinary?.includes('run: node scripts/b1-release-scope.mjs --snapshot after'));
 assert.ok(rollback>0&&after>rollback&&pages>after);
 assert.ok(steps[after].includes("if: ${{ always() && steps.runtime_rollback.outcome == 'success' && steps.protected_stock_before.outcome == 'success' }}"));
 assert.ok(steps[after].includes('run: node scripts/b1-release-scope.mjs --snapshot after'));
 assert.equal(steps.filter(x=>x.startsWith('Verify protected catalogue and stock after owned rollback\n')).length,1);
 return true;
}
test('owned rollback retains the original exact SELECT-only stock comparison after failed live gates',()=>assert.equal(check(workflow),true));
for(const [name,from,to] of [
 ['missing successful baseline'," && steps.protected_stock_before.outcome == 'success'",''],
 ['missing rollback ownership',"steps.runtime_rollback.outcome == 'success'","steps.runtime_rollback.outcome != 'success'"],
 ['default failure skips',"${{ always() && steps.runtime_rollback.outcome",'${{ steps.runtime_rollback.outcome'],
 ['changed stock reader','run: node scripts/b1-release-scope.mjs --snapshot after','run: node scripts/b1-release-scope.mjs --snapshot before']
])test('reject '+name,()=>assert.throws(()=>check(workflow.replaceAll(from,to))));
