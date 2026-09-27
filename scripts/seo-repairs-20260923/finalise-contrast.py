"""Repair only contrast conflicts identified in the first rendered candidate."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
expected={
 'public-navigation-policy.mjs':'73e8f68070ca851df638ff853f28577d197a2556d7c512bab7f36e84e0d6cd2d',
 'public-seo-presentation.mjs':'44747a8d31a712a04de642f9659e052480f70267f09d0d99760675809ff1783a',
 'preview/seo-repairs/verify.cjs':'df2cafb23bb74c22d1019d6081037c6e8a72d9bab86d7644821125f64695ce92',
 'tests/seo-repairs-20260923.test.mjs':'186ab0d10deb5ee650e37dda6d2005eae5c7444e423fda9ca43c575ba586e63e'
}
record=ROOT/'scripts/seo-repairs-20260923/contrast-manifest.json'
previous=json.loads(record.read_text()) if record.exists() else {}
result={}
def once(s,old,new):
 assert s.count(old)==1,old[:100]
 return s.replace(old,new,1)
for name,sha in expected.items():
 p=ROOT/name;raw=p.read_bytes();actual=hashlib.sha256(raw).hexdigest()
 if actual!=sha:
  assert actual==previous.get(name,{}).get('after_sha256'),name+': unexpected source change'
  result[name]=previous[name];continue
 s=raw.decode()
 if name=='public-navigation-policy.mjs':
  s=once(s,'background:#050505;color:#E7E3DA;border-block:1px solid #707762','background:#050505!important;color:#E7E3DA!important;border-block:1px solid #707762!important')
  s=once(s,'#shift-public-news a{color:#E7E3DA;-webkit-text-fill-color:#E7E3DA;','#shift-public-news a{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important;')
 elif name=='public-seo-presentation.mjs':
  common='html body header.site-header[data-header-v2] .menu-trigger{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important}html body header.site-header[data-header-v2] .menu-trigger:is(:hover,:focus-visible,[aria-expanded="true"]){background:#E7E3DA!important;color:#050505!important;-webkit-text-fill-color:#050505!important}'
  s=once(s,'const css = Object.freeze({','const menuContrast = '+json.dumps(common)+';\nconst css = Object.freeze({')
  s=once(s,"if(css[path]&&!html.includes('data-seo-contrast-20260923'))html=html.replace(/<\\/head>/i,'<style data-seo-contrast-20260923>'+css[path]+'</style></head>');","if(!html.includes('data-seo-contrast-20260923'))html=html.replace(/<\\/head>/i,'<style data-seo-contrast-20260923>'+menuContrast+(css[path]||'')+'</style></head>');")
 elif name=='tests/seo-repairs-20260923.test.mjs':
  s=once(s,'assert.match(tickerStyles,/background:#050505;color:#E7E3DA/);','assert.match(tickerStyles,/background:#050505!important;color:#E7E3DA!important/);')
  s+='\n'+'''test('menu hover and keyboard focus retain a high-contrast pair without resizing the header',()=>{
 const html=repairSeoPresentation(shell,'/programme');
 assert.match(html,/menu-trigger:is\(:hover,:focus-visible,\[aria-expanded="true"\]\)\{background:#E7E3DA!important;color:#050505!important/);
 assert.match(html,/data-header-v2/);assert.match(html,/Good to Talk/);
});
'''
 elif name=='preview/seo-repairs/verify.cjs':
  s=once(s,"ticker:!!document.querySelector('#shift-public-news')","ticker:!!document.querySelector('#shift-public-news'),tickerBackground:document.querySelector('#shift-public-news')?getComputedStyle(document.querySelector('#shift-public-news')).backgroundColor:null")
  s=once(s,"record(key+' source JSON valid'","if(row.dom.ticker)record(key+' ticker contrast background',row.dom.tickerBackground==='rgb(5, 5, 5)',row.dom.tickerBackground);\n    record(key+' source JSON valid'")
  old="record(key+' menu focus returns',await trigger.evaluate(x=>x===document.activeElement),null);"
  new=old+"const menuColours=await trigger.evaluate(x=>({bg:getComputedStyle(x).backgroundColor,fg:getComputedStyle(x).webkitTextFillColor}));record(key+' focused menu contrast',menuColours.bg==='rgb(231, 227, 218)'&&menuColours.fg==='rgb(5, 5, 5)',menuColours);"
  s=once(s,old,new)
 p.write_text(s);result[name]={'before_sha256':sha,'after_sha256':hashlib.sha256(s.encode()).hexdigest()}
manifest=ROOT/'scripts/seo-repairs-20260923/source-manifest.json'
m=json.loads(manifest.read_text());m['files']['public-navigation-policy.mjs']['after_sha256']=result['public-navigation-policy.mjs']['after_sha256'];manifest.write_text(json.dumps(m,indent=2)+'\n')
record.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
