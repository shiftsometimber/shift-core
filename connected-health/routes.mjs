import {only,fail,CONSENT_VERSION} from './model.mjs';
import {grant,state,ingest,control,confirmHeight,exportData} from './store.mjs';
const BASE='/v1/connected-health';
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, must-revalidate','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Cookie'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:HEADERS});
const owned=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://api.shiftsometimber.co.uk']);
async function readBody(request) {
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))throw fail('json_required',415);
  const reader=request.body?.getReader();if(!reader)throw fail('invalid_json');
  const decoder=new TextDecoder('utf-8',{fatal:true});let text='',bytes=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536){await reader.cancel();throw fail('request_too_large',413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();return JSON.parse(text);}catch(e){if(e.status)throw e;throw fail('invalid_json');}finally{reader.releaseLock();}
}
export function createConnectedHealthRoutes(authenticate) {
  if(typeof authenticate!=='function')throw new TypeError('An existing member-session authenticator is required.');
  return async function connectedHealthRoutes(request,env) {
    const path=new URL(request.url).pathname;
    if(path!==BASE && !path.startsWith(BASE+'/'))return null;
    // No request parsing, auth, DB access or consent collection while disabled.
    if(env.CONNECTED_HEALTH_V1_ENABLED!=='true')return json({ok:false,error:'not_available'},404);
    try{
      const origin=request.headers.get('Origin');
      if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(origin&&!owned.has(origin)&&origin!==new URL(request.url).origin))throw fail('origin_not_allowed',403);
      const identity=await authenticate(request,env);
      if(identity.response)return json({ok:false,error:'authentication_required'},401);
      const auth={userId:identity.userId,sessionId:identity.user?.session_id};
      if(request.method==='GET'&&path===BASE)return json({ok:true,accountId:auth.userId,accountLabel:identity.user?.email||'',...await state(env.DB,auth)});
      if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
      if(!origin)throw fail('origin_required',403);
      const body=await readBody(request);
      let result;
      if(path===BASE+'/consent'){
        only(body,['expectedAccountId','provider','expectedRevision','consentVersion','consent','scopes']);
        result={connection:await grant(env.DB,auth,body)};
      }else if(path===BASE+'/import')result=await ingest(env.DB,auth,body);
      else if(['stop','withdraw','delete'].some(x=>path===BASE+'/'+x)){
        only(body,['expectedAccountId','provider','connectionId','revision']);result=await control(env.DB,auth,body,path.slice(BASE.length+1));
      }else if(path===BASE+'/height/confirm'){
        only(body,['expectedAccountId','provider','externalId','expectedValue','expectedStartAt','confirm']);result=await confirmHeight(env.DB,auth,body);
      }else if(path===BASE+'/export'){
        only(body,['expectedAccountId']);if(body.expectedAccountId!==auth.userId)throw fail('account_changed',409);result={connectedHealth:await exportData(env.DB,auth.userId)};
      }else return json({ok:false,error:'not_found'},404);
      return json({ok:true,...result});
    }catch(e){return json({ok:false,error:e.status?e.code:'connected_health_unavailable',message:e.status?'The request was not saved. Refresh your connection settings and try again.':'Connected health is unavailable. No success is being reported.'},e.status||503);}
  };
}
export {CONSENT_VERSION};
