from pathlib import Path
import json,hashlib,re
root=Path(__file__).parent
out=root/'price-period-20261018'
out.mkdir(exist_ok=True)
def current(name):
 p=root/'after'/name
 return p.read_text() if p.exists() else (root/'before'/name).read_text()
def replace(s,a,b,count=1):
 assert s.count(a)==count,(a,s.count(a))
 return s.replace(a,b)
files={}
s=current('treatment-medication-catalogue-v1.js')
s=replace(s,"course:'One month · four weekly doses'","course:'4 weeks · four weekly doses'",2)
s=replace(s,"course:'One month · once-daily tablets'","course:'Once-daily tablets · pack duration to be confirmed'",2)
s=replace(s,"120 mg · 84 capsules — typical month","120 mg · 84 capsules")
files['treatment-medication-catalogue-v1.js']=s
s=current('treatment-order-prototype-v1.js')
s=replace(s,'The inclusive monthly PAYG price is visible before clinical assessment.','The price for the displayed supply is visible before clinical assessment.')
s=replace(s,'<dt>Live monthly price</dt>','<dt>Live supply price</dt>')
files['treatment-order-prototype-v1.js']=s
s=current('treatment-order.html')
for a,b in [('review the monthly price','review the price and supply period'),('MONTHLY PRICE','TREATMENT PRICE'),('Pay month by month.','Pay per treatment order.'),('This month’s order','This treatment order'),('One month · four weekly doses','4 weeks · four weekly doses')]:
 s=replace(s,a,b)
files['treatment-order.html']=s
s=current('medicine-front-door-integrated-v1.js')
s=replace(s,'  let liveByKey={};',r'''  let liveByKey={},priceCheckedAt=null;
  // Supply periods are independent of a calendar-month household budget.
  function supplyPeriod(key,variant){
    if(['mounjaro','wegovy-injection'].includes(key))return 'per 4 weeks';
    const capsules=String(variant?.strengthLabel||'').match(/(\d+)\s*capsules?/i);
    return capsules?'per '+capsules[1]+'-capsule pack':'per pack';
  }
  function lowestPricedVariant(key){
    return (liveByKey[key]?.variants||[]).filter(v=>v.pricePence!==null&&v.pricePence!==''&&Number.isFinite(Number(v.pricePence))).sort((a,b)=>Number(a.pricePence)-Number(b.pricePence))[0];
  }
  function supplyPrice(key){
    const variant=lowestPricedVariant(key);
    return variant?'From '+money(variant.pricePence)+' '+supplyPeriod(key,variant):'Live price unavailable';
  }
  function syncSupplyPeriod(){
    const key=medicineSelect.value,item=catalogue[key],weekly=['mounjaro','wegovy-injection'].includes(key);
    const option=doseSelect.selectedOptions[0],variant=(liveByKey[key]?.variants||[]).find(v=>String(v.id)===option?.dataset.variantId);
    const heading=$('.op-price small');if(heading)heading.textContent=weekly?'PRICE PER 4 WEEKS':'PACK PRICE';
    const period=$('.op-price>span');if(period)period.textContent=weekly?'Four weekly doses · 13 supplies over 52 weeks if continued':item.fixedDose?supplyPeriod(key,variant)+' · duration depends on prescribed use':'Per pack · quantity and duration must be confirmed before ordering';
    let checked=$('[data-price-checked]');
    if(!checked){checked=document.createElement('span');checked.dataset.priceChecked='';$('.op-price')?.append(checked)}
    if(checked)checked.textContent=priceCheckedAt?'HQ price checked '+new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(priceCheckedAt)+' (UK time)':'HQ price unavailable';
    const receipt=$('[data-receipt-list] li:last-child');if(receipt)receipt.textContent=weekly?'The displayed HQ price covers four weekly doses (4 weeks), not a calendar month.':'The displayed HQ price is for the selected pack. Its duration depends on the supplied quantity and prescribed use.';
    for(const card of $$('[data-browser-card]')){
      const row=$$('dl>div',card).find(node=>$('dt',node)?.textContent.toLowerCase().includes('price'));
      if(row){$('dt',row).textContent='Live price & supply';const key=card.dataset.browserCard,v=lowestPricedVariant(key);$('dd',row).textContent=supplyPrice(key)+(v?' · '+((liveByKey[key]?.variants||[]).some(x=>x.status==='available')?'supply available':'out of stock'):'')}
    }
  }''')
s=replace(s,"    doseSelect.disabled=stage==='new'&&!item.fixedDose;","    syncSupplyPeriod();\n    doseSelect.disabled=stage==='new'&&!item.fixedDose;")
i=s.index('  function syncBrowserLive(){');j=s.index('\n  const theoryWeight=',i)
s=s[:i]+'  function syncBrowserLive(){syncSupplyPeriod()}\n'+s[j:]
i=s.index("if(field==='price')return ");j=s.index(";if(field==='evidence')",i)
s=s[:i]+"if(field==='price')return lowestPricedVariant(key)?supplyPrice(key)+' · '+(variants.some(v=>v.status==='available')?'supply available':'currently out of stock'):'No live supply listing'"+s[j:]
s=replace(s,"if(!response.ok)throw Error('catalogue');for(const product of body.products||[])","if(!response.ok)throw Error('catalogue');priceCheckedAt=new Date();for(const product of body.products||[])")
files['medicine-front-door-integrated-v1.js']=s
old='public-feedback-20261017-b7d5bf35aac0'
digest=hashlib.sha256(''.join(k+'\n'+v for k,v in sorted(files.items())).encode()).hexdigest()
build='price-period-20261018-'+digest[:12]
for p in (root/'after').rglob('*'):
 if p.is_file():
  k=str(p.relative_to(root/'after'))
  if p.suffix in ['.html','.js','.css','.json']:
   value=files.get(k,p.read_text())
   if old in value:files[k]=value.replace(old,build)
for k in list(files):files[k]=files[k].replace(old,build)
for asset,version in [('treatment-medication-catalogue-v1.js','copy-20260911'),('treatment-order-prototype-v1.js','verify-before-pay-20260911b'),('medicine-front-door-integrated-v1.js','detail-restored-20260911')]:
 files['treatment-order.html']=replace(files['treatment-order.html'],'/'+asset+'?v='+version,'/'+asset+'?v='+build)
release=json.loads(files['public-release.json'])
release['scope']='Correct treatment-price supply periods; retain approved public feedback release'
release['baseDeployment']='d3aafa94-8a22-4671-af09-89f5ef1a2b4c'
release['source']='https://github.com/shiftsometimber/shift-core/tree/proof/public-feedback-20261017/release/public-feedback-20261017/price-period-20261018'
files['public-release.json']=json.dumps(release,indent=2)+'\n'
changes=[]
for k,s in sorted(files.items()):
 before=current(k)
 if s==before:continue
 p=out/'after'/k;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)
 changes.append({'path':'/'+k,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(s.encode()).hexdigest()})
(out/'prepared-changes.json').write_text(json.dumps({'build':build,'baseDeployment':'d3aafa94-8a22-4671-af09-89f5ef1a2b4c','changes':changes},indent=2))
print(json.dumps({'build':build,'changed':len(changes),'priceSourcePaths':4,'otherChanges':'existing build marker/cache references only'}))
