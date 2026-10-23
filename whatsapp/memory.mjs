// This reads only a confirmed, current link. Existing AI health/privacy consent
// checks must also pass in the caller. Never place WhatsApp messages in public knowledge.
export async function whatsappMemory(DB,userId){
 try{
  return (await DB.prepare(`SELECT m.body,m.received_at,l.generation FROM whatsapp_messages m
   JOIN whatsapp_links l ON l.user_id=m.user_id AND l.generation=m.link_generation AND l.sender=m.sender
   WHERE m.user_id=? AND l.memory_enabled=1 AND m.kind='text'
   AND julianday(m.received_at)>=julianday('now','-30 days')
   ORDER BY m.received_at DESC,m.message_id DESC LIMIT 4`).bind(userId).all()).results||[];
 }catch(error){if(/no such table/i.test(String(error.message)))return [];throw error;}
}
export async function whatsappPrivacyExport(DB,userId){
 const read=async sql=>{try{return (await DB.prepare(sql).bind(userId).all()).results||[]}catch(e){if(/no such table/i.test(String(e.message)))return [];throw e;}};
 return {links:await read('SELECT sender,memory_enabled,notice_version,linked_at FROM whatsapp_links WHERE user_id=?'),messages:await read('SELECT message_id,sender,body,kind,received_at,draft,drafted_at FROM whatsapp_messages WHERE user_id=?')};
}
