(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AskTimberIntent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const patterns={
    food:/\b(kebab|takeaway|take away|burger|pizza|chips|curry|chippy|food|eat|eating|dinner|tea|lunch|breakfast|hungry|meal|protein)\b/i,
    movement:/\b(walk|walking|run|running|exercise|training|workout|gym|move|movement|steps|fitness)\b/i,
    pain:/\b(pain|hurts?|killing me|injur(?:y|ed)|swollen|swelling|knee|ankle|hip|shoulder|back)\b/i,
    planning:/\b(late|busy|chaos|plans? changed|no time|travel|shift|work ran over)\b/i
  };
  const answerSignals={
    food:/\b(food|eat|meal|kebab|takeaway|protein|portion|salad|water|sauce|chips|pitta|dinner|lunch|breakfast)\b/i,
    movement:/\b(walk|walking|exercise|movement|training|workout|steps|fitness)\b/i,
    pain:/\b(pain|hurt|injur|swollen|knee|medical|clinician|gp|nhs|111|999)\b/i,
    planning:/\b(plan|today|timing|schedule|late|busy|next|rebuild)\b/i
  };
  function detect(message){return Object.keys(patterns).filter(key=>patterns[key].test(String(message||'')));}
  function covered(answer,intent){return Boolean(answerSignals[intent]&&answerSignals[intent].test(String(answer||'')));}
  function foodAddendum(message){
    if(!patterns.food.test(String(message||'')))return null;
    return {
      heading:'And the food bit',
      text:'If you want the kebab, have the kebab. A chicken shish with salad and pitta is an easier everyday choice; go lighter on creamy sauce and add chips only if you actually want them. No guilt, and no punishment workout afterwards.',
      keyPoint:'The useful choice is the one you can enjoy without turning one takeaway into a written-off day.',
      nextStep:'Order the kebab you want, make one sensible tweak, then carry on normally.'
    };
  }
  function audit(message,data){
    const intents=detect(message),answer=[data&&data.answer,(data&&data.keyPoints||[]).join(' '),(data&&data.nextSteps||[]).join(' ')].join(' ');
    const missing=intents.filter(intent=>!covered(answer,intent));
    return{intents,missing,complete:missing.length===0};
  }
  function complete(message,data){
    // Never append ordinary lifestyle advice to urgent-help signposting.
    if(data?.mode==='safety')return Object.assign({},data);
    const result=Object.assign({},data),coverage=audit(message,result);
    result.intentCoverage=coverage;
    if(coverage.missing.includes('food')){
      const add=foodAddendum(message);
      if(add){
        result.answer=String(result.answer||'').trim()+'\n\n'+add.heading+'\n'+add.text;
        result.keyPoints=[...(result.keyPoints||[]),add.keyPoint];
        result.nextSteps=[...(result.nextSteps||[]),add.nextStep];
        result.intentCoverage=audit(message,result);
      }
    }
    return result;
  }
  return{patterns,detect,covered,audit,complete,foodAddendum};
});

