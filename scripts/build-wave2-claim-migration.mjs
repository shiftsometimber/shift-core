import {readFileSync} from 'node:fs';

const register=JSON.parse(readFileSync(new URL('../evidence/seo-authority/phase3-wave2-claim-register-v152.json',import.meta.url),'utf8'));
if(register.claims?.length!==16)throw new Error(`expected_16_claims_got_${register.claims?.length}`);

const q=value=>`'${String(value??'').replaceAll("'","''")}'`;
const sourceId=url=>{
  const host=new URL(url).hostname.replace(/^www\./,'');
  if(host==='nice.org.uk')return'nice-ng246-central-adiposity';
  if(host==='gov.uk')return'govuk-sacn-nutrition';
  if(host==='nhs.uk'&&url.includes('/exercise/'))return'nhs-adult-physical-activity';
  if(host==='nhs.uk'&&url.includes('/calorie-counting'))return'nhs-better-health-calories';
  if(host==='nhs.uk')return'nhs-every-mind-matters';
  if(host==='pubmed.ncbi.nlm.nih.gov')return'pubmed-mifflin-st-jeor-2305711';
  throw new Error(`unmapped_source_${url}`);
};
const sourceRows={
  'nice-ng246-central-adiposity':['nice','NICE NG246 central adiposity','National Institute for Health and Care Excellence','https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity','nice.org.uk'],
  'govuk-sacn-nutrition':['uk_provider','SACN nutrition statements','UK Government','https://www.gov.uk/government/publications/sacn-statement-on-expressing-fat-and-carbohydrate-recommendations/sacn-statement-on-expressing-energy-fat-and-carbohydrate-intakes-and-recommendations','gov.uk'],
  'nhs-adult-physical-activity':['nhs','NHS adult physical activity guidance','NHS','https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/','nhs.uk'],
  'nhs-better-health-calories':['nhs','NHS Better Health calorie guidance','NHS','https://www.nhs.uk/better-health/lose-weight/calorie-counting/','nhs.uk'],
  'nhs-every-mind-matters':['nhs','NHS Every Mind Matters','NHS','https://www.nhs.uk/every-mind-matters/','nhs.uk'],
  'pubmed-mifflin-st-jeor-2305711':['clinical_trials','Mifflin–St Jeor equation paper','National Library of Medicine','https://pubmed.ncbi.nlm.nih.gov/2305711/','pubmed.ncbi.nlm.nih.gov']
};

const lines=[
  '-- Generated from the signed-off SEO Wave 2 V1.5.2 claim register.',
  '-- Claims only. No fetch, package, email, model, publish, newsletter or social action.',
  'BEGIN TRANSACTION;'
];
for(const [id,[family,name,authority,url,host]] of Object.entries(sourceRows)){
  lines.push(`INSERT INTO evidence_desk_sources(id,family,name,canonical_url,authority_name,extraction_method,status,trust_tier,cadence_minutes,allowed_hosts_json,config_json,updated_at) VALUES(${q(id)},${q(family)},${q(name)},${q(url)},${q(authority)},'manual_structured','draft',1,10080,${q(JSON.stringify([host]))},${q(JSON.stringify({monitorEnabled:false,wave:'SEO-PHASE-3-WAVE-2-V1.5.2'}))},CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET name=excluded.name,canonical_url=excluded.canonical_url,authority_name=excluded.authority_name,status='draft',allowed_hosts_json=excluded.allowed_hosts_json,config_json=excluded.config_json,updated_at=CURRENT_TIMESTAMP;`);
}
for(const claim of register.claims){
  const id=claim.id.toLowerCase();
  const status=claim.risk==='red'?'locked':'active';
  const communication=claim.risk==='red'?'clinical_safety':'general_information';
  const sid=sourceId(claim.source);
  lines.push(`INSERT INTO evidence_desk_claims(id,claim_text,claim_type,risk_lane,communication_class,status,owner,freshness_days,updated_at) VALUES(${q(id)},${q(claim.claim)},'factual',${q(claim.risk)},${q(communication)},${q(status)},${q(claim.owner)},90,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET claim_text=excluded.claim_text,risk_lane=excluded.risk_lane,communication_class=excluded.communication_class,status=excluded.status,owner=excluded.owner,updated_at=CURRENT_TIMESTAMP;`);
  lines.push(`DELETE FROM evidence_desk_claim_dependencies WHERE claim_id=${q(id)};`);
  lines.push(`DELETE FROM evidence_desk_page_dependencies WHERE claim_id=${q(id)};`);
  lines.push(`INSERT INTO evidence_desk_claim_dependencies(claim_id,source_id,fact_key,relation,required) VALUES(${q(id)},${q(sid)},${q(`wave2:${claim.id}`)},'supports',1);`);
  lines.push(`INSERT INTO evidence_desk_page_dependencies(claim_id,page_path,content_key,placement_type,channel,status) VALUES(${q(id)},${q(claim.url)},${q(`${claim.surface}:${claim.id}`)},${q(claim.surface)},'web','active');`);
}
lines.push(`INSERT INTO evidence_desk_decisions(package_id,event_id,decision,actor_name,actor_role,note,authority_ref,detail_json) VALUES(NULL,NULL,'claim_register_ingested','Matt O''Brien','owner','Sixteen Wave 2 claims mapped. No publication action.','SEO-PHASE-3-WAVE-2-V1.5.2',${q(JSON.stringify({claims:16,amber:12,red:4,publish:false,social:false,outbound:false}))});`);
lines.push('COMMIT;');
process.stdout.write(lines.join('\n')+'\n');
