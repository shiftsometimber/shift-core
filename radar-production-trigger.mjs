const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const token=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
if(!token)throw new Error('SHIFT_COMMISSIONING_OIDC missing');
const r=await fetch(`${BASE}/v1/commissioning/radar-scan`,{method:'POST',headers:{'X-Shift-Commissioning-OIDC':token,'Content-Type':'application/json'}});let data=null;try{data=await r.json()}catch{}
if(!r.ok)throw new Error(`Radar production scan trigger ${r.status}: ${JSON.stringify(data)}`);
if(!data?.radar?.scan?.ok||data?.radar?.scan?.status!=='completed')throw new Error(`Radar scan did not complete: ${JSON.stringify(data)}`);
const sources=data.radar.scan.sources||[];if(!sources.some(x=>x.source==='mhra-drug-safety')||!sources.some(x=>x.source==='ema-news'))throw new Error(`Authoritative regulator sources missing: ${JSON.stringify(sources)}`);
console.log(JSON.stringify({ok:true,status:data.radar.scan.status,newEvents:data.radar.scan.newEvents,sources:sources.map(x=>({source:x.source,ok:x.ok,items:x.items,newEvents:x.newEvents}))},null,2));
console.log('PASS M03 genuine production regulator scan invoked through cryptographically authenticated commissioning identity');
