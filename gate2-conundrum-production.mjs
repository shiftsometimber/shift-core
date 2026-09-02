const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const nonce=`conundrum-catalogue-${Date.now()}`;
const email=`shiftsometimber+structured-${nonce}@gmail.com`;
const password=`Sst!A9-${nonce}`;
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function call(path,{method='GET',body,cookie}={}){
  const headers={Origin:ORIGIN};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(cookie)headers.Cookie=cookie;
  const response=await fetch(BASE+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  let data=null;try{data=await response.json()}catch{}
  return{response,data,cookie:(response.headers.get('set-cookie')||'').split(';')[0]};
}

const registration=await call('/v1/auth/register',{method:'POST',body:{email,firstName:'DaveConundrum',password,source:'commissioning'}});
assert(registration.response.status===201,`register ${registration.response.status} ${JSON.stringify(registration.data)}`);
assert(registration.cookie,'registration session cookie missing');
const cookie=registration.cookie;

const match=await call('/v1/grub/conundrum',{method:'POST',cookie,body:{items:['5% beef mince','potatoes','onion']}});
assert(match.response.ok,`Conundrum ${match.response.status} ${JSON.stringify(match.data)}`);
assert(match.data?.source==='published_catalogue',`Conundrum source was ${match.data?.source||'missing'}`);
assert(Number(match.data?.catalogue_size)>=1,'published catalogue was not visible to Conundrum');
assert(Array.isArray(match.data?.top)&&match.data.top.length>=1,'published catalogue produced no relevant match');
assert(match.data.top.every(x=>x.source==='published_catalogue'),'Conundrum mixed non-published fallback content into governed results');
const reviewedMatch=match.data.top.find(x=>x.source==='published_catalogue'&&Array.isArray(x.matched)&&x.matched.length>=2);
assert(reviewedMatch,'reviewed/published catalogue returned no strong match for the supplied core ingredients');
assert(reviewedMatch.id,'returned published recipe lacks a stable catalogue id');

const noMatch=await call('/v1/grub/conundrum',{method:'POST',cookie,body:{items:['unobtainium flakes','moon dust']}});
assert(noMatch.response.ok,`Conundrum no-match ${noMatch.response.status}`);
assert(noMatch.data?.source==='published_catalogue','no-match journey escaped governed published catalogue');
assert(Array.isArray(noMatch.data?.top)&&noMatch.data.top.length===0,'no-match journey invented an unrelated recipe');

console.log(JSON.stringify({ok:true,catalogueSize:match.data.catalogue_size,matchedRecipe:reviewedMatch.id,matchedIngredients:reviewedMatch.matched,noMatchCount:noMatch.data.top.length},null,2));
console.log('PASS G2-009 production member journey: Conundrum serves relevant reviewed/published catalogue intelligence and refuses to invent unrelated fallback results once governed catalogue content exists.');
