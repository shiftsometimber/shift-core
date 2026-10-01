export async function audit(DB,member){return(await DB.prepare('SELECT id,at,type,outcome,data_used,reason,channel FROM coaching_test_audit_events WHERE member_id=? ORDER BY at DESC,id').bind(member).all()).results.map(r=>({...r,dataUsed:JSON.parse(r.data_used),data_used:undefined}));}
export async function scrubAudit(DB,member,id){
 const rows=await audit(DB,member);
 await DB.batch(rows.filter(r=>r.dataUsed.includes(id)).map(r=>DB.prepare('UPDATE coaching_test_audit_events SET data_used=? WHERE id=? AND member_id=?').bind(JSON.stringify(r.dataUsed.filter(x=>x!==id)),r.id,member)));
}
