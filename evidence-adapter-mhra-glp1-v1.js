const SOURCE_ID='mhra-glp1-guidance-r11';
const BASE_PATH='/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know';
const API_URL=`https://www.gov.uk/api/content${BASE_PATH}`;
const CONTENT_ID='2c9b4641-74ac-43e6-bbd6-7b1a34c13bc9';
const MAX_BYTES=512*1024;

async function readJsonBounded(response,maxBytes=MAX_BYTES){
  const length=Number(response.headers.get('content-length')||0);
  if(length>maxBytes)throw new Error('mhra_adapter_response_too_large');
  if(!response.body)throw new Error('mhra_adapter_empty_response');
  const reader=response.body.getReader(),chunks=[];let total=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxBytes)throw new Error('mhra_adapter_response_too_large');chunks.push(value)}
  }finally{reader.releaseLock()}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
  try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw new Error('mhra_adapter_invalid_json')}
}

function clean(value,max=5000){return String(value??'').trim().slice(0,max)}

export function extractMhraGlp1GuidanceFacts(content={}){
  if(content.base_path!==BASE_PATH||content.content_id!==CONTENT_ID)throw new Error('mhra_adapter_identity_mismatch');
  if(content.document_type!=='guidance'||content.schema_name!=='publication')throw new Error('mhra_adapter_schema_mismatch');
  const history=Array.isArray(content.details?.change_history)?content.details.change_history:[];
  const latest=history[0];
  if(!clean(content.title,300)||!clean(content.description,2000)||!latest?.public_timestamp||!clean(latest.note,5000))throw new Error('mhra_adapter_required_fact_missing');
  return{
    guidance_identity:{contentId:CONTENT_ID,basePath:BASE_PATH},
    guidance_summary:clean(content.description,2000),
    latest_update:{publicTimestamp:clean(latest.public_timestamp,50),note:clean(latest.note,5000)}
  };
}

export async function fetchMhraGlp1Guidance({fetchImpl=fetch,timeoutMs=10000}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort('mhra_adapter_timeout'),timeoutMs);
  try{
    const response=await fetchImpl(API_URL,{method:'GET',headers:{Accept:'application/json','User-Agent':'Shift-Evidence-Desk/1.1 (+https://shiftsometimber.co.uk)'},redirect:'error',signal:controller.signal});
    if(!response.ok)throw new Error(`mhra_adapter_http_${response.status}`);
    const type=String(response.headers.get('content-type')||'').toLowerCase();if(!type.includes('application/json'))throw new Error('mhra_adapter_unexpected_content_type');
    const content=await readJsonBounded(response);
    return{sourceId:SOURCE_ID,apiUrl:API_URL,fetchedAt:new Date().toISOString(),sourcePublishedAt:clean(content.public_updated_at,50)||null,contentHash:clean(response.headers.get('etag'),128)||null,facts:extractMhraGlp1GuidanceFacts(content)};
  }finally{clearTimeout(timer)}
}

export const MHRA_GLP1_R11={
  sourceId:SOURCE_ID,basePath:BASE_PATH,apiUrl:API_URL,contentId:CONTENT_ID,
  pagePath:'/glp1-knowledge-centre.html',contentKey:'mhra-glp1-latest-safety-update'
};
