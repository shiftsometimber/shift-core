// Shared Europe/London calendar boundaries, including DST.
export function londonMidnight(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day)throw Error('invalid_date');
 const nominal=Date.parse(day+'T00:00:00Z');const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const parts=Object.fromEntries(fmt.formatToParts(new Date(nominal)).map(x=>[x.type,x.value]));const local=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second);return new Date(nominal-(local-nominal)).toISOString();
}
export function reportWindow(start,end){const since=londonMidnight(start),endDay=new Date(end+'T00:00:00Z');if(!Number.isFinite(endDay.getTime())||endDay.toISOString().slice(0,10)!==end)throw Error('invalid_date');endDay.setUTCDate(endDay.getUTCDate()+1);const until=londonMidnight(endDay.toISOString().slice(0,10));const days=(Date.parse(until)-Date.parse(since))/86400000;if(days<=0||days>367)throw Error('invalid_range');return{start,end,since,until,timezone:'Europe/London'};}
