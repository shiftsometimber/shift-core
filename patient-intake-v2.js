import {patientRefund} from './patient-refund-v2.js';
import {clinicalPolicy,clinicalAnswers,needsUrgentHelp} from './patient-questionnaire-v2.js';
// SHIFT-owned paid-order intake. Disabled unless explicitly commissioned.
const fields=['firstName','lastName','email','phone','dateOfBirth','addressLine1','addressLine2','town','postcode','country','deliveryDifferent','deliveryLine1','deliveryLine2','deliveryTown','deliveryPostcode','weightUnit','weightKg','weightStone','weightLb','heightUnit','heightCm','heightMetres','heightFeet','heightInches','gpPractice','gpCode','gpAddress','gpPostcode','gpContactConsent','conditions','medicines','allergies','previousTreatment','previousMedicine','previousDoseMg','lastDoseDate','treatmentBreaks','sideEffects','imageConsent','dataConsent','answersConfirmed'];
const slots=['photoId','bodyFront','bodySide','previousEvidence'];
const encoder=new TextEncoder(), decoder=new TextDecoder();
const stamp=()=>new Date().toISOString();
const response=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const b64=bytes=>{let s='';for(const x of bytes)s+=String.fromCharCode(x);return btoa(s)};
const un64=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
export const intakeEnabled=env=>env.MEDICINE_INTAKE_V2_ENABLED==='true';
export function intakeReady(env){return Boolean(env.PATIENT_EVIDENCE&&/^[a-f0-9]{64}$/i.test(env.PATIENT_DATA_KEY||''))}
async function key(env){return crypto.subtle.importKey('raw',Uint8Array.from(env.PATIENT_DATA_KEY.match(/../g),x=>parseInt(x,16)),'AES-GCM',false,['encrypt','decrypt'])}
async function seal(env,bytes,context){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(context)},await key(env),bytes);return JSON.stringify({v:1,iv:b64(iv),cipher:b64(new Uint8Array(cipher))})}
async function open(env,value,context){const x=JSON.parse(value);return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(x.iv),additionalData:encoder.encode(context)},await key(env),un64(x.cipher)))}
async function schema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS patient_intakes_v2(order_number TEXT PRIMARY KEY,user_id INTEGER NOT NULL,version INTEGER NOT NULL DEFAULT 0,answers_encrypted TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',partner_reference TEXT,delivery_key TEXT,lease_until TEXT,submitted_at TEXT,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS patient_evidence_v2(id TEXT PRIMARY KEY,order_number TEXT NOT NULL,user_id INTEGER NOT NULL,slot TEXT NOT NULL,object_key TEXT NOT NULL,mime_type TEXT NOT NULL,byte_size INTEGER NOT NULL,created_at TEXT NOT NULL,UNIQUE(order_number,slot));
CREATE TABLE IF NOT EXISTS patient_intake_audit_v2(id INTEGER PRIMARY KEY AUTOINCREMENT,order_number TEXT NOT NULL,user_id INTEGER NOT NULL,action TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS patient_lookup_limits_v2(user_id INTEGER NOT NULL,minute TEXT NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(user_id,minute));`)}
async function audit(DB,order,user,action){await DB.prepare('INSERT INTO patient_intake_audit_v2(order_number,user_id,action,created_at) VALUES(?,?,?,?)').bind(order,user,action,stamp()).run()}
async function readBody(request){const raw=await request.text();if(encoder.encode(raw).length>64000)throw fail('Assessment is too large.');try{return JSON.parse(raw)}catch{throw fail('Invalid assessment data.')}}
export function normaliseAnswers(input,complete=false){const a={};for(const f of fields){const v=input[f];a[f]=['gpContactConsent','imageConsent','dataConsent','answersConfirmed','deliveryDifferent'].includes(f)?v===true:String(v??'').trim().slice(0,4000)}
 const num=v=>v===''?NaN:Number(v);
 const kg=a.weightUnit==='st'?num(a.weightStone)*6.35029318+num(a.weightLb)*0.45359237:num(a.weightKg);
 const cm=a.heightUnit==='ft'?num(a.heightFeet)*30.48+num(a.heightInches)*2.54:a.heightUnit==='m'?num(a.heightMetres)*100:num(a.heightCm);
 a.weightKg=Number.isFinite(kg)?Math.round(kg*100)/100:'';a.heightCm=Number.isFinite(cm)?Math.round(cm*100)/100:'';
 a.bmi=Number.isFinite(kg)&&cm>0?Math.round(kg/(cm/100)**2*10)/10:null;
 if(!complete)return a;
 for(const f of ['firstName','lastName','email','phone','dateOfBirth','addressLine1','town','postcode','country','gpPractice','gpAddress','gpPostcode','conditions','medicines','allergies','previousTreatment'])if(!a[f])throw fail(`Complete ${f}.`);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email))throw fail('Enter a valid email address.');
 if(!/^[+\d ()-]{7,25}$/.test(a.phone))throw fail('Enter a valid phone number.');
 if(!['GB'].includes(a.country))throw fail('A UK address is required.');
 const postcode=/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
 if(!postcode.test(a.postcode)||!postcode.test(a.gpPostcode))throw fail('Check the patient and GP postcodes.');
 if(a.deliveryDifferent&&(!a.deliveryLine1||!a.deliveryTown||!postcode.test(a.deliveryPostcode)))throw fail('Complete the delivery address.');
 const date=new Date(a.dateOfBirth+'T12:00:00Z'),today=new Date(),adult=new Date(today);adult.setUTCFullYear(adult.getUTCFullYear()-18);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(a.dateOfBirth)||!Number.isFinite(+date)||date.toISOString().slice(0,10)!==a.dateOfBirth||date>adult||today.getUTCFullYear()-date.getUTCFullYear()>120)throw fail('Enter a valid adult date of birth.');
 if(!['kg','st'].includes(a.weightUnit)||!['cm','m','ft'].includes(a.heightUnit)||!(kg>=30&&kg<=400&&cm>=100&&cm<=250))throw fail('Check your height, weight and units.');
 if(a.weightUnit==='st'&&(!Number.isInteger(num(a.weightStone))||num(a.weightLb)<0||num(a.weightLb)>=14))throw fail('Pounds must be between 0 and less than 14.');
 if(a.heightUnit==='ft'&&(!Number.isInteger(num(a.heightFeet))||num(a.heightInches)<0||num(a.heightInches)>=12))throw fail('Inches must be between 0 and less than 12.');
 if(!['new','switching','returning'].includes(a.previousTreatment))throw fail('Choose your treatment history.');
 if(a.previousTreatment!=='new'){
  const last=new Date(a.lastDoseDate+'T12:00:00Z');
  if(!a.previousMedicine||!(num(a.previousDoseMg)>0&&num(a.previousDoseMg)<=1000)||!/^\d{4}-\d{2}-\d{2}$/.test(a.lastDoseDate)||!Number.isFinite(+last)||last.toISOString().slice(0,10)!==a.lastDoseDate||a.lastDoseDate>today.toISOString().slice(0,10)||!a.treatmentBreaks||!a.sideEffects)throw fail('Complete previous medicine, dose, last dose date, breaks and side effects.');
 }else for(const f of ['previousMedicine','previousDoseMg','lastDoseDate','treatmentBreaks','sideEffects'])a[f]='';
 for(const f of ['gpContactConsent','imageConsent','dataConsent','answersConfirmed'])if(!a[f])throw fail('Complete each confirmation before submitting.');
 return a;
}
async function fileType(file,slot){const bytes=new Uint8Array(await file.arrayBuffer());const type=file.type;let valid=false;
 if(type==='image/jpeg')valid=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==='image/png')valid=[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 if(['image/heic','image/heif'].includes(type))valid=decoder.decode(bytes.slice(4,8))==='ftyp'&&/heic|heix|hevc|hevx|mif1/.test(decoder.decode(bytes.slice(8,32)));
 if(slot==='previousEvidence'&&type==='application/pdf')valid=decoder.decode(bytes.slice(0,5))==='%PDF-';
 if(!valid)throw fail('Use a valid JPEG, PNG or HEIC image; previous-treatment evidence can also be a PDF.');return bytes;
}
async function evidence(DB,order,user){return(await DB.prepare('SELECT id,slot,mime_type,byte_size FROM patient_evidence_v2 WHERE order_number=? AND user_id=?').bind(order,user).all()).results||[]}
async function lookup(request,env,user){const url=new URL(request.url),kind=url.searchParams.get('kind'),q=(url.searchParams.get('q')||'').trim();if(!['address','gp'].includes(kind)||q.length<3||q.length>100)return response({results:[]});
 const minute=stamp().slice(0,16);await env.DB.prepare('INSERT INTO patient_lookup_limits_v2(user_id,minute,count) VALUES(?,?,1) ON CONFLICT(user_id,minute) DO UPDATE SET count=count+1').bind(user.id,minute).run();const count=await env.DB.prepare('SELECT count FROM patient_lookup_limits_v2 WHERE user_id=? AND minute=?').bind(user.id,minute).first();if(count.count>30)return response({results:[],manual:true,message:'Please enter the details manually or try again shortly.'},429);
 // Provider-neutral server-side adapters. Contract documented with the release.
 const endpoint=kind==='address'?env.PATIENT_ADDRESS_LOOKUP_URL:env.PATIENT_GP_LOOKUP_URL;
 if(!endpoint)return response({results:[],manual:true,message:'Search is not connected yet. Please enter the details below.'});
 try{const target=new URL(endpoint);if(target.protocol!=='https:')throw Error();target.searchParams.set('q',q);const r=await fetch(target,{headers:{authorization:`Bearer ${env.PATIENT_LOOKUP_SECRET||''}`},redirect:'error',signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error();const b=await r.json();return response({results:(b.results||[]).slice(0,10).map(x=>({id:String(x.id||'').slice(0,100),label:String(x.label||'').slice(0,300),line1:String(x.line1||'').slice(0,200),line2:String(x.line2||'').slice(0,200),town:String(x.town||'').slice(0,100),postcode:String(x.postcode||'').slice(0,12),practice:String(x.practice||'').slice(0,200)}))});}catch{return response({results:[],manual:true,message:'Search is unavailable. You can still enter your details manually.'})}
}
async function transfer(env,intake,order,user){
 if(intake.status==='submitted')return response({ok:true,status:'submitted',reference:intake.partner_reference});
 if(!env.PHARMACY_PATIENT_INTAKE_V2_URL||!env.PHARMACY_INTEGRATION_SECRET)return response({ok:true,status:'queued',message:'Saved securely in SHIFT. Awaiting connection to the pharmacy; not yet received or approved by a prescriber.'},202);
 const lease=new Date(Date.now()+90000).toISOString();const claimed=await env.DB.prepare("UPDATE patient_intakes_v2 SET lease_until=? WHERE order_number=? AND status='queued' AND (lease_until IS NULL OR lease_until<?)").bind(lease,order.order_number,stamp()).run();if(!claimed.meta.changes)return response({ok:true,status:'queued',message:'Transfer already in progress. Check again shortly.'},202);
 try{const target=new URL(env.PHARMACY_PATIENT_INTAKE_V2_URL);if(target.protocol!=='https:')throw Error();const a=JSON.parse(decoder.decode(await open(env,intake.answers_encrypted,order.order_number)));
  const attachments=[];for(const e of(await env.DB.prepare('SELECT * FROM patient_evidence_v2 WHERE order_number=?').bind(order.order_number).all()).results){const stored=await env.PATIENT_EVIDENCE.get(e.object_key);if(!stored)throw Error();attachments.push({slot:e.slot,mimeType:e.mime_type,contentBase64:b64(await open(env,await stored.text(),e.object_key))})}
  const r=await fetch(target,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${env.PHARMACY_INTEGRATION_SECRET}`,'idempotency-key':intake.delivery_key},body:JSON.stringify({schema:'shift-patient-intake/v2',orderNumber:order.order_number,memberReference:String(user.id),variantId:order.variant_id,requestedMedicine:order.medicine_name,requestedStrength:order.strength_label,assessment:a,evidence:attachments,consentVersion:'shift-intake-v2-2026-09-13'}),redirect:'error',signal:AbortSignal.timeout(20000)});
  const result=await r.json();if(!r.ok||typeof result.reference!=='string'||!result.reference.trim())throw Error();
  const submitted=stamp();await env.DB.batch([env.DB.prepare("UPDATE patient_intakes_v2 SET status='submitted',partner_reference=?,submitted_at=?,lease_until=NULL,updated_at=? WHERE order_number=? AND status='queued'").bind(result.reference.slice(0,160),submitted,submitted,order.order_number),env.DB.prepare("UPDATE medicine_orders SET clinical_intake_submitted_at=?,clinical_status='assessment_pending',updated_at=? WHERE order_number=? AND status='paid'").bind(submitted,submitted,order.order_number)]);await audit(env.DB,order.order_number,user.id,'partner.accepted');return response({ok:true,status:'submitted',message:'The pharmacy has received your assessment. Clinical approval is still pending.'});
 }catch{await env.DB.prepare('UPDATE patient_intakes_v2 SET lease_until=NULL WHERE order_number=?').bind(order.order_number).run();await audit(env.DB,order.order_number,user.id,'partner.retry_required');return response({ok:true,status:'queued',message:'Your assessment is saved. The pharmacy has not confirmed receipt. Retry the transfer here; no further payment is needed.'},202)}
}
export async function patientIntakeRoutes(request,env,{member,commerceSchema}){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/v1/patient-intake'))return null;
 if(!intakeEnabled(env))return response({error:'not_enabled'},404);
 const origin=request.headers.get('origin');const allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk',env.PUBLIC_SITE_URL]);
 if(!['GET','HEAD'].includes(request.method)&&origin&&!allowed.has(origin))return response({error:'origin_not_allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204});
 const user=await member(request,env);if(!user||Number(user.email_verified)!==1)return response({error:'Sign in to your verified My Timber account.'},401);
 if(!intakeReady(env))return response({error:'Secure assessment storage is not configured.'},503);
 await commerceSchema(env);await schema(env.DB);
 try{
  if(path==='/v1/patient-intake/lookup'&&request.method==='GET')return lookup(request,env,user);
  const orderNumber=url.searchParams.get('order')||'';
  const order=await env.DB.prepare('SELECT * FROM medicine_orders WHERE order_number=? AND user_id=?').bind(orderNumber,user.id).first();
  if(!order||order.intake_flow!=='shift_v2')return response({error:'Order not found.'},404);
  if(!['paid','refunded'].includes(order.status))return response({error:'Payment is not confirmed yet. Please refresh shortly.'},409);
  let intake=await env.DB.prepare('SELECT * FROM patient_intakes_v2 WHERE order_number=? AND user_id=?').bind(orderNumber,user.id).first();
  if(!intake){await env.DB.prepare('INSERT OR IGNORE INTO patient_intakes_v2(order_number,user_id,answers_encrypted,updated_at) VALUES(?,?,?,?)').bind(orderNumber,user.id,await seal(env,encoder.encode(JSON.stringify({firstName:user.first_name||'',lastName:user.last_name||'',email:user.email||'',country:'GB',weightUnit:'kg',heightUnit:'cm'})),orderNumber),stamp()).run();intake=await env.DB.prepare('SELECT * FROM patient_intakes_v2 WHERE order_number=? AND user_id=?').bind(orderNumber,user.id).first()}
  if(path==='/v1/patient-intake'&&request.method==='GET'){await audit(env.DB,orderNumber,user.id,'member.read');return response({ok:true,order:{number:orderNumber,medicine:order.medicine_name,strength:order.strength_label,payment:order.status,clinicalStatus:order.clinical_status},version:intake.version,status:intake.status,answers:JSON.parse(decoder.decode(await open(env,intake.answers_encrypted,orderNumber))),evidence:await evidence(env.DB,orderNumber,user.id),questionnaire:clinicalPolicy(env)})}
  if(path==='/v1/patient-intake/evidence'&&request.method==='GET'){
   const e=await env.DB.prepare('SELECT * FROM patient_evidence_v2 WHERE id=? AND order_number=? AND user_id=?').bind(url.searchParams.get('id'),orderNumber,user.id).first();if(!e)return response({error:'Evidence not found.'},404);const stored=await env.PATIENT_EVIDENCE.get(e.object_key);if(!stored)return response({error:'Evidence unavailable.'},404);await audit(env.DB,orderNumber,user.id,'evidence.read');return new Response(await open(env,await stored.text(),e.object_key),{headers:{'content-type':e.mime_type,'content-disposition':`attachment; filename="${e.slot}.${e.mime_type==='application/pdf'?'pdf':e.mime_type.split('/')[1]}"`,'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"sandbox; default-src 'none'"}});
  }
  if(path==='/v1/patient-intake/refund'&&request.method==='POST')return patientRefund(request,env,order,user);
  if(order.status!=='paid'||['approved','declined','refund_pending','refunded','dispensing','dispatched','fulfilled'].includes(order.clinical_status))throw fail('This order is locked for assessment changes.',409);
  if(path==='/v1/patient-intake/retry'&&request.method==='POST'){if(!['queued','submitted'].includes(intake.status))throw fail('Submit the assessment first.',409);return transfer(env,intake,order,user)}
  if(path==='/v1/patient-intake/reopen'&&request.method==='POST'){
   if(order.clinical_status!=='more_information_required'||intake.status!=='submitted')throw fail('The pharmacy has not requested an update.',409);
   await env.DB.prepare("UPDATE patient_intakes_v2 SET status='draft',version=version+1,updated_at=? WHERE order_number=? AND status='submitted'").bind(stamp(),orderNumber).run();await audit(env.DB,orderNumber,user.id,'member.reopened');return response({ok:true});
  }
  if(intake.status!=='draft')throw fail('This submitted assessment is locked. Use the transfer status or requested-update action.',409);
  if(path==='/v1/patient-intake'&&request.method==='POST'){
   const input=await readBody(request),answers=normaliseAnswers(input.answers||{});answers.clinical=clinicalAnswers(input.answers?.clinical,clinicalPolicy(env));answers.questionnaireVersion=clinicalPolicy(env).version;if(input.version!==intake.version)throw fail('Your assessment changed in another tab. Reload before saving.',409);
   const encrypted=await seal(env,encoder.encode(JSON.stringify(answers)),orderNumber);const updated=await env.DB.prepare("UPDATE patient_intakes_v2 SET answers_encrypted=?,version=version+1,updated_at=? WHERE order_number=? AND user_id=? AND version=? AND status='draft'").bind(encrypted,stamp(),orderNumber,user.id,input.version).run();if(!updated.meta.changes)throw fail('Your assessment changed. Reload before saving.',409);await audit(env.DB,orderNumber,user.id,'draft.saved');return response({ok:true,version:input.version+1});
  }
  if(path==='/v1/patient-intake/evidence'&&request.method==='POST'){
   if(Number(request.headers.get('content-length')||0)>9*1024*1024)throw fail('Upload must be under 8 MB.');const form=await request.formData(),slot=String(form.get('slot')),file=form.get('file');
   if(!slots.includes(slot)||!(file instanceof File)||!file.size||file.size>8*1024*1024)throw fail('Choose one evidence file under 8 MB.');
   const bytes=await fileType(file,slot),id=crypto.randomUUID(),objectKey=`patient-intake/v2/${user.id}/${orderNumber}/${id}`;
   await env.PATIENT_EVIDENCE.put(objectKey,await seal(env,bytes,objectKey),{httpMetadata:{contentType:'application/octet-stream'}});
   const previous=await env.DB.prepare('SELECT object_key FROM patient_evidence_v2 WHERE order_number=? AND slot=?').bind(orderNumber,slot).first();
   try{const result=await env.DB.prepare("INSERT INTO patient_evidence_v2(id,order_number,user_id,slot,object_key,mime_type,byte_size,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM patient_intakes_v2 WHERE order_number=? AND status='draft') ON CONFLICT(order_number,slot) DO UPDATE SET id=excluded.id,object_key=excluded.object_key,mime_type=excluded.mime_type,byte_size=excluded.byte_size,created_at=excluded.created_at").bind(id,orderNumber,user.id,slot,objectKey,file.type,file.size,stamp(),orderNumber).run();if(!result.meta.changes)throw fail('Assessment was submitted during upload. Reload.',409);}catch(error){await env.PATIENT_EVIDENCE.delete(objectKey);throw error}
   if(previous)await env.PATIENT_EVIDENCE.delete(previous.object_key);await audit(env.DB,orderNumber,user.id,'evidence.saved');return response({ok:true,evidence:await evidence(env.DB,orderNumber,user.id)});
  }
  if(path==='/v1/patient-intake/submit'&&request.method==='POST'){
   const input=await readBody(request);if(input.version!==intake.version)throw fail('Reload the latest saved assessment before submitting.',409);
   const storedAnswers=JSON.parse(decoder.decode(await open(env,intake.answers_encrypted,orderNumber)));
   const answers=normaliseAnswers(storedAnswers,true);const policy=clinicalPolicy(env);if(storedAnswers.questionnaireVersion!==policy.version)throw fail('The clinical questionnaire has changed. Reload and check your answers.',409);
   try{answers.clinical=clinicalAnswers(storedAnswers.clinical,policy,true)}catch(error){throw fail(error.message)}answers.questionnaireVersion=policy.version;
   if(needsUrgentHelp(answers.clinical))throw fail('Please seek urgent support now rather than waiting for an order review. If you cannot keep yourself safe, call 999 or go to A&E. This form is not monitored for emergencies. Your draft remains saved.',422);
   const uploaded=await evidence(env.DB,orderNumber,user.id);const required=['photoId','bodyFront','bodySide',...(answers.previousTreatment==='new'?[]:['previousEvidence'])];for(const slot of required)if(!uploaded.some(e=>e.slot===slot))throw fail(`Upload ${slot} before submitting.`);
   const deliveryKey=crypto.randomUUID();const result=await env.DB.prepare("UPDATE patient_intakes_v2 SET status='queued',answers_encrypted=?,delivery_key=?,updated_at=? WHERE order_number=? AND version=? AND status='draft'").bind(await seal(env,encoder.encode(JSON.stringify(answers)),orderNumber),deliveryKey,stamp(),orderNumber,input.version).run();if(!result.meta.changes)throw fail('Assessment changed. Reload before submitting.',409);
   await audit(env.DB,orderNumber,user.id,'assessment.queued');intake=await env.DB.prepare('SELECT * FROM patient_intakes_v2 WHERE order_number=?').bind(orderNumber).first();return transfer(env,intake,order,user);
  }
  return response({error:'Not found.'},404);
 }catch(error){return response({error:error.status?error.message:'We could not complete that action. Your saved assessment has been retained.'},error.status||500)}
}
