(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AskTimberIntent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const patterns={
    food:/\b(kebab|takeaway|take away|burger|pizza|chips|curry|chippy|chocolate|sweets|food|eat|eating|dinner|tea|lunch|breakfast|hungry|meal|protein)\b/i,
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
  // Compatibility export only: the browser must never manufacture health advice.
  function foodAddendum(){return null;}
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
    return result;
  }
  return{patterns,detect,covered,audit,complete,foodAddendum};
});

