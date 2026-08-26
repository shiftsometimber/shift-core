import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {commissionMhraGlp1R11,recordEvidenceObservation,runMhraGlp1R11} from '../evidence-desk-v1.js';
import {MHRA_GLP1_R11} from '../evidence-adapter-mhra-glp1-v1.js';

class Statement{constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args}bind(...args){return new Statement(this.db,this.sql,args)}async first(){return this.db.prepare(this.sql).get(...this.args)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.args)}}async run(){const result=this.db.prepare(this.sql).run(...this.args);return{...result,lastInsertRowid:result.lastInsertRowid}}}
class D1{constructor(){this.db=new DatabaseSync(':memory:')}prepare(sql){return new Statement(this.db,sql)}async exec(sql){this.db.exec(sql)}async batch(statements){this.db.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());this.db.exec('COMMIT');return out}catch(error){this.db.exec('ROLLBACK');throw error}}}

const DB=new D1();await commissionMhraGlp1R11(DB,{id:1,name:'Commissioning proof',role:'owner'});
await recordEvidenceObservation(DB,MHRA_GLP1_R11.sourceId,{facts:{guidance_identity:{contentId:MHRA_GLP1_R11.contentId,basePath:MHRA_GLP1_R11.basePath},guidance_summary:'Guidance on the safe and effective use of GLP-1 medicines for weight loss and diabetes.',latest_update:{publicTimestamp:'2026-01-29T14:20:34Z',note:"Updated attachment with new documents 'MHRA urges public to avoid illegal online weight-loss medicines this New Year' AND 'DSU: GLP-1 receptor agonists and dual GLP-1/ GIP receptor agonists: strengthened warnings on acute pancreatitis, including necrotising and fatal cases'"}},sourcePublishedAt:'2026-01-29T14:20:34Z',contentHash:'documented-prior-version'});
const result=await runMhraGlp1R11({DB},{force:true});
assert.equal(result.ok,true);assert.equal(result.state,'material_change');assert.ok(result.eventId);assert.ok(result.packageId);
const pkg=DB.db.prepare('SELECT risk_lane,communication_class,web_eligible,newsletter_eligible,social_eligible FROM evidence_desk_packages WHERE id=?').get(result.packageId);
assert.deepEqual({...pkg},{risk_lane:'red',communication_class:'clinical_safety',web_eligible:0,newsletter_eligible:0,social_eligible:0});
console.log(JSON.stringify({proof:'EVIDENCE_DESK_MHRA_GLP1_R11_LIVE_REPLAY',status:'PASS',officialSource:MHRA_GLP1_R11.apiUrl,eventId:result.eventId,packageId:result.packageId,riskLane:pkg.risk_lane,exactPage:MHRA_GLP1_R11.pagePath,publishing:{website:false,newsletter:false,social:false}}));
