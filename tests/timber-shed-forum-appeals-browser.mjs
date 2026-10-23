// Synthetic browser acceptance only; all HTTP requests are intercepted locally.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {timberShedForumPilotMarkup,timberShedForumPilotCSS,timberShedForumPilotClient} from '../member-experience/timber-shed-forum-ui.mjs';
const require=createRequire(import.meta.url);
const puppeteer=require(process.env.TIMBER_SHED_PUPPETEER_PATH||'puppeteer');
const html='<!doctype html><html lang="en-GB"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#050505;color:#e7e3da;font:16px Arial;padding:20px}.section{max-width:1100px;margin:auto}button{cursor:pointer}'+timberShedForumPilotCSS+'</style>'+timberShedForumPilotMarkup+'<script>'+timberShedForumPilotClient+'</script></html>';
const now='2026-10-23T09:00:00Z';
const browser=await puppeteer.launch({headless:true,executablePath:process.env.TIMBER_SHED_CHROME_PATH,args:['--no-sandbox']});
try{
 for(const [viewport,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const page=await browser.newPage(),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,deviceScaleFactor:1});page.setDefaultTimeout(12000);
  let postStatus='rejected',appeal=null;
  const post={id:'synthetic-appeal-post',room_id:'main-shed',title:'A fictional <img> discussion',body:'A synthetic, everyday discussion for interface testing.',created_at:now,reviewed_at:now,parent_id:null};
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url()),resource=url.pathname.split('/forum/')[1],input=request.postData()?JSON.parse(request.postData()):null;
   let data={},status=200;
   if(url.pathname==='/member/timber-shed')return request.respond({status,contentType:'text/html',body:html});
   if(request.method()==='POST')writes.push({resource,input});
   if(resource==='rooms')data={rooms:[{id:'main-shed',name:'The Main Shed'}]};
   else if(resource==='profile')data={profile:{displayName:'Weekend Walker'}};
   else if(resource==='mine')data={posts:[{...post,status:postStatus}]};
   else if(resource==='appeals')data={appeals:appeal?[appeal]:[]};
   else if(resource==='appeal'){
    appeal={id:'synthetic-appeal-id',post_id:post.id,reason:input.reason,status:'open',decision_at:now,created_at:now};
    data={ok:true,id:appeal.id,status:'open'};status=202;
   }else if(resource==='appeal/review'){
    appeal.status=input.outcome;if(input.outcome==='reconsider')postStatus='pending';
    data={ok:true,status:input.outcome};
   }else if(resource==='moderation')data={pending:[],reports:[],appeals:appeal?.status==='open'?[{...appeal,title:post.title,body:post.body,room_id:post.room_id}]:[]};
   else if(resource==='notifications')data={notifications:[],unreadCount:0};
   else if(resource==='latest'||resource==='room-topics')data={posts:[],hasMore:false};
   else{status=404;data={error:'not_available'}}
   request.respond({status,contentType:'application/json',body:JSON.stringify(data)});
  });
  try{
   await page.goto('https://shift.test/member/timber-shed',{waitUntil:'networkidle0'});
   await page.click('[data-shed-view="mine"]');
   await page.waitForSelector('#shedMyPostItems select');
   await page.click('#shedMyPostItems select + button');
   assert.equal(writes.length,0,'An appeal must require an explicit reason');
   await page.select('#shedMyPostItems select','missed-context');
   await page.click('#shedMyPostItems select + button');
   await page.waitForFunction(()=>document.getElementById('shedMyPostItems').textContent.includes('waiting for a different moderator'));
   assert.deepEqual(writes[0],{resource:'appeal',input:{postId:post.id,reason:'missed-context'}});
   assert.equal(await page.$('#shedMyPostItems img'),null,'Post titles must remain literal text');
   await page.click('[data-shed-view="moderation"]');
   await page.waitForSelector('#shedAppeals .shed-mod-item');
   const controls=await page.$$('#shedAppeals button');await controls[1].click();
   await page.waitForFunction(()=>document.getElementById('shedMyPostItems').textContent.includes('Awaiting moderator review'));
   assert.deepEqual(writes[1],{resource:'appeal/review',input:{appealId:'synthetic-appeal-id',outcome:'reconsider'}});
   assert.equal(postStatus,'pending');assert.equal(writes.length,2);
   await page.click('[data-shed-view="mine"]');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile layout must not overflow');
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({viewport,appealSubmitted:true,independentReviewUI:true,returnedToPending:true,noPublication:true,noOverflow:true,pageErrors:0,syntheticOnly:true}));
  }finally{await page.close()}
 }
}finally{await browser.close()}
