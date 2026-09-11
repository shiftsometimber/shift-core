// Organisational prompts only: elapsed time never counts as completion.
export function firstMonth(state){
 if(!state.setup)return {key:'setup',title:'Choose a starting point that fits.',text:'Choose what you want to make easier and save a first action.',step:'preferences',label:'Choose my starting point'};
 const dates=state.slots.map(s=>s.date).sort(),last=dates.at(-1),joined=state.startedOn||dates[0]||state.anchor;
 const elapsed=Math.max(0,Math.floor((Date.parse(state.clock+'T12:00:00Z')-Date.parse(joined+'T12:00:00Z'))/86400000));
 if(last&&last<state.clock)return {key:'return',title:'Pick up where you left off.',text:`Your last saved action was dated ${last}. Look over it, repeat what worked or choose a change. Missing weeks remain unreported.`,step:'fortnight',label:'Look over my saved plan'};
 if(state.review)return {key:'review',title:'Your review is ready.',text:state.review.summary,step:'review',label:'Open my review'};
 if(!state.startedOn)return {key:'routine',title:'Keep the useful bits.',text:'Look over your saved routine. Your joining date was not recorded here, so no first-month stage has been assumed.',step:'fortnight',label:'Look over my saved plan'};
 const stages=[
  [2,'start','Make the first week workable.','Check the dates and portions you chose. Start with the commitment you saved.','fortnight','Check my plan'],
  [3,'prepare','Have what you need.','Check the shopping period and what you already have. Your list follows your saved meals.','list','Check my shopping list'],
  [7,'first-review','How did the week fit?','Report only the actions you want to discuss. Anything you do not report stays unknown.','report','Report my week'],
  [14,'repeat','Keep what helped.','Look over your saved routine. Keeping the same plan is a useful result.','fortnight','Look over my fortnight'],
  [21,'disruption','Make room for a busy week.','If a saved action no longer fits, you can request a change. Otherwise keep your plan.','request','Choose an action to discuss'],
  [28,'reflect','See what you actually recorded.','Look back at your reports and decisions. A gap in the record is a gap, not a conclusion.','history','View my history'],
  [Infinity,'next','Choose your next useful step.','Keep your routine or review what you want to make easier. Nothing changes without your choice.','preferences','Review my preferences']
 ];
 const [,key,title,text,step,label]=stages.find(([end])=>elapsed+1<=end);
 return {key,title,text,step,label,daysSinceStart:elapsed};
}
