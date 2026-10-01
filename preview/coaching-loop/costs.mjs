import {uid} from './store.mjs';
export async function reserveSynthetic(DB,member,amount,now=Date.now()){
 if(!Number.isSafeInteger(amount)||amount<0||amount>50000)throw Object.assign(Error('invalid_reservation'),{status:400});
 const id=uid();
 try{await DB.prepare("INSERT INTO coaching_test_call_costs VALUES(?,?,?,?,NULL,'reserved','synthetic',NULL)").bind(id,member,now,amount).run();return{id,allowed:true};}catch(e){if(/cost_cap/.test(e.message))return{allowed:false,reason:'cost_cap'};throw e;}
}
export async function settleSynthetic(DB,member,id,actual){
 if(!Number.isSafeInteger(actual)||actual<0)throw Object.assign(Error('invalid_actual_cost'),{status:400});
 const r=await DB.prepare("UPDATE coaching_test_call_costs SET actual_micro_usd=?,status='settled' WHERE id=? AND member_id=? AND status='reserved' AND reserved_micro_usd>=?").bind(actual,id,member,actual).run();
 if(!r.meta.changes)throw Object.assign(Error('invalid_cost_settlement'),{status:409});
}
export async function costLedger(DB,member){return(await DB.prepare('SELECT * FROM coaching_test_call_costs WHERE member_id=? ORDER BY at DESC').bind(member).all()).results;}
