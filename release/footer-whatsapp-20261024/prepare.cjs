const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs'),r=__dirname;
(async()=>{const p=await c.organicApi(c.pages);const b=await c.organicApi(c.pages+'/deployments/'+p.canonical_deployment.id);c.fs.writeFileSync(r+'/base.json',JSON.stringify(b));for(const [url,n] of [[b.url+'/assets/v42.js','v42-before.js'],[b.url+'/_headers','headers-response']]){if(n==='headers-response')continue;c.fs.writeFileSync(r+'/'+n,(await c.get(url)).bytes)}console.log({id:b.id,url:b.url});})();

