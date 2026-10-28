export const testRecipient='shiftsometimber@gmail.com';
export const exportFields=Object.freeze({order_reference:'SHIFT order reference',order_date:'Order date (UTC)',supplier_sku:'Supplier product code',quantity:'Quantity',recipient:'Delivery recipient',address_line1:'Address line 1',address_line2:'Address line 2',city:'Town / city',region:'County / region',postcode:'Postcode',country:'Country code',customer_email:'Customer email'});
export const defaultColumns=Object.freeze([
 ['Order reference','order_reference',true],['Product code','supplier_sku',true],['Quantity','quantity',true],['Recipient','recipient',true],['Address line 1','address_line1',true],['Address line 2','address_line2',false],['Town / city','city',true],['County / region','region',false],['Postcode','postcode',true],['Country','country',true]
].map(([header,source,required])=>({header,source,required})));
export const parseJSON=(s,fallback={})=>{try{return JSON.parse(s);}catch{return fallback;}};
export const text=(v,max=250)=>String(v??'').trim().slice(0,max);
const unsafe=v=>/^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(String(v))||/[\r\n\t\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(String(v));
export function validateConfig(body){
 const columns=body.columns;
 if(!Array.isArray(columns)||columns.length<8||columns.length>20)throw Error('Choose between 8 and 20 CSV columns.');
 const used=new Set(),headers=new Set();
 const mapped=columns.map(c=>{if(!c||!Object.hasOwn(exportFields,c.source)||used.has(c.source))throw Error('Each CSV field must be valid and used once.');used.add(c.source);const header=text(c.header,100);if(!header||unsafe(header)||headers.has(header.toLowerCase()))throw Error('CSV column headings must be unique and plain text.');headers.add(header.toLowerCase());return {header,source:c.source,required:Boolean(c.required)};});
 for(const source of ['order_reference','supplier_sku','quantity','recipient','address_line1','city','postcode','country'])if(!mapped.some(c=>c.source===source&&c.required))throw Error('Required fulfilment fields cannot be removed.');
 if(![',',';','\t'].includes(body.delimiter))throw Error('Choose a supported CSV delimiter.');
 const delivery_method=body.delivery_method;
 if(!['unconfirmed','email','upload'].includes(delivery_method))throw Error('Choose the submission method.');
 const destination=text(body.destination,250);
 if(destination&&delivery_method==='email'&&!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(destination))throw Error('Enter one valid recipient email address.');
 if(destination&&delivery_method==='upload'){try{if(new URL(destination).protocol!=='https:')throw Error();}catch{throw Error('The upload destination must be an HTTPS address.');}}
 if(body.delivery_confirmed&&(!destination||delivery_method==='unconfirmed'))throw Error('Confirm the submission destination first.');
 const template_name=text(body.template_name,100);
 if(!template_name||/[\r\n]/.test(template_name))throw Error('Enter the CSV template name.');
 return {template_name,columns:mapped,delimiter:body.delimiter,utf8_bom:body.utf8_bom?1:0,template_confirmed:body.template_confirmed?1:0,delivery_method,destination:destination||null,delivery_confirmed:body.delivery_confirmed?1:0};
}
export function configProjection(row){return {...row,columns:parseJSON(row.columns_json,[]),columns_json:undefined,emailSendingEnabled:false,testRecipient};}
export function lineValues(row){
 const address=parseJSON(row.shipping_address_json,{}),value=v=>String(v??'').trim();
 return {order_reference:value(row.order_number),order_date:value(row.created_at),supplier_sku:value(row.supplier_sku),quantity:Number(row.quantity),recipient:value(row.shipping_name||row.customer_name),address_line1:value(address.line1),address_line2:value(address.line2),city:value(address.city),region:value(address.state),postcode:value(address.postal_code),country:value(address.country).toUpperCase(),customer_email:value(row.customer_email)};
}
export function lineIssues(row,config){
 const reasons=[];
 if(row.payment_status!=='paid'||row.stripe_payment_status!=='paid'||!String(row.stripe_checkout_session_id||'').startsWith('cs_live_'))reasons.push('A verified live payment is required.');
 if(!['new','paid','processing'].includes(row.order_status))reasons.push('This order is cancelled, refunded or already fulfilled.');
 if(Number(row.refunded_pence)>0)reasons.push('A refund needs reconciling before fulfilment.');
 if(!row.catalogue_id)reasons.push('The testing product is not mapped to the catalogue.');
 if(row.supplier_state==='coming_soon')reasons.push('This product is marked coming soon.');
 const values=lineValues(row);
 if(!Number.isSafeInteger(values.quantity)||values.quantity<1||values.quantity>99)reasons.push('The quantity is invalid.');
 for(const col of config.columns){const value=values[col.source];if(String(value??'').length>250)reasons.push(exportFields[col.source]+' is too long; correct the order before exporting.');if(col.required&&(value===null||value===undefined||value===''))reasons.push('Missing '+exportFields[col.source]+'.');if(typeof value==='string'&&unsafe(value))reasons.push(exportFields[col.source]+' contains unsupported control or formula-like text.');}
 if(!/^[A-Z]{2}$/.test(values.country))reasons.push('A two-letter delivery country code is required.');
 return [...new Set(reasons)];
}
export function csvText(rows,config){
 const cell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 for(const row of rows)for(const col of config.columns)if(typeof row[col.source]==='string'&&unsafe(row[col.source]))throw Error('Unsupported CSV cell content.');
 const lines=[config.columns.map(c=>cell(c.header)),...rows.map(row=>config.columns.map(c=>cell(row[c.source])))];
 return (config.utf8_bom?'\uFEFF':'')+lines.map(row=>row.join(config.delimiter)).join('\r\n')+'\r\n';
}
export async function sha256(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function syntheticRows(){return [
 {source_order_id:-1,source_line_id:-1,order_number:'TEST-ONLY-001',catalogue_id:'prostate-health',name:'Prostate Health',supplier_sku:'TEST-ONLY-PROSTATE',quantity:1,shipping_name:'Synthetic Test Customer',shipping_address_json:JSON.stringify({line1:'1 Example Street',line2:'Test data only',city:'Example Town',postal_code:'TE1 1ST',country:'GB'}),customer_email:'test-customer@example.invalid',created_at:'2026-10-28T12:00:00Z'},
 {source_order_id:-1,source_line_id:-2,order_number:'TEST-ONLY-001',catalogue_id:'vitamin-d',name:'Vitamin D',supplier_sku:'TEST-ONLY-VITD',quantity:2,shipping_name:'Synthetic Test Customer',shipping_address_json:JSON.stringify({line1:'1 Example Street',line2:'Test data only',city:'Example Town',postal_code:'TE1 1ST',country:'GB'}),customer_email:'test-customer@example.invalid',created_at:'2026-10-28T12:00:00Z'}
];}
export function emailDraft(batch){
 const config=parseJSON(batch.config_json),test=batch.mode==='test';
 const to=test?[testRecipient]:config.delivery_method==='email'&&config.delivery_confirmed&&config.destination?[config.destination]:[];
 const filename=(test?'TEST-ONLY-':'')+'SHIFT-testing-'+batch.id+'.csv';
 return {to,cc:[],subject:(test?'TEST ONLY — DO NOT FULFIL — ':'')+'SHIFT testing orders · '+batch.id,body:test?'Hi Matt,\n\nThis is a test of the SHIFT testing-order CSV process.\n\nThe attached file contains synthetic data only. No customer order has been placed, paid for or sent for fulfilment. The column layout is an internal test format unless the partner template has been confirmed.\n\nPlease do not fulfil these rows.\n\nSHIFT Health':"Hello,\n\nPlease find attached SHIFT testing order batch "+batch.id+", containing "+batch.order_count+" order(s) and "+batch.row_count+" product line(s).\n\nPlease confirm receipt and let us know about any rejected rows. Please return dispatch and tracking details against the SHIFT order references.\n\nThank you,\nMatt\nSHIFT Health",attachments:[{filename,mimeType:'text/csv; charset=utf-8',sha256:batch.csv_sha256,rows:batch.row_count}],sendingEnabled:false};
}
const base64=value=>{const bytes=new TextEncoder().encode(value);let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out).match(/.{1,76}/g)?.join('\r\n')||'';};
const mimeHeader=value=>{const parts=[];let piece='';for(const char of value){if(new TextEncoder().encode(piece+char).length>42){parts.push('=?UTF-8?B?'+base64(piece).replaceAll('\r\n','')+'?=');piece=char;}else piece+=char;}if(piece)parts.push('=?UTF-8?B?'+base64(piece).replaceAll('\r\n','')+'?=');return parts.join('\r\n ');};
export function emailFile(batch,reviewed){
 const draft=reviewed||emailDraft(batch);if(!draft.to.length)throw Error('The email recipient has not been confirmed.');
 const boundary='shift-review-'+batch.id.replace(/[^a-z0-9-]/gi,'');
 return ['X-Unsent: 1',...(draft.from?['From: '+draft.from,'Reply-To: '+draft.replyTo]:[]),'To: '+draft.to.join(', '),'Cc:','Subject: '+mimeHeader(draft.subject),'MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="'+boundary+'"','', '--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',base64(draft.body),'--'+boundary,'Content-Type: text/csv; charset=UTF-8; name="'+draft.attachments[0].filename+'"','Content-Disposition: attachment; filename="'+draft.attachments[0].filename+'"','Content-Transfer-Encoding: base64','',base64(batch.csv_text),'--'+boundary+'--',''].join('\r\n');
}
