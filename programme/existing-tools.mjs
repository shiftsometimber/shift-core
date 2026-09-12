// Narrow, read-only connection to owner-scoped free records. No clinical fields,
// notes, scores or measurements are copied into Programme plans or reports.
const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const names=x=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==='string').map(v=>v.trim().slice(0,200)).filter(Boolean))].slice(-50):[];
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x?x:null;
const dates=x=>[...new Set((Array.isArray(x)?x:[]).map(v=>date(object(v).date)).filter(Boolean))].sort();
export async function existingTools(db,userId){
 const row=await db.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();
 let preferences={};
 if(row?.preferences){try{preferences=object(JSON.parse(row.preferences))}catch{throw new Error('Existing tool records could not be read. Your saved records are unchanged.')}}
 const grub=object(preferences.grub),fit=object(preferences.fitJourney),journey=object(preferences.myJourney),setup=object(journey.setup);
 const entries=Object.values(object(fit.entries)).filter(v=>['done','skipped'].includes(object(v).status));
 const reviews=Object.values(object(fit.sessionReviews)).filter(v=>date(object(v).recordedOn));
 const lifeBack={...object(preferences.lifeBack),...object(journey.lifeBack)},lifeDates=dates(lifeBack.entries);
 const table=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='my_journey_weekly_checkins'").first();
 let weekly={available:false,count:null,latestDate:null,href:'/member/journey'};
 if(table){
  const rows=(await db.prepare('SELECT week_ending FROM my_journey_weekly_checkins WHERE user_id=? AND confirmed_at IS NOT NULL ORDER BY week_ending').bind(userId).all()).results;
  const recorded=[...new Set(rows.map(r=>date(r.week_ending)).filter(Boolean))].sort();
  weekly={available:true,count:recorded.length,latestDate:recorded.at(-1)||null,href:'/member/journey'};
 }
 return {source:'existing-member-state',grub:{savedRecipes:names(grub.savedRecipes),weekMeals:names(grub.weekMeals),href:'/member/grub'},fit:{exerciseEntries:entries.length,completedExerciseEntries:entries.filter(v=>v.status==='done').length,sessionReviews:reviews.length,href:'/member/fit'},journey:{hasSavedSetup:Object.keys(setup).length>0,purpose:typeof setup.why==='string'?setup.why.trim().slice(0,500):null,paused:typeof setup.paused==='boolean'?setup.paused:null,startDate:date(setup.startDate),href:'/member/journey'},lifeBack:{count:lifeDates.length,latestDate:lifeDates.at(-1)||null,href:'/member/journey'},weekly,note:'These are your saved free-tool records. Opening them does not change your Programme plan or mark its actions complete. Missing weeks remain unreported.'};
}
