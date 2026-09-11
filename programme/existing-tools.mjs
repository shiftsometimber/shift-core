// Read-only adapter for the existing free tools. Name-only recipes and undated
// exercise entries must not be promoted into Programme slots or allergy claims.
const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const names=x=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==='string').map(v=>v.trim().slice(0,200)).filter(Boolean))].slice(-50):[];
export async function existingTools(db,userId){
 const row=await db.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();
 let preferences={};
 if(row?.preferences){try{preferences=object(JSON.parse(row.preferences))}catch{throw new Error('Existing tool records could not be read. Your saved records are unchanged.')}}
 const grub=object(preferences.grub),fit=object(preferences.fitJourney);
 const entries=Object.values(object(fit.entries)).filter(v=>['done','skipped'].includes(object(v).status));
 const reviews=Object.values(object(fit.sessionReviews)).filter(v=>typeof object(v).recordedOn==='string');
 return {source:'existing-member-state',grub:{savedRecipes:names(grub.savedRecipes),weekMeals:names(grub.weekMeals),href:'/member/grub'},fit:{exerciseEntries:entries.length,completedExerciseEntries:entries.filter(v=>v.status==='done').length,sessionReviews:reviews.length,href:'/member/fit'},note:'These records remain in your free tools. Recipe names alone do not supply dates, portions or reviewed ingredients; exercise entries do not establish completion of a Programme action.'};
}
