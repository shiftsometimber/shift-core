const ROOMS=new Set(['bar','check-in','kitchen','moving','headspace','treatment']);
const REPORT_REASONS=new Set(['unsafe','abuse','spam','medical-misinformation','privacy','other']);

export async function communityRoutes(request,env,ctx,coreFetch){
  const url=new URL(request.url), path=url.pathname.replace(/\/+$/,'')||'/';
  if(!path.startsWith('/v1/community/')&&!path.startsWith('/v1/hq/community/')) return null;
  await ensureCommunitySchema(env.DB);

  if(path.startsWith('/v1/hq/community/')) return hqRoutes(request,env,ctx,coreFetch,path);
  const auth=await memberUser(request,env,ctx,coreFetch); if(auth.response)return auth.response;
  const userId=auth.user.id;

  if(request.method==='GET'&&path==='/v1/community/rooms') return json({ok:true,rooms:roomList()});
  if(request.method==='GET'&&path==='/v1/community/feed') return feed(env.DB,userId,url);
  if(request.method==='POST'&&path==='/v1/community/posts') return createPost(request,env.DB,userId);

  const reply=path.match(/^\/v1\/community\/posts\/(\d+)\/replies$/);
  if(request.method==='POST'&&reply) return createReply(request,env.DB,userId,Number(reply[1]));
  const react=path.match(/^\/v1\/community\/posts\/(\d+)\/reactions$/);
  if(request.method==='POST'&&react) return reactToPost(request,env.DB,userId,Number(react[1]));
  const report=path.match(/^\/v1\/community\/posts\/(\d+)\/report$/);
  if(request.method==='POST'&&report) return reportPost(request,env.DB,userId,Number(report[1]));
  const block=path.match(/^\/v1\/community\/posts\/(\d+)\/block-author$/);
  if(request.method==='POST'&&block) return blockAuthor(env.DB,userId,Number(block[1]));
  const del=path.match(/^\/v1\/community\/posts\/(\d+)$/);
  if(request.method==='DELETE'&&del) return deleteOwnPost(env.DB,userId,Number(del[1]));
  return json({ok:false,error:'not_found'},404);
}

async function memberUser(request,env,ctx,coreFetch){
  const res=await coreFetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!res.ok)return{response:res};
  const body=await res.json().catch(()=>({})), id=Number(body?.user?.id||0);
  if(!id)return{response:json({ok:false,error:'unauthorised'},401)};
  return{user:{id}};
}

async function hqUser(request,env,ctx,coreFetch){
  const res=await coreFetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!res.ok)return{response:res};
  const body=await res.json().catch(()=>({})), id=Number(body?.user?.id||0);
  if(!id)return{response:json({ok:false,error:'unauthorised'},401)};
  return{user:{id}};
}

async function hqRoutes(request,env,ctx,coreFetch,path){
  const auth=await hqUser(request,env,ctx,coreFetch); if(auth.response)return auth.response;
  if(request.method==='GET'&&path==='/v1/hq/community/reports'){
    const rows=await env.DB.prepare(`SELECT r.id,r.post_id,r.reason,r.details,r.status,r.created_at,p.room,p.body AS post_body,p.user_id AS post_author_id FROM community_reports r JOIN community_posts p ON p.id=r.post_id ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 100`).all();
    return json({ok:true,reports:rows.results||[]});
  }
  const action=path.match(/^\/v1\/hq\/community\/reports\/(\d+)\/action$/);
  if(request.method==='POST'&&action){
    const body=await readJson(request), choice=String(body.action||'');
    if(!['dismiss','hide','remove'].includes(choice))return json({ok:false,error:'invalid_action'},400);
    const reportId=Number(action[1]);
    const report=await env.DB.prepare('SELECT * FROM community_reports WHERE id=?').bind(reportId).first();
    if(!report)return json({ok:false,error:'report_not_found'},404);
    if(choice==='hide')await env.DB.prepare("UPDATE community_posts SET status='hidden',updated_at=? WHERE id=?").bind(now(),report.post_id).run();
    if(choice==='remove')await env.DB.prepare("UPDATE community_posts SET status='removed',body='[removed by moderation]',updated_at=? WHERE id=?").bind(now(),report.post_id).run();
    await env.DB.prepare("UPDATE community_reports SET status='closed',resolved_at=?,resolved_by=?,resolution=? WHERE id=?").bind(now(),auth.user.id,choice,reportId).run();
    await env.DB.prepare('INSERT INTO community_moderation(actor_user_id,post_id,report_id,action,reason,created_at) VALUES(?,?,?,?,?,?)').bind(auth.user.id,report.post_id,reportId,choice,clean(body.reason,300),now()).run();
    return json({ok:true,reportId,action:choice});
  }
  return json({ok:false,error:'not_found'},404);
}

async function feed(DB,userId,url){
  const room=String(url.searchParams.get('room')||'bar'); if(!ROOMS.has(room))return json({ok:false,error:'invalid_room'},400);
  const limit=Math.max(1,Math.min(40,Number(url.searchParams.get('limit')||25)));
  const rows=await DB.prepare(`SELECT p.id,p.room,p.body,p.created_at,p.reply_to_id,p.user_id,COALESCE(NULLIF(TRIM(u.first_name),''),'Shift member') AS author_name FROM community_posts p LEFT JOIN users u ON u.id=p.user_id WHERE p.room=? AND p.status='visible' AND p.user_id NOT IN (SELECT blocked_user_id FROM community_blocks WHERE blocker_user_id=?) ORDER BY p.created_at DESC LIMIT ?`).bind(room,userId,limit).all();
  const posts=[];
  for(const p of rows.results||[]){
    const reactions=await DB.prepare('SELECT reaction,COUNT(*) AS count FROM community_reactions WHERE post_id=? GROUP BY reaction').bind(p.id).all();
    const replies=await DB.prepare("SELECT COUNT(*) AS count FROM community_posts WHERE reply_to_id=? AND status='visible'").bind(p.id).first();
    posts.push({id:p.id,room:p.room,body:p.body,createdAt:p.created_at,replyToId:p.reply_to_id||null,author:{name:p.author_name,isMe:Number(p.user_id)===userId},reactions:reactions.results||[],replyCount:Number(replies?.count||0)});
  }
  return json({ok:true,room,posts});
}

async function createPost(request,DB,userId){
  if(await tooFast(DB,userId))return json({ok:false,error:'rate_limited',message:'Give it a moment before posting again.'},429);
  const body=await readJson(request), room=String(body.room||'bar'), text=clean(body.body,1500);
  if(!ROOMS.has(room)||text.length<1)return json({ok:false,error:'invalid_post'},400);
  const result=await DB.prepare('INSERT INTO community_posts(user_id,room,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(userId,room,text,'visible',now(),now()).run();
  return json({ok:true,id:Number(result?.meta?.last_row_id||0)},201);
}

async function createReply(request,DB,userId,postId){
  const parent=await visiblePost(DB,postId); if(!parent)return json({ok:false,error:'post_not_found'},404);
  if(await tooFast(DB,userId))return json({ok:false,error:'rate_limited'},429);
  const body=await readJson(request), text=clean(body.body,1200); if(!text)return json({ok:false,error:'invalid_reply'},400);
  const result=await DB.prepare('INSERT INTO community_posts(user_id,room,body,status,reply_to_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(userId,parent.room,text,'visible',postId,now(),now()).run();
  return json({ok:true,id:Number(result?.meta?.last_row_id||0)},201);
}

async function reactToPost(request,DB,userId,postId){
  if(!await visiblePost(DB,postId))return json({ok:false,error:'post_not_found'},404);
  const body=await readJson(request), reaction=String(body.reaction||'support');
  if(!['support','useful','same-here'].includes(reaction))return json({ok:false,error:'invalid_reaction'},400);
  await DB.prepare('INSERT OR IGNORE INTO community_reactions(user_id,post_id,reaction,created_at) VALUES(?,?,?,?)').bind(userId,postId,reaction,now()).run();
  return json({ok:true,reaction});
}

async function reportPost(request,DB,userId,postId){
  if(!await visiblePost(DB,postId))return json({ok:false,error:'post_not_found'},404);
  const body=await readJson(request), reason=String(body.reason||'other'); if(!REPORT_REASONS.has(reason))return json({ok:false,error:'invalid_reason'},400);
  const prior=await DB.prepare("SELECT id FROM community_reports WHERE user_id=? AND post_id=? AND status='open'").bind(userId,postId).first();
  if(prior)return json({ok:true,reportId:prior.id,duplicate:true});
  const result=await DB.prepare('INSERT INTO community_reports(user_id,post_id,reason,details,status,created_at) VALUES(?,?,?,?,?,?)').bind(userId,postId,reason,clean(body.details,500),'open',now()).run();
  return json({ok:true,reportId:Number(result?.meta?.last_row_id||0)},201);
}

async function blockAuthor(DB,userId,postId){
  const post=await visiblePost(DB,postId); if(!post)return json({ok:false,error:'post_not_found'},404);
  const other=Number(post.user_id); if(other===userId)return json({ok:false,error:'cannot_block_self'},400);
  await DB.prepare('INSERT OR IGNORE INTO community_blocks(blocker_user_id,blocked_user_id,created_at) VALUES(?,?,?)').bind(userId,other,now()).run();
  return json({ok:true});
}

async function deleteOwnPost(DB,userId,postId){
  const post=await DB.prepare('SELECT user_id,status FROM community_posts WHERE id=?').bind(postId).first(); if(!post)return json({ok:false,error:'post_not_found'},404);
  if(Number(post.user_id)!==userId)return json({ok:false,error:'forbidden'},403);
  await DB.prepare("UPDATE community_posts SET status='removed',body='[removed by member]',updated_at=? WHERE id=?").bind(now(),postId).run();
  return json({ok:true});
}

async function visiblePost(DB,id){return DB.prepare("SELECT * FROM community_posts WHERE id=? AND status='visible'").bind(id).first()}
async function tooFast(DB,userId){const row=await DB.prepare("SELECT COUNT(*) AS c FROM community_posts WHERE user_id=? AND julianday(created_at) > julianday('now','-60 seconds')").bind(userId).first();return Number(row?.c||0)>=5}
function roomList(){return[
  {id:'bar',name:'At The Bar',purpose:'General chat and life stuff.'},
  {id:'check-in',name:'Weekly Check-In',purpose:'Wins, setbacks and what actually happened this week.'},
  {id:'kitchen',name:'The Kitchen',purpose:'Food that works in real life.'},
  {id:'moving',name:'Get Moving',purpose:'Walking, football, fitness and getting moving again.'},
  {id:'headspace',name:'Headspace',purpose:'Confidence, motivation, stress and the stuff blokes bottle up.'},
  {id:'treatment',name:'Treatment Talk',purpose:'Peer experience only — not diagnosis or prescribing.'}
]}
async function ensureCommunitySchema(DB){await DB.batch([
  DB.prepare(`CREATE TABLE IF NOT EXISTS community_posts(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,room TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'visible',reply_to_id INTEGER,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_community_posts_room_created ON community_posts(room,status,created_at DESC)`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS community_reactions(user_id INTEGER NOT NULL,post_id INTEGER NOT NULL,reaction TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,post_id,reaction))`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS community_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,post_id INTEGER NOT NULL,reason TEXT NOT NULL,details TEXT,status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL,resolved_at TEXT,resolved_by INTEGER,resolution TEXT)`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status,created_at DESC)`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS community_blocks(blocker_user_id INTEGER NOT NULL,blocked_user_id INTEGER NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(blocker_user_id,blocked_user_id))`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS community_moderation(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id INTEGER NOT NULL,post_id INTEGER NOT NULL,report_id INTEGER,action TEXT NOT NULL,reason TEXT,created_at TEXT NOT NULL)`)
])}
async function readJson(request){try{return await request.json()}catch{return{}}}
function clean(value,max){return String(value||'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').replace(/<[^>]*>/g,'').trim().slice(0,max)}
function now(){return new Date().toISOString()}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
