import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {medicineCommerceRoutes} from '../medicine-commerce-v1.js';

function assessment(overrides = {}) {
  const form = new FormData();
  const values = {
    variantId:'102',dateOfBirth:'1981-08-03',heightCm:'180',weightKg:'100',
    weightRelatedCondition:'no',conditions:'None',medicines:'None',insulinUse:'no',
    previousTreatment:'no',gpName:'Dr Test',gpPractice:'Synthetic Practice',
    gpAddress:'Test address',gpPostcode:'AA1 1AA',
    gpContactConsent:'on',answersConfirmed:'on',imageConsent:'on',...overrides,
  };
  for (const [key,value] of Object.entries(values)) if(value !== undefined) form.set(key,value);
  for(const name of ['photoId','bodyFront','bodySide'])
    form.set(name,new File(['synthetic image'],name+'.jpg',{type:'image/jpeg'}));
  return form;
}

async function submit(form) {
  const sent = [];
  const db = {prepare(sql){return {bind(){return this},async run(){return {meta:{changes:1}}},
    async first(){
      if(sql.includes('user_sessions')) return {id:42,email:'member@example.test',email_verified:1,expires_at:'2099-01-01T00:00:00Z'};
      if(sql.includes('FROM medicine_variants')) return {
        id:102,form:'injection',name:'Mounjaro',variant_status:'available',
        medicine_status:'available',variant_sellable:1,medicine_sellable:1,
        variant_partner:'synthetic',medicine_partner:'synthetic',
        variant_availability:'available',medicine_availability:'available',
        stock_on_hand:10,reserved:0,
      };
      return null;
    }}},async batch(){return []}};
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url,init) => {
    sent.push({url,fields:Object.fromEntries(init.body)});
    return Response.json({reference:'synthetic-reference',status:'submitted'});
  };
  try {
    const response = await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/commerce/medicine-clinical-intake',{
      method:'POST',headers:{Cookie:'sst_session=synthetic-token'},body:form,
    }),{DB:db,PHARMACY_CLINICAL_INTAKE_URL:'https://pharmacy.example.test/intake',PHARMACY_INTEGRATION_SECRET:'synthetic-only'},{});
    return {status:response.status,body:await response.json(),sent};
  } finally {globalThis.fetch=originalFetch}
}

for (const [label,fields] of [
  ['missing previous-treatment answer',{previousTreatment:undefined}],
  ['invalid previous-treatment answer',{previousTreatment:'sometimes'}],
  ['missing previous medicine',{previousTreatment:'yes',previousDose:'5 mg',lastDoseDate:'2026-01-01'}],
  ['missing previous dose',{previousTreatment:'yes',previousMedicine:'Mounjaro',lastDoseDate:'2026-01-01'}],
  ['missing last-dose date',{previousTreatment:'yes',previousMedicine:'Mounjaro',previousDose:'5 mg'}],
  ['impossible last-dose date',{previousTreatment:'yes',previousMedicine:'Mounjaro',previousDose:'5 mg',lastDoseDate:'2026-02-30'}],
  ['future last-dose date',{previousTreatment:'yes',previousMedicine:'Mounjaro',previousDose:'5 mg',lastDoseDate:'2099-01-01'}],
]) test('intake rejects '+label+' before contacting a pharmacy',async()=>{
  const result=await submit(assessment(fields));
  assert.equal(result.status,400);
  assert.equal(result.sent.length,0);
});

test('intake rejects an overlong history instead of silently truncating it',async()=>{
  const result=await submit(assessment({conditions:'a'.repeat(1001)}));
  assert.equal(result.status,400);
  assert.equal(result.sent.length,0);
});

test('intake forwards a complete previous-treatment answer unchanged',async()=>{
  const result=await submit(assessment({previousTreatment:'yes',previousMedicine:'Mounjaro',previousDose:'5 mg',lastDoseDate:'2026-01-01'}));
  assert.equal(result.status,202);
  assert.equal(result.sent.length,1);
  for(const [key,value] of Object.entries({previousTreatment:'yes',previousMedicine:'Mounjaro',previousDose:'5 mg',lastDoseDate:'2026-01-01'}))
    assert.equal(result.sent[0].fields[key],value);
});

test('a no answer does not forward stale hidden previous-treatment details',async()=>{
  const result=await submit(assessment({previousMedicine:'Old medicine',previousDose:'Old dose',lastDoseDate:'2026-01-01'}));
  assert.equal(result.status,202);
  assert.equal(result.sent.length,1);
  for(const key of ['previousMedicine','previousDose','lastDoseDate'])
    assert.equal(result.sent[0].fields[key],'');
});

function sessionStorage() {
  const values=new Map();
  return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
}

async function productPage(search='') {
  const nodes=new Map();
  const node=id=>{
    if(nodes.has(id))return nodes.get(id);
    const n={value:'',textContent:'',hidden:false,disabled:false,addEventListener(){},querySelectorAll(){return []}};
    if(id==='variant'){
      let options=[];
      Object.defineProperty(n,'innerHTML',{set(value){options=[...value.matchAll(/<option value="([^"]+)" data-price="([^"]+)" data-status="([^"]+)"/g)].map(m=>({value:m[1],dataset:{price:m[2],status:m[3]}}));n.value=options[0]?.value||''},get(){return ''}});
      Object.defineProperty(n,'selectedOptions',{get(){return options.filter(x=>x.value===n.value)}});
    }
    n.value=({serviceHeight:'180',serviceWeight:'100',serviceCondition:'no',serviceInsulin:'no'})[id]||n.value;
    nodes.set(id,n);return n;
  };
  const location={origin:'https://shiftsometimber.co.uk',pathname:'/mounjaro',search,href:'https://shiftsometimber.co.uk/mounjaro'+search,assign(value){this.assigned=value}};
  const context={URL,URLSearchParams,Date,JSON,Number,String,encodeURIComponent,location,window:{},sessionStorage:sessionStorage(),
    document:{getElementById:node,title:''},
    fetch:async()=>({json:async()=>({products:[{name:'Mounjaro',form:'injection',variants:[
      {id:101,pricePence:16900,strengthLabel:'2.5 mg',status:'available'},
      {id:102,pricePence:18900,strengthLabel:'5 mg',status:'available'},
    ]}]})})};
  vm.runInNewContext(await readFile(new URL('../frontend/medicine-front-door/medicine-front-door.js',import.meta.url),'utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  return {context,node,location};
}

test('returning to a product restores the exact selected variant',async()=>{
  const page=await productPage('?variant=102');
  assert.equal(page.node('variant').value,'102');
});

test('verification handover includes the selected variant in its return route',async()=>{
  const page=await productPage();
  page.node('variant').value='102';
  await page.node('continue').onclick();
  const target=new URL(page.location.assigned,page.location.origin);
  assert.equal(target.searchParams.get('variant'),'102');
  const back=new URL(target.searchParams.get('returnTo'),page.location.origin);
  assert.equal(back.searchParams.get('variant'),'102');
});

async function assessmentPage(returnTo) {
  const inputs=[{required:false,disabled:false}];
  const previous={value:'no'};
  const previousDetails={hidden:true,querySelectorAll(){return inputs}};
  const form={querySelector(){return {disabled:false}}};
  const status={textContent:''};
  const location={origin:'https://shiftsometimber.co.uk',search:'?variant=102&returnTo='+encodeURIComponent(returnTo),assign(value){this.assigned=value}};
  const context={URL,URLSearchParams,Number,String,Date,JSON,encodeURIComponent,location,sessionStorage:sessionStorage(),
    document:{querySelector(selector){return ({'#assessment':form,'#status':status,'#previousTreatment':previous,'#previousDetails':previousDetails,'#variantId':{value:''}})[selector]}},
    setTimeout(callback){callback()}};
  vm.runInNewContext(await readFile(new URL('../frontend/member/treatment-assessment.js',import.meta.url),'utf8'),context);
  return {context,location,previous,previousDetails,inputs};
}

test('verified return retains dose and existing query parameters',async()=>{
  const page=await assessmentPage('/mounjaro?campaign=test#options');
  page.context.finish({verificationToken:'synthetic-token',expiresAt:'2099-01-01T00:00:00Z'});
  const target=new URL(page.location.assigned,page.location.origin);
  assert.equal(target.pathname,'/mounjaro');
  assert.equal(target.searchParams.get('campaign'),'test');
  assert.equal(target.searchParams.get('variant'),'102');
  assert.equal(target.searchParams.get('verified'),'1');
  assert.equal(target.hash,'#options');
});

test('a backslash return target cannot send a verified member to another origin',async()=>{
  const page=await assessmentPage('/\\other.example.test');
  page.context.finish({verificationToken:'synthetic-token',expiresAt:'2099-01-01T00:00:00Z'});
  assert.equal(new URL(page.location.assigned,page.location.origin).origin,page.location.origin);
});

test('hidden previous-treatment inputs do not participate in a no submission',async()=>{
  const page=await assessmentPage('/mounjaro');
  assert.equal(page.inputs[0].disabled,true);
  page.previous.value='yes';
  page.previous.onchange();
  assert.equal(page.inputs[0].required,true);
  assert.equal(page.inputs[0].disabled,false);
});

test('the deployed assessment asset remains identical to its source copy',async()=>{
  for(const name of ['treatment-assessment.html','treatment-assessment.js']){
    const [source,deployed]=await Promise.all([
      readFile(new URL('../frontend/medicine-front-door/'+name,import.meta.url),'utf8'),
      readFile(new URL('../frontend/member/'+name,import.meta.url),'utf8'),
    ]);
    assert.equal(source,deployed);
  }
});
