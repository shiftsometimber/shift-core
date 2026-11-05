// One clock shared by the server and the existing Today/Grub browser bundle.
// Minute-inclusive boundaries requested by Matt. Tea continues over midnight;
// the pile ledger still uses its existing UK calendar day, never a meal period.
export function mealPeriod(at=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(at));
 const minutes=Number(parts.find(p=>p.type==='hour').value)*60+Number(parts.find(p=>p.type==='minute').value);
 return minutes>=180&&minutes<=660?'breakfast':minutes>=661&&minutes<=900?'lunch':'tea';
}
export function makeMealView(periodFor){return function(view,at=new Date()){
 if(!view?.mealOffers||view.actionPinned||view.completedToday||view.action?.kind!=='food')return view;
 const period=periodFor(at),offer=view.mealOffers[period];
 if(!offer||view.mealPeriod===period&&view.action?.id===offer.action?.id)return view;
 return {...view,action:offer.action,alternatives:offer.alternatives,mealPeriod:period};
}; }
export const mealView=makeMealView(mealPeriod);
