const WORDS=[
  [/\bzucchini\b/gi,'courgette'],[/\beggplant\b/gi,'aubergine'],[/\bcilantro\b/gi,'coriander'],
  [/\bscallions?\b/gi,'spring onions'],[/\bgreen onions?\b/gi,'spring onions'],[/\bground beef\b/gi,'beef mince'],
  [/\bground turkey\b/gi,'turkey mince'],[/\barugula\b/gi,'rocket'],[/\bbell peppers?\b/gi,'peppers'],
  [/\bconfectioners'? sugar\b/gi,'icing sugar'],[/\bgranulated sugar\b/gi,'caster sugar']
];
const US_UNITS=/\b(cups?|fluid ounces?|ounces?|oz\.?|pounds?|lbs?\.?)\b/i;
const US_TEMPERATURE=/\b\d{2,3}\s*(?:degrees?\s*)?f(?:ahrenheit)?\b/i;

export function ukWords(value){let output=String(value||'');for(const[from,to]of WORDS)output=output.replace(from,to);return output}
export function auditUkRecipe(recipe){
  const ingredients=(recipe.ingredients||[]).map(row=>typeof row==='string'?row:row.text||`${row.amount||''} ${row.item||''}`.trim());
  const method=recipe.method||[];
  const all=[...ingredients,...method].join(' '),blockers=[];
  if(US_UNITS.test(all))blockers.push('non_metric_measurements');
  if(US_TEMPERATURE.test(all))blockers.push('fahrenheit_temperature');
  if(WORDS.some(([pattern])=>{pattern.lastIndex=0;return pattern.test(all)}))blockers.push('non_uk_ingredient_language');
  if(recipe.source?.market&&recipe.source.market!=='UK')blockers.push('non_uk_source_requires_reauthoring');
  return{eligible:blockers.length===0,blockers};
}
