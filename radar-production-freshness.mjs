const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const response=await fetch(`${BASE}/v1/radar/ticker`,{headers:{Origin:'https://shiftsometimber.co.uk','User-Agent':'Shift-Commissioning/1'}});
let body=null;try{body=await response.json()}catch{}
if(!response.ok)throw new Error(`radar ticker HTTP ${response.status}`);
if(body?.ok!==true)throw new Error(`radar ticker contract ${JSON.stringify(body)}`);
if(!body?.freshness||!body?.freshness?.sloHours||!Array.isArray(body?.freshness?.reasons))throw new Error('radar freshness contract missing');
const ages=body.freshness.ages||{},slo=body.freshness.sloHours||{};
const evidence={status:body.status,current:body.current,ages,slo,reasons:body.freshness.reasons,itemCount:Array.isArray(body.items)?body.items.length:null};
console.log(JSON.stringify(evidence,null,2));
if(body.current!==true||body.status!=='GREEN')throw new Error(`M03 production Radar not current: ${JSON.stringify(evidence)}`);
if(ages.scan==null||Number(ages.scan)>Number(slo.scanHours))throw new Error(`M03 production Radar scan freshness outside SLO: ${JSON.stringify(evidence)}`);
if(ages.ticker!=null&&Number(ages.ticker)>Number(slo.tickerHours))throw new Error(`M03 production ticker freshness outside SLO: ${JSON.stringify(evidence)}`);
console.log('PASS M03 production Radar ticker is current and scan/ticker freshness are inside declared SLOs');
