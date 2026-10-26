// Matt approved this wording and Linda as cover on 26 October 2026.
// A placeholder is never rendered to members and away mode is off by default.
export const approvedAwayTemplate = "Matt's away until [date]. Messages are saved and he'll reply when he's back. For treatment questions, contact your prescriber or pharmacist. If it's urgent, call 999, NHS 111 or Samaritans 116 123.";
export const normalMemberSupportPolicy = Object.freeze({
 owner:'Matt',scope:'App and account questions only',
 availability:'Matt checks app and account questions daily.',
 replyTarget:'Within one working day',urgentMonitoring:false
});
export function validReturnDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
 const date=new Date(value+'T12:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?date:null;
}
export function memberSupportPolicy(env={}){
 const away=env.MEMBER_SUPPORT_AWAY==='true';
 const date=validReturnDate(env.MEMBER_SUPPORT_AWAY_RETURN_ON);
 const custom=String(env.MEMBER_SUPPORT_AWAY_MESSAGE||'').trim();
 const approved=date?approvedAwayTemplate.replace('[date]',new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'}).format(date)):null;
 const configured=!!approved||!!custom&&!/\[[^\]]*\]/.test(custom);
 const coverActive=away&&configured&&env.MEMBER_SUPPORT_COVER_ACTIVE==='true';
 return {...normalMemberSupportPolicy,away,replyTarget:away?null:normalMemberSupportPolicy.replyTarget,
  awayMessage:away?(approved||(configured?custom:'Support availability is being updated. Please check here before expecting a reply.')):null,
  awayMessageConfigured:!away||configured,returnOn:away&&date?env.MEMBER_SUPPORT_AWAY_RETURN_ON:null,
  coverOwner:'Linda',coverActive,
  coverMessage:coverActive?'Linda is covering app and account questions while Matt is away.':null};
}
