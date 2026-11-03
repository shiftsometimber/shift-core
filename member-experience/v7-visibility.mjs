// A presentation projection only. The member's original records remain intact.
export function weightSafeView(value){
 const hidden=new Set(['weight','weightkg','weight_kg','weightlb','weightlbs','weight_lb','currentkg','startkg','startingweight','startweight','currentweight','latestweight','weightchange','weightchangekg','weight_change_kg','weightloss','weight_loss','bmi','bodymassindex','body_mass_index']);
 function clean(v){
  if(Array.isArray(v))return v.filter(item=>!item||!['weight','bmi'].includes(item.key||item.kind||item.topic)).map(clean);
  if(!v||typeof v!=='object')return v;
  const result={};for(const [key,item]of Object.entries(v))if(!hidden.has(key.toLowerCase()))result[key]=clean(item);return result;
 }
 return clean(value);
}
