const DEFAULT_MIN_UTILISATION=0.8;
const CONTINUOUS_GROUPS=new Set(['cardio','conditioning','walking']);

export function ensureFitDurationUtilisation(plan,{minimumUtilisation=DEFAULT_MIN_UTILISATION}={}){
  const sessions=Array.isArray(plan?.sessions)?plan.sessions:[];
  const report=[];
  let changed=false;
  for(const session of sessions){
    const requested=Number(session?.requested_minutes||plan?.minutes_per_day||0);
    const exercises=Array.isArray(session?.exercises)?session.exercises:[];
    if(!requested||!exercises.length){report.push({requested_minutes:requested,changed:false,reason:'missing_session_data'});continue;}
    let total=sumMinutes(exercises);
    const target=Math.ceil(requested*minimumUtilisation);
    if(total>=target){session.estimated_minutes=total;report.push({requested_minutes:requested,estimated_minutes:total,changed:false,utilisation:total/requested});continue;}

    const continuous=exercises
      .filter(isContinuousMovement)
      .sort((a,b)=>Number(b.minutes||0)-Number(a.minutes||0))[0];
    if(!continuous){
      session.estimated_minutes=total;
      report.push({requested_minutes:requested,estimated_minutes:total,changed:false,reason:'no_safe_continuous_block',utilisation:total/requested});
      continue;
    }

    const required=Math.min(requested-total,Math.max(0,target-total));
    if(required>0){
      const before=Number(continuous.minutes||0);
      continuous.minutes=before+required;
      continuous.duration_adaptation={kind:'continuous_block_extension',base_minutes:before,requested_session_minutes:requested,reason:'Fill the requested session with one continuous, appropriate cardio/movement block rather than repeating exercises.'};
      total=sumMinutes(exercises);
      session.estimated_minutes=total;
      session.duration_utilisation_pct=Math.round((total/requested)*1000)/10;
      changed=true;
      report.push({requested_minutes:requested,estimated_minutes:total,changed:true,extended_id:String(continuous.id||continuous.name||''),from_minutes:before,to_minutes:Number(continuous.minutes),utilisation:total/requested});
    }
  }
  return{changed,minimum_utilisation:minimumUtilisation,sessions:report};
}

export function isContinuousMovement(exercise){
  const group=String(exercise?.group||exercise?.movement_group||'').toLowerCase();
  const text=`${exercise?.id||''} ${exercise?.name||''}`.toLowerCase();
  return CONTINUOUS_GROUPS.has(group)||/\b(walk|walking|bike|cycling|cycle|rower|rowing|stepper|cross trainer|elliptical)\b/.test(text);
}

function sumMinutes(exercises){return exercises.reduce((total,x)=>total+Math.max(0,Number(x?.minutes||0)),0);}
