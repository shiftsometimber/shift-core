// Presentation only: saved account records decide the state, never visits or clicks.
export function firstWeekView({connected={},workspace=null,feedback=null}={}){
 const chosen=!!workspace?.today?.recipeId&&workspace.today.date===connected.date;
 const previous=!!workspace?.today?.recipeId;
 const returning=previous||!!connected.mood||Number(connected.lifeBack?.entries)>0;
 if(feedback?.feedback)return {state:'reviewed',intro:'Keep what helps. Change what doesn’t.',title:'You’ve told us how it went.',detail:feedback.feedback==='not-fit'?'That step did not fit your week. Your next step below is the place to pick up.':feedback.feedback==='helped'?'You said it helped. Your next step below keeps that feedback in view.':'Your answer is saved. You can come back to the step when it suits you.',label:'See my next step',target:'next'};
 if(feedback&&feedback.active!==false)return {state:'review',intro:'Pick up from your saved step.',title:'Did it make your day any easier?',detail:'After trying your saved step, tell us whether it helped or did not fit. Haven’t tried it? You can say that too.',label:'Review my step',target:'feedback'};
 if(chosen)return {state:'chosen',intro:'One meal chosen. That’s a useful start.',title:'Try it. Then come back to Today.',detail:'Your recipe is saved in Grub. Next time, check in with how you feel and get one manageable next step. Choosing a meal does not log it as eaten.',label:'Optional check-in',target:'checkin'};
 return {state:returning?'returning':'start',intro:returning?'Pick up from here. No need to start again.':'Start with one meal. No need to overhaul your week.',title:returning?'Make today a little easier.':'One useful thing, straight away.',detail:returning?'Choose what fits today. Your saved records are still yours, even if you missed a few days.':'Take a look at a recipe, check what you need and choose it for today. You can use Grub before filling in a check-in.',label:returning?'Choose today’s meal':'Find one meal',target:'meal'};
}
export const firstWeekFunction=firstWeekView.toString();
