// Design review only. Explicit fictional values, never sent to a service.
const journey={version:1,setup:{complete:true,startDate:'2026-08-01',route:'lifestyle',units:'kg',heightCm:180,targetMode:'loss',focus:'energy',reviewCadence:'weekly'},weight:{startKg:100,currentKg:98,targetKg:90},waist:{startCm:108,currentCm:106},clothes:{startTop:'XL',currentTop:'XL',startTrouserWaist:'38 in',currentTrouserWaist:'38 in'},wellbeing:{baseline:50,latest:60,note:''},lifeBack:{baseline:{scores:{energy:60,sleep:55,confidence:60,movement:65,social:70,family:75}}}};
export const fixtureClient = 'const journey='+JSON.stringify(journey)+';'+String.raw`
const previewMessage='Preview only — saving is disabled. Nothing has been saved.';
const blocked=async()=>{const e=new Error(previewMessage);e.status=409;e.code='member_review_read_only';throw e};
const fixture={
 getMyJourney:async()=>({journey:structuredClone(journey)}),
 getMe:async()=>({user:{id:0,firstName:'Fictional member'}}),
 getMemberState:async()=>({state:{preferences:{grub:{savedRecipes:['Fictional saved meal'],weekMeals:[]}}}}),
 getPlanList:async()=>({plans:{current:[],completed:[]}}),
 getConsents:async()=>({consents:[]}),
 getCheckIns:async()=>({check_ins:[{mood:'Good',note:'Fictional review entry',created_at:'2026-09-11T18:00:00Z'}]}),
 getJourneyCheckIn:async()=>({route:'lifestyle',units:'kg',reason:'Review the week in your own words.',week:{ending:'2026-09-13'},prefill:{weightKg:98,waistCm:106}}),
 getJourneyTrends:async()=>({export:{records:[]},message:'Your confirmed weekly records will appear here.'}),
 getDailyShift:async()=>({daily:{daily_output:{status:'setup',headline:'Make room for a better day.',subhead:'One useful next step. Then take it from there.',next:{title:'How are you feeling today?',detail:'Start with your optional private check-in.',cta:'Open my check-in',href:'/member/check-in'}}}}),
 getFitReminder:async()=>({enabled:false,hour:8}),
 conundrum:async({items=[]}={})=>{const choice=items.map(String).join(', ').slice(0,120)||'meal';return {top:[{name:'Preview result · '+choice,minutes:20,protein_g:25,summary:'This example reflects your selection. Recipe matching and cooking instructions are not connected in this preview. This is not a reviewed recipe.'}]};},
};
window.SST_API=new Proxy(fixture,{get:(target,key)=>target[key]||blocked});
window.SST_MEMBER_REVIEW_FETCH=async(url,options={})=>{
 if(options.method&&options.method!=='GET')return Response.json({error:previewMessage,code:'member_review_read_only'},{status:409});
 const path=new URL(url,window.location.origin).pathname;
 if(path.endsWith('/journey/weekly-check-in'))return Response.json(await fixture.getJourneyCheckIn());
 if(path.endsWith('/journey/trends'))return Response.json(await fixture.getJourneyTrends());
 return Response.json({error:'Not connected in this review.'},{status:404});
};
document.addEventListener('submit',e=>{if(e.target.closest('.preview-auth'))e.preventDefault()});
document.addEventListener('click',e=>{
 if(e.defaultPrevented)return;
 const a=e.target.closest('a');if(!a)return;
 const u=new URL(a.href),pages=['dashboard','grub','fit','check-in','saved','settings'];
 if(u.pathname.startsWith('/staging/member/'))return;
 if(u.pathname==='/member/journey')u.pathname='/member/dashboard',u.hash='#journey';
 if(pages.includes(u.pathname.replace('/member/',''))){e.preventDefault();window.location.assign('/staging'+u.pathname+u.hash);return}
 if(u.hash&&u.pathname===location.pathname)return;
 e.preventDefault();document.querySelector('#memberReviewNote').textContent='Design review · this destination is outside the six review screens. No live account is connected.';
});
`;
