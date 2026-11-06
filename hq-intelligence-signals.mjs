// Read-only operational counts. Each native source keeps its own availability;
// one missing schema must neither hide the other sources nor become zero.
export async function hqIntelligence(DB,at=new Date()){
 const generatedAt=at.toISOString(),weekAgo=new Date(+at-7*86400000).toISOString(),stale=new Date(+at-21*86400000).toISOString(),today=generatedAt.slice(0,10);
 const definitions=[
  {key:'urgent_support',table:'support_tickets',sql:"SELECT COUNT(*) count FROM support_tickets WHERE status!='closed' AND priority='urgent'",args:[],title:'Urgent support tickets',severity:'high',message:'These should be looked at first.',empty:'No urgent support tickets right now.'},
  {key:'overdue_tasks',table:'hq_tasks',sql:"SELECT COUNT(*) count FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND due_at IS NOT NULL AND due_at<?",args:[today],title:'Overdue follow-ups',severity:'high',message:'Follow-ups are past their due date.',empty:'No overdue HQ tasks.'},
  {key:'mot_incomplete',table:'users / assessments',sql:"SELECT COUNT(*) count FROM users u WHERE NOT EXISTS(SELECT 1 FROM assessments a WHERE a.user_id=u.id AND a.status='completed')",args:[],title:'MOT not completed',severity:'medium',message:'Registered people without a completed Shift MOT.'},
  {key:'stale_members',table:'member_status',sql:"SELECT COUNT(*) count FROM member_status WHERE lifecycle_stage IN ('registered','onboarding','active') AND COALESCE(last_activity_at,created_at)<?",args:[stale],title:'Potential disengagement',severity:'medium',message:'Active/onboarding members with no activity for 21+ days.'},
  {key:'open_orders',table:'orders',sql:"SELECT COUNT(*) count FROM orders WHERE status NOT IN ('fulfilled','refunded','cancelled')",args:[],title:'Orders in progress',severity:'medium',message:'Orders not yet fulfilled, refunded or cancelled.'},
  {key:'new_users',table:'users',sql:'SELECT COUNT(*) count FROM users WHERE created_at>=?',args:[weekAgo],title:'New registrations this week',severity:'good',message:'Fresh people entering the Shift journey.'},
  {key:'open_support',table:'support_tickets',sql:"SELECT COUNT(*) count FROM support_tickets WHERE status!='closed'",args:[],title:'Open support load',severity:'medium',message:'All support tickets currently awaiting resolution.'}
 ];
 const signals=await Promise.all(definitions.map(async d=>{
  const base={key:d.key,title:d.title,source:d.table};
  try{
   const statement=DB.prepare(d.sql),row=await (d.args.length?statement.bind(...d.args):statement).first();
   if(!Number.isSafeInteger(row?.count)||row.count<0)throw Error('invalid_source_count');
   return {...base,status:'available',count:row.count,severity:row.count?d.severity:'good',message:row.count?d.message:(d.empty||d.message)};
  }catch{return {...base,status:'unavailable',count:null,severity:'unavailable',message:'This operational source is unavailable. Refresh to check it again.'};}
 }));
 const available=signals.filter(s=>s.status==='available'),high=available.filter(s=>s.severity==='high'&&s.count).length,medium=available.filter(s=>s.severity==='medium'&&s.count).length,missing=signals.length-available.length;
 const coverage={status:missing?(available.length?'partial':'unavailable'):'available',availableSources:available.length,expectedSources:signals.length,unavailableSources:missing};
 const attention=high?'There '+(high===1?'is 1 high-priority area':'are '+high+' high-priority areas')+' needing attention.':medium?medium+' available areas are worth a look.':'No alerts were returned by the available operational sources.';
 const brief=missing?(available.length?missing+' operational source'+(missing===1?' is':'s are')+' unavailable. '+attention:'Operational sources are unavailable. Refresh before assessing the workload.'):attention;
 return {generatedAt,brief,signals,coverage};
}
