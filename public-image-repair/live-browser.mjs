import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import manifest from './manifest.json' with {type:'json'};

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const directory='public-image-repair-proof';mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[];
try{
  for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1});
    try{
      for(const item of manifest.pages){
        const page=await context.newPage();
        try{
          const response=await page.goto('https://shiftsometimber.co.uk'+item.page,{waitUntil:'domcontentloaded',timeout:45000});
          assert.equal(response.status(),200,item.page);
          const image=page.locator('main img').filter({hasNot:page.locator('noscript')});
          const target=page.locator('main img[src="'+item.image+'"]');
          assert.equal(await target.count(),1,item.page+' approved image');
          await target.waitFor({state:'visible',timeout:20000});
          await target.evaluate(async img=>{await img.decode();});
          await target.scrollIntoViewIfNeeded();
          const rendered=await target.evaluate(img=>{
            const box=img.getBoundingClientRect(),style=getComputedStyle(img);
            return {complete:img.complete,width:img.naturalWidth,height:img.naturalHeight,currentSrc:img.currentSrc,box:{x:box.x,y:box.y,width:box.width,height:box.height},objectFit:style.objectFit,objectPosition:style.objectPosition,viewport:innerWidth};
          });
          assert.equal(rendered.complete,true);assert.equal(rendered.width,item.width);assert.equal(rendered.height,item.height);
          assert(rendered.box.width>50&&rendered.box.height>50,item.page+' visible image size');
          assert(rendered.box.x>=-2&&rendered.box.x+rendered.box.width<=width+2,item.page+' image extends beyond viewport');
          const delivered=await context.request.get('https://shiftsometimber.co.uk'+item.image);
          assert.equal(delivered.status(),200);assert.equal(createHash('sha256').update(await delivered.body()).digest('hex'),item.sha256);
          const broken=await image.evaluateAll(images=>images.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.currentSrc||i.src));
          assert.deepEqual(broken,[],item.page+' broken rendered images');
          const screenshot=item.page.slice(1)+'-'+width+'.png';await page.screenshot({path:directory+'/'+screenshot});
          evidence.push({page:item.page,width,rendered,screenshot,sha256:item.sha256});
          writeFileSync(directory+'/rendered.json',JSON.stringify({verified:false,source:process.env.GITHUB_SHA,evidence},null,2));
        }finally{await page.close();}
      }
    }finally{await context.close();}
  }
  writeFileSync(directory+'/rendered.json',JSON.stringify({verified:true,source:process.env.GITHUB_SHA,evidence},null,2));
  console.log(JSON.stringify({rendered:true,pages:8,viewports:[390,1440],screenshots:evidence.length}));
}finally{await browser.close();}
