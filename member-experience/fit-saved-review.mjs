// Read-only assessment. Never relabel, re-dose or overwrite a retained exercise.
export function savedFitIssues(plan={}){
 const issues=[];
 for(const [index,session] of (plan.sessions||[]).entries()){
  const requested=Number(session.requested_minutes||plan.minutes_per_day),location=String(session.location||plan.location||'').toLowerCase();
  for(const item of session.exercises||[]){
   const identity=String(item.id||'')+' '+String(item.name||'');
   const phase=/cool[- ]down/i.test(identity)?'cool-down':/warm[- ]up/i.test(identity)?'warm-up':null;
   const slot=String(item.group||'').toLowerCase().replace(/[ _]/g,'-');
   if(phase&&slot!==phase)issues.push({session:index,id:item.id,reason:'phase'});
   if(location==='home'&&/hotel/i.test(identity))issues.push({session:index,id:item.id,reason:'setting'});
   const stated=String(item.selection_reason||'').match(/selected (\d+)-minute/);
   if(stated&&requested&&Number(stated[1])!==requested)issues.push({session:index,id:item.id,reason:'context'});
  }
 }
 return issues;
}
// Literal browser copy, kept in sync by behavioural fixtures against the export.
export const savedFitReviewRuntime=String.raw`
  function savedFitIssues(plan={}){
    const issues=[];
    for(const [index,session] of (plan.sessions||[]).entries()){
      const requested=Number(session.requested_minutes||plan.minutes_per_day),location=String(session.location||plan.location||'').toLowerCase();
      for(const item of session.exercises||[]){
        const identity=String(item.id||'')+' '+String(item.name||'');
        const phase=/cool[- ]down/i.test(identity)?'cool-down':/warm[- ]up/i.test(identity)?'warm-up':null;
        const slot=String(item.group||'').toLowerCase().replace(/[ _]/g,'-');
        if(phase&&slot!==phase)issues.push({session:index,id:item.id,reason:'phase'});
        if(location==='home'&&/hotel/i.test(identity))issues.push({session:index,id:item.id,reason:'setting'});
        const stated=String(item.selection_reason||'').match(/selected (\d+)-minute/);
        if(stated&&requested&&Number(stated[1])!==requested)issues.push({session:index,id:item.id,reason:'context'});
      }
    }
    return issues;
  }
`;
