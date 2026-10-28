import testingWorker from '../health-nutrition/worker.mjs';
import {addTestingLink} from './public.mjs';
import {testingStyle} from './styles.mjs';

export const release='health-testing-range-20261028';
const scopedStyle=testingStyle.replace(/#shift-health-range/g,'#main-content #shift-health-range').replace(/([\w-]+)\s*:\s*([^;{}]+)([;}])/g,(_,property,value,end)=>property+':'+value.trim()+(value.includes('!important')?'':'!important')+end);

// The retained argument is the exact currently deployed Health/Nutrition
// module, not an older repository reconstruction. Unowned requests use its
// response unchanged, including live purchase basket and recommendation work.
export function composeTesting(retained){return {async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
 const publicHost=['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname);
 const testingPublic=publicHost&&(path==='/shift-health/testing'||path.startsWith('/shift-health/testing/')||path.startsWith('/shift-health/assets/testing-')||path==='/shift-health/assets/hq-testing.js');
 const testingAPI=url.hostname==='api.shiftsometimber.co.uk'&&(path==='/v1/hq/testing'||path.startsWith('/v1/hq/testing/'));
 if(testingPublic||testingAPI)return testingWorker.fetch(request,env,ctx);
 const response=await retained.fetch(request,env,ctx);
 const hub=publicHost&&['/shift-health','/shift-health.html'].includes(path);
 const hq=url.hostname==='hq.shiftsometimber.co.uk'&&['/','/index.html'].includes(path);
 if((!hub&&!hq)||!response.ok||!['GET','HEAD'].includes(request.method)||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const headers=new Headers(response.headers);
 for(const key of ['Content-Length','Content-Encoding','ETag'])headers.delete(key);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Health-Release',release);
 if(request.method==='HEAD')return new Response(null,{status:response.status,headers});
 let html=await response.text();
 if(hub)html=addTestingLink(html).replace('</head>','<style data-shift-testing-hub>'+scopedStyle+'</style></head>');
 if(hq&&!html.includes('/shift-health/assets/hq-testing.js'))html=html.replace('</body>','<script type="module" src="https://shiftsometimber.co.uk/shift-health/assets/hq-testing.js"></script></body>');
 return new Response(html,{status:response.status,headers});
}};}
