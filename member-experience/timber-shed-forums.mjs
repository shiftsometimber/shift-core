// Fictional editorial samples only. No accounts, private health data, or member posts.
export const timberShedForumRooms=Object.freeze([
 {id:'main-shed',name:'The Main Shed',kicker:'EVERYDAY LIFE',description:'Introductions, ordinary life and good company.',topics:[['What makes a difficult Monday a bit easier?','Small routines, a decent brew, a walk, or just knowing someone gets it.'],['What are you looking forward to this weekend?','The little things count too.']]},
 {id:'shifting-timber',name:'Shifting Timber',kicker:'WEIGHT & HABITS',description:'Experiences, motivation and setbacks — without competition.',topics:[['What helped you stick with one small change?','Share the practical bit, not numbers or treatment instructions.'],['When progress feels slower than expected','A conversation about patience and everyday wins.']]},
 {id:'grub-fit',name:'Grub & Fit',kicker:'FOOD & MOVEMENT',description:'Everyday meals, movement and realistic routines.',topics:[['Your favourite easy midweek meal?','Simple food ideas, without calories or restriction targets.'],['Movement that does not feel like a chore','Walking, gardening, football, dancing — it all counts.']]},
 {id:'good-to-talk',name:'Good to Talk',kicker:'WELLBEING',description:'Confidence, relationships and how life feels.',topics:[['What helps when your head is busy?','Everyday coping and support, not diagnosis or treatment.'],['Making time to check in with someone','Small ways to stay connected.']]},
 {id:'small-wins',name:'Small Wins',kicker:'LIFE BACK',description:'Recognise progress beyond the scales.',topics:[['What went a little better this week?','No comparison. No rankings. Your win is enough.'],['A habit you are quietly proud of','Something useful you have kept doing.']]},
 {id:'after-treatment',name:'Life After Treatment',kicker:'LONG-TERM SUPPORT',description:'Keeping helpful habits through change and transition.',topics:[['What helps a routine survive a busy week?','Realistic habits that do not depend on perfection.'],['Keeping support when circumstances change','Who and what helps you stay connected?']]}
]);
export const timberShedForumRules=Object.freeze([
 'Only your own words, deliberately submitted for community review, could ever be published.',
 'My Timber measurements, treatment records, check-ins, mood and contact details are never used to prefill posts.',
 'No selling, supplying, swapping, sourcing, advertising or facilitating any medicines, investigational treatments, trial-stage drugs, research-use peptides or unapproved injections; no dose advice, unsafe weight-loss challenges, personal attacks or pressure to disclose private information.',
 'Report and moderation processes, trained adult cover, crisis escalation and age controls are required before real discussions open.',
 'No private messaging, member directory, public profiles or direct member contact at launch.'
]);
export function timberShedForumPreview(){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rooms=timberShedForumRooms.map(room=>'<article class="forum-room"><p class="eyebrow">'+escape(room.kicker)+'</p><h3>'+escape(room.name)+'</h3><p>'+escape(room.description)+'</p><div class="forum-topics">'+room.topics.map(([title,summary])=>'<details class="forum-topic"><summary>'+escape(title)+'</summary><p>'+escape(summary)+'</p><p class="forum-sample">Fictional discussion example · no real posts or member replies</p></details>').join('')+'</div></article>').join('');
 return '<section class="section" id="forum-preview"><div class="eyebrow">THE SHED / FORUMS</div><h2>Pull up a chair.</h2><p class="lead">Six proposed discussion rooms. These are fictional examples to review the design, not real conversations. Posting, replies and member profiles are disabled.</p><div class="forum-grid">'+rooms+'</div><aside class="privacy"><strong>Nothing from My Timber is published here.</strong><p>Private tracking data cannot populate discussions. Future posting would require a deliberate, separate publishing action and moderation before any member could see it.</p></aside></section>';
}
