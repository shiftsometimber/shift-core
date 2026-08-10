import {buildProactiveInsights,nextDeliverableInsight,markInsightDelivered} from './proactive-insights.js';
import {runAcademyRegression} from './academy-regression-runner-v2.js';

export async function runScheduledIntelligence(env){
  await ensureSchema(env.DB);
  const out={membersScanned:0,queued:0,academy:null};
  try{
    const {results:users=[]}=await env.DB.prepare(`SELECT id FROM users ORDER BY id DESC LIMIT 500`).all();
    for(const u of users){
      const uid=Number(u.id); if(!uid) continue;
      out.membersScanned++;
      try{
        await buildProactiveInsights(env,uid);
        const insight=await nextDeliverableInsight(env.DB,uid);
        if(!insight) continue;
        await env.DB.prepare(`INSERT INTO shift_ai_proactive_outbox(user_id,insight_id,title,body,channel,status) VALUES(?,?,?,?,?,'queued')`).bind(uid,insight.id,insight.title,insight.body,'in_app').run();
        await markInsightDelivered(env.DB,uid,insight.id);
        out.queued++;
      }catch(e){console.warn('scheduled_member_failed',uid,e?.message)}
    }
  }catch(e){console.warn('scheduled_users_failed',e?.message)}
  try{
    const academy=await runAcademyRegression(env,{limit:8});
    out.academy=academy?.summary||academy;
    await env.DB.prepare(`INSERT INTO shift_ai_academy_runs(pass_rate,passed,total,detail_json) VALUES(?,?,?,?)`).bind(Number(academy?.summary?.passRate||0),Number(academy?.summary?.passed||0),Number(academy?.summary?.total||0),JSON.stringify(academy).slice(0,50000)).run();
  }catch(e){console.warn('scheduled_academy_failed',e?.message)}
  return out;
}

async function ensureSchema(DB){
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_proactive_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,insight_id INTEGER,title TEXT NOT NULL,body TEXT NOT NULL,channel TEXT NOT NULL DEFAULT 'in_app',status TEXT NOT NULL DEFAULT 'queued',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,delivered_at TEXT)`),
    DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_proactive_outbox_user ON shift_ai_proactive_outbox(user_id,status,id)`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_academy_runs (id INTEGER PRIMARY KEY AUTOINCREMENT,pass_rate REAL NOT NULL DEFAULT 0,passed INTEGER NOT NULL DEFAULT 0,total INTEGER NOT NULL DEFAULT 0,detail_json TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  ]);
}
