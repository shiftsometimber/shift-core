// Read-only fictional view of the actual client. No login, API or database access.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {workHTML,workCSS,workJS} from './screen.mjs';
import {closingReport,NOTICE} from './model.mjs';
const out=resolve(process.argv[2]||'work/preview');mkdirSync(out+'/assets',{recursive:true});
const cfg={name:'Example Logistics — fictional',start:'2026-09-14',end:'2026-12-07',seats:50,feePence:null,testingAllowancePence:null,reporterIds:[],scope:'Company launch, a shared start, twelve self-guided weekly reviews and a reviewed closing report.',support:'Support scope and response times are agreed in the written pilot contract.'};
const report=closingReport({id:'fictional-closed',config:{...cfg,start:'2026-05-04',end:'2026-07-27'},members:Array.from({length:35},(_,i)=>({userId:i,completedWeeks:i<15?Array.from({length:12},(_,j)=>j+1):i<25?[1,2]:[]}))},'2026-08-01T12:00:00.000Z');
const data={
 '/v1/work':{noticeVersion:NOTICE,workplaces:[{employerId:'fictional-member',...cfg,week:4,active:true,status:'active',completedWeeks:[1,2,3],testing:{available:false,message:'Home blood testing is not available. No test has been ordered.'}}]},
 '/v1/hq/work':{employers:[{id:'fictional-draft',revision:0,config:cfg,status:'draft',invites:[],audit:[],report:null,testing:{available:false}}]},
 '/v1/employer/work':{reports:[{employerId:'fictional-closed',name:cfg.name,start:'2026-05-04',end:'2026-07-27',report},{employerId:'fictional-small',name:'Example small cohort — fictional',start:'2026-05-04',end:'2026-07-27',report:closingReport({id:'fictional-small',config:{...cfg,start:'2026-05-04',end:'2026-07-27'},members:[{userId:1,completedWeeks:[1]}]},'2026-08-01T12:00:00.000Z')}]}
};
const mock=`const fictional=${JSON.stringify(data)};window.fetch=async(path,options={})=>{const body=options.method==='POST'?{error:'Read-only fictional preview. No account, code, contract or order has been created.'}:fictional[path]??{error:'This service is not connected in the preview.'};return new Response(JSON.stringify(body),{status:options.method==='POST'?409:fictional[path]?200:404,headers:{'Content-Type':'application/json'}})};`;
writeFileSync(out+'/assets/work-preview.mjs',mock+'\n'+workJS.replace('<a href="/v1/work/export" download>Download my workplace data</a>','<span>Own-data download is available in the authenticated build.</span>'));
writeFileSync(out+'/assets/work-preview.css',workCSS+'\n.work-preview-notice{padding:18px;margin:0 0 24px;border:2px solid #707762}.work-preview-notice nav{display:flex;gap:20px;flex-wrap:wrap}');
for(const mode of ['member','hq','employer']){
 const name=mode==='member'?'shift-work-preview.html':'shift-work-preview-'+mode+'.html';
 const banner='<aside class="work-preview-notice"><strong>SHIFT for Work — fictional, read-only preview</strong><p>These screens show the build using invented records. There is no live employer, account, reporting service or test ordering here. Please do not enter real details.</p><nav aria-label="Preview views"><a href="/shift-work-preview">Employee view</a><a href="/shift-work-preview-hq">SHIFT HQ view</a><a href="/shift-work-preview-employer">Employer report view</a></nav></aside>';
 const html=workHTML(mode).replaceAll('/assets/work/work.css','/assets/work-preview.css').replaceAll('/assets/work/work.mjs','/assets/work-preview.mjs').replace('<main class="work">','<main class="work">'+banner).replace('<a href="/v1/work/export" download>Download my workplace data</a>','<span>Data export is available in the authenticated build.</span>');
 writeFileSync(out+'/'+name,html);
}
console.log('Generated three fictional, read-only views using the actual workplace client.');
