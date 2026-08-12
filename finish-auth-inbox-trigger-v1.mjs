const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const EMAIL='shiftsometimber+commissioning@gmail.com';
const ORIGIN='https://shiftsometimber.co.uk';
const password=`Finish-${crypto.randomUUID()}-Aa9!`;
async function call(path,body){const r=await fetch(`${BASE}${path}`,{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json'},body:JSON.stringify(body)});let data=null;try{data=await r.json()}catch{}return{r,data}}
const reg=await call('/v1/auth/register',{email:EMAIL,password,firstName:'Dave',lastName:'Commissioning',source:'finish-line-auth-proof'});
if(![201,409].includes(reg.r.status))throw new Error(`registration trigger failed ${reg.r.status} ${JSON.stringify(reg.data)}`);
console.log(reg.r.status===201?'PASS production registration trigger accepted':'INFO commissioning account already exists');
const reset=await call('/v1/auth/request-password-reset',{email:EMAIL});
if(!reset.r.ok||reset.data?.ok!==true)throw new Error(`password reset trigger failed ${reset.r.status} ${JSON.stringify(reset.data)}`);
if(reset.data?.emailDeliveryConfigured!==true)throw new Error('production reset endpoint reports EMAIL binding unavailable');
console.log('PASS production password-reset trigger accepted and EMAIL binding reports configured');
console.log('INBOX_EVIDENCE_REQUIRED shiftsometimber+commissioning@gmail.com');
