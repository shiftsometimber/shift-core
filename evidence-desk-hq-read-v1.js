import {authenticateWorkHQ} from './worker.js';
import {readEvidenceDeskOverview,readEvidenceDeskRows} from './evidence-desk-v1.js';

const PREFIX='/v1/hq/evidence-desk';
const READS=new Set(['overview','sources','claims','events','packages','audit']);
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export async function evidenceDeskHqReadRoutes(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'');
  if(path!==PREFIX&&!path.startsWith(PREFIX+'/'))return null;
  // Reuse the existing HQ cookie/session verifier. This does not initialize the
  // production schema or grant any Evidence Desk capability.
  const auth=await authenticateWorkHQ(request,env);
  if(auth.response)return auth.response;
  if(request.method!=='GET')return json({ok:false,error:'evidence_inbox_read_only',message:'The Evidence Inbox is read only. Decisions and publication remain in the separately commissioned service.'},405);
  const kind=path.slice(PREFIX.length+1);
  if(!READS.has(kind))return json({ok:false,error:'not_found'},404);
  const DB=env.EVIDENCE_DESK_READ_DB;
  if(!DB||DB===env.DB||env.EVIDENCE_DESK_READ_ENV!=='non-production')return json({
    ok:false,error:'evidence_inbox_not_connected',mode:'read_only',environment:'unconnected',
    message:'The Evidence Inbox is not connected to its isolated staging records. Queue counts and control state are unavailable; no publication is enabled by this screen.'
  },503);
  try{
    const data=kind==='overview'?await readEvidenceDeskOverview(DB):await readEvidenceDeskRows(DB,kind);
    if(kind==='overview'){
      if(!data.control)throw new Error('missing_control');
      const operationalTable=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='evidence_desk_operational_control'").first();
      if(operationalTable)data.operational=await DB.prepare('SELECT * FROM evidence_desk_operational_control WHERE id=1').first();
    }
    return json({...data,mode:'read_only',environment:'non-production'});
  }catch{
    return json({ok:false,error:'evidence_inbox_unavailable',mode:'read_only',environment:'non-production',message:'The staging evidence records could not be read. Queue counts and control state are unavailable. Refresh after the connection has been checked.'},503);
  }
}
