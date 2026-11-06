// Actual shared-session API, synthetic SQLite fixtures only. No supplier/processor transport.
import assert from 'node:assert/strict';
import {hq,env,DB,cookies} from '../../hq-management-acceptance.mjs';
const route=(id,decision)=>hq.fetch(new Request(`https://api.shiftsometimber.co.uk/v1/hq/ai/actions/${id}/${decision}`,{method:'POST',headers:{Cookie:cookies.owner,Origin:'https://hq.shiftsometimber.co.uk','Content-Type':'application/json'},body:'{"note":"TEST review"}'}),env,{});
for(const type of ['approve_care','sign_prescription','dispense','refund','charge','publish','send','unknown_action']){
 const inserted=await DB.prepare("INSERT INTO ai_action_requests(action_type,title,status) VALUES(?,?,'pending')").bind(type,'TEST action').run(),id=inserted.meta.last_row_id;
 const response=await route(id,'approve');assert.equal(response.status,403);assert.equal((await response.json()).error,'ai_action_hard_stop');assert.equal((await DB.prepare('SELECT status FROM ai_action_requests WHERE id=?').bind(id).first()).status,'pending');
}
assert.equal((await DB.prepare("SELECT COUNT(*) n FROM hq_audit WHERE action='hq.ai_action_blocked'").first()).n,8);
const inserted=await DB.prepare("INSERT INTO ai_action_requests(action_type,title,status) VALUES('draft_suggestion','TEST suggestion','pending')").run(),id=inserted.meta.last_row_id;
let response=await route(id,'approve');assert.equal(response.status,200);assert.equal((await response.json()).execution_permitted,false);
response=await route(id,'approve');assert.equal(response.status,200);assert.equal((await DB.prepare("SELECT COUNT(*) n FROM hq_audit WHERE action='ai.action_approve' AND entity_id=?").bind(String(id)).first()).n,1);
response=await route(id,'reject');assert.equal(response.status,409);
console.log('PASS: 8 consequential/unknown AI types blocked through authenticated API; pending state preserved, blocks audited; suggestion review is idempotent and confers no execution authority.');
