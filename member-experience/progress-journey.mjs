// Informational projections from recorded facts. No clinical target or dose advice.
export function weightProjection(series, now=Date.now()) {
 const DAY=86400000, today=new Date(now).toISOString().slice(0,10), byDay=new Map();
 for(const r of Array.isArray(series)?series:[]) {
  if(!r||typeof r.on!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.on)||typeof r.value!=='number'||!Number.isFinite(r.value)||r.value<20||r.value>400)continue;
  const at=Date.parse(r.on+'T00:00:00Z');
  if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,10)!==r.on||r.on>today||at<now-57*DAY)continue;
  byDay.set(r.on,{on:r.on,at,value:r.value});
 }
 const points=[...byDay.values()].sort((a,b)=>a.at-b.at), last=points.at(-1);
 const unavailable=reason=>({status:'unavailable',reason,recordedDays:points.length});
 if(points.length<8||last.at-points[0].at<28*DAY)return unavailable('Add readings on at least eight different days across four weeks.');
 if(now-last.at>8*DAY)return unavailable('Add a recent weight before extending the trend.');
 const slopes=[];for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)if(points[j].at-points[i].at>=7*DAY)slopes.push((points[j].value-points[i].value)/((points[j].at-points[i].at)/DAY));
 slopes.sort((a,b)=>a-b);const q=p=>slopes[Math.floor((slopes.length-1)*p)], mid=q(.5), lo=q(.25), hi=q(.75);
 if(!slopes.length||lo<0&&hi>0)return unavailable('The recent readings do not show a consistent direction.');
 if(Math.abs(mid)<.005)return unavailable('Your recent trend is broadly steady; no weight-loss projection is shown.');
 const date=n=>new Date(last.at+n*DAY).toISOString().slice(0,10), round=n=>Math.round(n*10)/10;
 const projection=[0,7,14,21,28].map(n=>({on:date(n),value:round(last.value+mid*n),low:round(last.value+lo*n),high:round(last.value+hi*n)}));
 if(projection.some(p=>p.low<20||p.high>400||!Number.isFinite(p.value)))return unavailable('The recent trend cannot be extended within this view.');
 return {status:'ready',from:last.on,to:date(28),recordedDays:points.length,weeklyChangeKg:round(mid*7),projection,meaning:'If your recent trend continues. The shaded scenarios use variation in recorded trends; they are not a probability interval or a guaranteed outcome. No target date or treatment recommendation.'};
}
export function supplyEstimate(t,events=[],now=Date.now()) {
 if(['Blood test','Health appointment'].includes(t.medicine))return null;
 const DAY=86400000,at=v=>Date.parse(v), ordered=[...events].filter(e=>e.treatment_id===t.id&&Number.isFinite(at(e.occurred_at))&&at(e.occurred_at)<=now).sort((a,b)=>at(a.occurred_at)-at(b.occurred_at)||(a.sequence||0)-(b.sequence||0));
 const detail=e=>e.details||JSON.parse(e.body_json||'{}');
 const confirmed=ordered.filter(e=>e.kind==='supply_updated').at(-1), plan=confirmed?detail(confirmed).supplyDetails:null;
 const base={remainingDoses:t.supply,source:'member-reported',informationalOnly:true};
 if(t.status!=='active')return {...base,status:'paused',message:'Supply estimates pause with this treatment.'};
 if(!plan||!Number.isInteger(plan.intervalDays)||!Number.isInteger(plan.leadDays))return {...base,status:'setup',message:'Confirm remaining doses, your prescribed interval and your provider’s lead time to estimate when to check supply.'};
 const usableUntil=plan.usableUntil?at(plan.usableUntil):null;
 if(usableUntil!==null&&(!Number.isFinite(usableUntil)||usableUntil<=now))return {...base,status:'confirm',message:'The recorded usable-until date has passed. Check usable supply with your provider.'};
 const order=ordered.filter(e=>e.kind==='repeat_order').at(-1);
 if(order&&at(order.occurred_at)>=at(confirmed.occurred_at))return {...base,status:'order_recorded',message:'You recorded an order. Confirm the supply when it arrives; this does not prove dispatch or delivery.'};
 let next=at(t.next_at);const lastDose=ordered.filter(e=>e.kind==='dose_taken'&&at(e.occurred_at)>=at(confirmed.occurred_at)).at(-1);
 if(lastDose&&Number.isFinite(next))next=Math.max(next,at(lastDose.occurred_at)+plan.intervalDays*DAY);
 if(!Number.isFinite(next)||next<=now)return {...base,status:'confirm',message:'Confirm your remaining doses and scheduled time. Missing logs are not proof that a dose was taken.'};
 if(!Number.isInteger(t.supply)||t.supply<0)return {...base,status:'confirm',message:'Confirm the quantity you actually have.'};
 const interval=plan.intervalDays*DAY, quantityEnd=next+t.supply*interval;
 // First scheduled dose not covered by quantity or the recorded usability boundary.
 const expiryEnd=usableUntil===null?Infinity:next+Math.max(0,Math.ceil((usableUntil-next)/interval))*interval;
 const due=Math.min(quantityEnd,expiryEnd),checkBy=due-plan.leadDays*DAY;
 return {...base,status:checkBy<=now?'check_now':'estimated',checkBy:new Date(checkBy).toISOString(),nextUncoveredScheduledDate:new Date(due).toISOString(),message:checkBy<=now?'Check your supply and your provider’s reorder arrangements.':'Estimated date to check supply: '+new Date(checkBy).toLocaleDateString('en-GB',{timeZone:'Europe/London'})+'.',limitation:'Assumes your confirmed quantity, logged doses and recorded prescribed interval remain correct. No automatic order, dose change or guaranteed delivery.'};
}
export function validateSupplyDetails(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['intervalDays','leadDays','usableUntil'].includes(k))||!Number.isInteger(v.intervalDays)||v.intervalDays<1||v.intervalDays>90||!Number.isInteger(v.leadDays)||v.leadDays<0||v.leadDays>60||v.usableUntil!==null&&(typeof v.usableUntil!=='string'||!Number.isFinite(Date.parse(v.usableUntil))))throw Error('invalid_supply_details');
 return v;
}
