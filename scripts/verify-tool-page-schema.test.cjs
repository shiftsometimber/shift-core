const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {verifyAll} = require('./verify-tool-page-schema.cjs');
function fixture(url) {
  return {'@context':'https://schema.org','@type':'WebPage',url,'@id':url+'#webpage',isAccessibleForFree:true};
}
const html = value => '<main>Calculator</main><script type="application/ld+json">'+JSON.stringify(value)+'</script>';
test('valid pages pass without write requests',async()=>{
  const calls=[];
  const checks=await verifyAll(async(url,opts)=>{calls.push({url,opts});return new Response(html(fixture(url)));});
  assert.equal(checks.length,9);assert(checks.every(check=>check.passed));
  assert(calls.every(call=>!call.opts.method&&!call.opts.body));
});
for (const mode of ['http503','malformed-json','missing-page','duplicate-page','wrong-id','not-free','nested-application','transport-failure']) {
  test(mode+' fails and still checks the other eight pages',async()=>{
    const checks=await verifyAll(async url=>{
      if (!url.endsWith('/tools/bmi')) return new Response(html(fixture(url)));
      if(mode==='http503')return new Response('unavailable',{status:503});
      if(mode==='malformed-json')return new Response('<script type="application/ld+json">{broken</script>');
      if(mode==='transport-failure')throw new Error('Connection failed');
      let value=fixture(url);
      if(mode==='missing-page')value={'@type':'Organization'};
      if(mode==='duplicate-page')value=[value,value];
      if(mode==='wrong-id')value['@id']=url+'#wrong';
      if(mode==='not-free')value.isAccessibleForFree=false;
      if(mode==='nested-application')value={'@graph':[value,{'@type':['SoftwareApplication']}]};
      return new Response(html(value));
    });
    assert.equal(checks.filter(check=>!check.passed).length,1);
    assert.equal(checks.find(check=>!check.passed).path,'/tools/bmi');
    assert(checks.find(check=>!check.passed).error);
    assert.equal(checks.filter(check=>check.passed).length,8);
  });
}
test('command exits non-zero when live requests fail',()=>{
  const script="const {main}=require("+JSON.stringify(require.resolve('./verify-tool-page-schema.cjs'))+");main(async()=>new Response('down',{status:503}));";
  const result=spawnSync(process.execPath,['-e',script],{encoding:'utf8'});
  assert.equal(result.status,1);
  assert.equal(JSON.parse(result.stdout).checks.filter(check=>!check.passed).length,9);
});
