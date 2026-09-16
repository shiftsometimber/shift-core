import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

export const identity={account:'9e5386dcf455be34c582d93f8bfc79e6',id:'8cbbd1f2-86bb-47a3-9b1a-e4735c3252c3',name:'shift-evidence-desk-r12-nonprod-db',productionId:'88f40aed-cb23-4372-8c94-8a73f48bc847'};
export const tables=['evidence_desk_control','evidence_desk_sources','evidence_desk_claims','evidence_desk_claim_dependencies','evidence_desk_page_dependencies','evidence_desk_events','evidence_desk_packages','evidence_desk_decisions','evidence_desk_notifications'];
export const query=`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${tables.map(name=>`'${name}'`).join(',')});
SELECT id,enabled,ingestion_enabled,decision_email_enabled,website_publish_enabled,newsletter_enabled,social_enabled FROM evidence_desk_control WHERE id=1;`;

export function verifyConfig(config,account){
  assert.equal(account,identity.account,'Unexpected Cloudflare account');
  const bindings=config.d1_databases||[],main=bindings.filter(row=>row.binding==='DB'),read=bindings.filter(row=>row.binding==='EVIDENCE_DESK_READ_DB');
  assert.equal(main.length,1);assert.equal(read.length,1);
  assert.equal(main[0].database_id,identity.productionId);
  assert.equal(read[0].database_id,identity.id);assert.equal(read[0].database_name,identity.name);
  assert.notEqual(read[0].database_id,main[0].database_id,'Evidence Inbox must not use production D1');
  assert.equal(config.vars?.EVIDENCE_DESK_READ_ENV,'non-production');
}

export function verifyRemote(databases,response){
  assert(Array.isArray(databases),'Invalid provider database list');
  const matches=databases.filter(row=>(row.uuid||row.database_id||row.id)===identity.id&&row.name===identity.name);
  assert.equal(matches.length,1,'The verified isolated database is absent or ambiguous in this account');
  assert(Array.isArray(response)&&response.length===2&&response.every(row=>row.success===true&&Array.isArray(row.results)),'Staging read-only query failed or returned an unexpected wrapper');
  assert.deepEqual(response[0].results.map(row=>row.name).sort(),[...tables].sort(),'Staging Evidence Inbox schema is incomplete');
  assert.equal(response[1].results.length,1,'Expected the existing single staging control row');
  const control=response[1].results[0];assert.equal(control.id,1);
  for(const key of ['enabled','ingestion_enabled','decision_email_enabled','website_publish_enabled','newsletter_enabled','social_enabled'])assert([0,1].includes(control[key]),'Invalid staging control value: '+key);
  return{status:'pass',database:identity.name,databaseId:identity.id,account:identity.account,requiredTables:tables.length,existingControlRow:true,databaseWrites:false,operationalControlsChanged:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const require=createRequire(import.meta.url);
  const config=require('wrangler').experimental_readRawConfig({config:'wrangler.jsonc'}).rawConfig;
  verifyConfig(config,process.env.CLOUDFLARE_ACCOUNT_ID);
  if(process.argv[2]==='--sql')process.stdout.write(query+'\n');
  else{
    assert(process.argv.length===4,'Usage: node scripts/verify-evidence-inbox-connection.mjs <d1-list.json> <inbox-query.json>');
    console.log(JSON.stringify(verifyRemote(JSON.parse(readFileSync(process.argv[2],'utf8')),JSON.parse(readFileSync(process.argv[3],'utf8')))));
  }
}
