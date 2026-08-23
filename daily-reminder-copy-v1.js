export function buildDailyReminderMessage(coach={}){
  const next=coach.daily_output?.next||{};
  const decision=next.title
    ?`${next.title}. ${next.detail||''}`.trim()
    :coach.mode==='recover'
      ?'Recovery is the useful job today.'
      :'Your plan for today is ready.';
  return{next,decision};
}
