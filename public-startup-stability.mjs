// NEXT-PERF-01: preserve the approved settled DOM; prepare it before first paint.
// These two exact routes/signatures are the only eligible transformations.
const intro='<p>One practical journey for losing weight, living better while doing it and protecting what you gain.</p>';
export const programmeBridge='<aside class="sst-service-bridge" aria-labelledby="sst-service-bridge-title"><div class="sst-service-bridge__main"><p class="sst-service-bridge__kicker">What Shift does</p><h2 id="sst-service-bridge-title">Turn useful information into a weight-management plan.</h2><p class="sst-service-bridge__intro">Shift helps men understand their weight, choose a realistic route and build a personalised programme around food, movement, sleep, progress and support—with access to clinically assessed treatment where appropriate.</p><div class="sst-service-bridge__limits"><div class="sst-service-bridge__limit"><strong>What we can do</strong><span>Explain your options, build your plan and support you through it.</span></div><div class="sst-service-bridge__limit"><strong>What we can’t do</strong><span>Guarantee medication, replace your GP or provide treatment without clinical assessment.</span></div></div></div><div class="sst-service-bridge__action"><p>Ready to make it personal? Three quick questions. One useful starting point.</p><a class="sst-service-bridge__cta" href="/start-here?from=programme">Start my Shift &rarr;</a></div></aside>';
export const loginReservationStyles=String.raw`
html body[data-login-layout="stable-v1"][data-member-session="pending"] main.preview-wrap,
html body[data-login-layout="stable-v1"][data-member-session="error"] main.preview-wrap{display:block!important;position:relative}
html body[data-login-layout="stable-v1"][data-member-session="pending"] #previewAuth[hidden],
html body[data-login-layout="stable-v1"][data-member-session="error"] #previewAuth[hidden]{display:block!important;visibility:hidden!important;pointer-events:none!important}
html body[data-login-layout="stable-v1"]:not([data-member-session="ready"]) #previewMember{display:none!important}
html body[data-login-layout="stable-v1"] #memberSessionStatus{position:absolute;top:22px;left:50%;transform:translateX(-50%);box-sizing:border-box;width:calc(100% - 28px);max-width:440px;margin:0;padding:24px;z-index:1}
`;
export function stabilisePublicHtml(path,html){
 if(!html.includes('</head>'))return html;
 if(['/programme','/programme.html'].includes(path)){
  if(html.includes('data-programme-layout="stable-v1"')||html.includes('class="sst-service-bridge"')||!html.includes('data-template="shift-programme"')||!html.includes('<main class="programme-five-beat" id="main-content">')||html.split(intro).length!==2)return html;
  return html.replace(intro,intro+programmeBridge).replace('</head>','<link data-programme-layout="stable-v1" rel="stylesheet" href="/assets/shift-service-bridge-v1.css?v=2"></head>');
 }
 if(['/member-login','/member-login.html'].includes(path)){
  const status='<section id="memberSessionStatus" aria-label="Account access"><p role="status">Checking your sign-in…</p></section><script src="/assets/member-experience/session.mjs"></script>';
  if(html.includes('data-login-layout="stable-v1"')||!html.includes('data-member-session="pending"')||html.split(status).length!==2||html.split('<main class="preview-wrap">').length!==2||!/<section\b[^>]*id="previewAuth"[^>]*hidden/.test(html)||!html.includes('id="previewMember"'))return html;
  return html.replace(status,'').replace('<body','<body data-login-layout="stable-v1"').replace('<main class="preview-wrap">','<main class="preview-wrap">'+status).replace('</head>','<style data-login-reservation>'+loginReservationStyles+'</style></head>');
 }
 return html;
}
export async function withStartupStability(request,response){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||response.status!==200||!['/programme','/programme.html','/member-login','/member-login.html'].includes(path)||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const before=await response.text(),after=stabilisePublicHtml(path,before),headers=new Headers(response.headers);
 if(after!==before){headers.delete('Content-Length');headers.delete('ETag');headers.delete('Content-Encoding');headers.set('X-Shift-Startup-Layout','stable-v1');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
