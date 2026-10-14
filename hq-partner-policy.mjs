export function partnerTaskProjection(principal,row,now=new Date()){
 if(principal?.type!=='partner'||principal.status!=='active'||!['partner_admin','partner_operator','partner_readonly'].includes(principal.role)||principal.partnerId!==row.partner_id||row.disclosure_status!=='approved'||!row.sharing_reference||!row.sharing_expires_at||!Number.isFinite(Date.parse(row.sharing_expires_at))||Date.parse(row.sharing_expires_at)<=now.getTime())return null;
 return {id:row.id,reference:row.reference,service:row.service,status:row.status,task:row.partner_task,updated_at:row.updated_at};
}
export async function listPartnerTasks(DB,principal){
 if(principal?.type!=='partner'||principal.status!=='active')return [];
 const membership=await DB.prepare("SELECT m.role,m.status,p.status partner_status FROM hq_partner_memberships m JOIN hq_partners p ON p.id=m.partner_id WHERE m.partner_id=? AND m.principal_id=?").bind(principal.partnerId,principal.id).first();
 if(!membership||membership.status!=='active'||membership.partner_status!=='active')return [];
 const rows=(await DB.prepare("SELECT * FROM hq_partner_handovers WHERE partner_id=? AND disclosure_status='approved'").bind(principal.partnerId).all()).results;
 return rows.map(r=>partnerTaskProjection({...principal,role:membership.role},r)).filter(Boolean);
}
