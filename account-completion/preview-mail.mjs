// FICTIONAL PREVIEW MAIL ONLY. No network delivery, production import or provider token.
import {authenticateMember} from '../member-state-fast-v1.js';
const H={'Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hostname='shift-stabilisation-preview.matobrien.workers.dev';
export async function previewEmailRoute(request,env,ctx,core){
 const u=new URL(request.url),p=u.pathname;
 if(u.hostname!==hostname||env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917')return null;
 if(['/__preview/email-inbox','/__review/email-inbox'].includes(p)&&request.method==='GET'){
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const rows=(await env.DB.prepare('SELECT recipient,subject,body_text,created_at FROM preview_email_change_mail WHERE user_id=? ORDER BY id DESC LIMIT 12').bind(auth.userId).all()).results;
  if(p.startsWith('/__preview'))return Response.json({fictional:true,realMailSent:false,messages:rows},{headers:H});
  const body=rows.map(m=>'<article><h2>'+escape(m.subject)+'</h2><p>Fictional recipient: '+escape(m.recipient)+'</p>'+m.body_text.split('\n').map(line=>{const match=line.match(/https:\/\/[^\s]+/);if(!match)return'<p>'+escape(line)+'</p>';const url=new URL(match[0]);return url.hostname===hostname?'<p>'+escape(line.slice(0,match.index))+'<a href="'+escape(url.href)+'">Open fictional confirmation link</a></p>':'<p>'+escape(line)+'</p>';}).join('')+'</article>').join('');
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fictional email preview</title><style>body{background:#050505;color:#e7e3da;font:17px/1.6 Arial;max-width:800px;margin:30px auto;padding:20px}article{border:1px solid #707762;padding:16px;margin:20px 0}a{color:inherit}p{overflow-wrap:anywhere}</style></head><body><h1>Fictional mailbox preview</h1><p>No real email was sent. These links exercise the candidate verification flow using fictional accounts only.</p><a href="/member/settings#memberEmailChangePanel">Return to Member Details</a>'+body+'</body></html>',{headers:{...H,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'"}});
 }
 if(!p.startsWith('/v1/member/details/email-change')&&p!=='/member/email-change'&&p!=='/assets/member-experience/email-confirmation.mjs')return null;
 let owner=null;
 if(p.endsWith('/confirm')&&request.method==='POST'){
  const b=await request.clone().json().catch(()=>({}));if(typeof b.token==='string'&&/^[a-f0-9]{64}$/.test(b.token)){
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.token)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const row=await env.DB.prepare('SELECT user_id FROM member_email_changes WHERE old_token_hash=? OR new_token_hash=? OR cancel_token_hash=?').bind(digest,digest,digest).first();owner=row?.user_id||null;
  }
 }else if(p==='/v1/member/details/email-change'){const auth=await authenticateMember(request,env);owner=auth.userId||null;}
 const sender={async send(m){if(!owner||!/@example\.invalid$/.test(String(m.to))||String(m.text).length>12000)throw Error('fictional_mail_guard');await env.DB.prepare('INSERT INTO preview_email_change_mail(user_id,recipient,subject,body_text,created_at) VALUES(?,?,?,?,?)').bind(owner,String(m.to),String(m.subject),String(m.text),new Date().toISOString()).run();return {id:'fictional-preview-only'};}};
 return core.fetch(request,{...env,MEMBER_EMAIL_CHANGE_ENABLED:'true',EMAIL:sender},ctx);
}
