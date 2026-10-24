import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file='review/shift-product-events-v42m-generic-form-removal.proposed.js';
const js=readFileSync(new URL('../'+file,import.meta.url),'utf8');
const sha=createHash('sha256').update(js).digest('hex');
test('proposed exact Pages asset removes only misleading generic form submissions',()=>{
 assert.equal(sha,'cd102ba901bc3e6733abdfb7c342334b50aff16cf15cbaf30b0276b4833fae2d');
 assert.doesNotMatch(js,/shift_form_submit/);
 assert.match(js,/shift_tool_used/);
 assert.match(js,/document\.addEventListener\('click'/);
 assert.match(js,/shift_page_view/);
 assert.match(js,/shift_funnel_stage/);
});
