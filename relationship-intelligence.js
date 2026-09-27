const MODEL='@cf/meta/llama-3.1-8b-instruct-fast';
const ALLOWED=new Set(['recurring_pattern','trigger','effective_strategy','avoid_strategy','communication_preference','motivator','blocker']);

export async function analyseRelationshipPatterns(env,userId){
  if(!env.AI||!env.DB)return {stored:0};
  try{
    const {results:rows=[]}=await env.DB.prepare(`SELECT direction,body,created_at FROM shift_ai_conversations WHERE user_id=? ORDER BY id DESC LIMIT 28`).bind(userId).all();
    const userTurns=rows.filter(r=>r.direction==='user').reverse();
    if(userTurns.length<6)return {stored:0};
    const count=userTurns.length;
    if(count%4!==0)return {stored:0};
    const transcript=userTurns.map((r,i)=>`${i+1}. ${String(r.body||'').slice(0,700)}`).join('\n');
    const system=`You are Shift Relationship Intelligence. Analyse repeated patterns across a member's recent messages and return ONLY JSON: {"insights":[{"key":"snake_case","category":"recurring_pattern|trigger|effective_strategy|avoid_strategy|communication_preference|motivator|blocker","value":"short grounded statement","confidence":0.0,"evidence_count":2}]}.

Rules:
- Only store a pattern if it is supported by at least TWO separate user messages. Three or more is better.
- Never diagnose, infer sensitive attributes, or store exact medical symptoms, medication details, measurements, sexual details, finances, addresses or secrets.
- Do not convert a one-off bad day into a recurring pattern.
- Good examples: tends to struggle with hunger after very light lunches; direct practical suggestions land better than motivational speeches; walking has repeatedly helped reset a rough day; Sunday evenings are a repeated difficult point.
- "effective_strategy" means something the member has actually said helped or worked more than once.
- "avoid_strategy" means an approach the member has repeatedly rejected or said does not work.
- "trigger" means a repeated situation/context linked to a struggle, not a medical cause.
- If evidence is weak, return {"insights":[]}.
- Keep values human-readable and useful to future conversations.`;
    const r=await env.AI.run(env.SHIFT_MEMORY_MODEL||MODEL,{messages:[{role:'system',content:system},{role:'user',content:transcript}],max_tokens:650,temperature:0.05});
    const parsed=parseJson(String(r?.response||r?.result?.response||''));
    const items=Array.isArray(parsed?.insights)?parsed.insights.slice(0,6):[];
    let stored=0;
    for(const item of items){
      const category=String(item?.category||''),confidence=Math.max(0,Math.min(1,Number(item?.confidence)||0)),evidence=Math.max(0,Number(item?.evidence_count)||0),key=normaliseKey(item?.key),value=String(item?.value||'').trim().slice(0,500);
      if(!ALLOWED.has(category)||!key||!value||confidence<0.72||evidence<2)continue;
      await env.DB.prepare(`INSERT INTO shift_ai_memory_v2(user_id,memory_key,category,memory_value,confidence,source,created_at,updated_at) VALUES(?,?,?,?,?,'relationship_analysis',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(user_id,memory_key) DO UPDATE SET category=excluded.category,memory_value=excluded.memory_value,confidence=MAX(shift_ai_memory_v2.confidence,excluded.confidence),source='relationship_analysis',updated_at=CURRENT_TIMESTAMP`).bind(userId,key,category,value,confidence).run();
      stored++;
    }
    return {stored};
  }catch(e){console.warn('shift_relationship_analysis_failed',e?.message);return {stored:0};}
}

function normaliseKey(v){const k=String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80);return k.length>=3?k:'';}
function parseJson(raw){try{return JSON.parse(raw)}catch{}const a=raw.indexOf('{'),b=raw.lastIndexOf('}');if(a>=0&&b>a){try{return JSON.parse(raw.slice(a,b+1))}catch{}}return null;}
