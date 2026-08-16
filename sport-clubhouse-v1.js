const SPORTS={football:'Soccer',rugby:'Rugby',cricket:'Cricket',golf:'Golf',boxing:'Fighting',formula1:'Motorsport',tennis:'Tennis',darts:'Darts'};

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=120, stale-while-revalidate=300','X-Content-Type-Options':'nosniff'}})}
function clean(value,max=120){return String(value||'').replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function score(event){const home=event.intHomeScore,away=event.intAwayScore;return home!==null&&home!==undefined&&away!==null&&away!==undefined?`${home} – ${away}`:''}
function normalise(event,sport){return {id:clean(event.idEvent,40),sport,country:clean(event.strCountry,40),league:clean(event.strLeague),title:clean(event.strEvent||`${event.strHomeTeam||''} v ${event.strAwayTeam||''}`),home:clean(event.strHomeTeam),away:clean(event.strAwayTeam),score:score(event),date:clean(event.dateEvent,20),time:clean(event.strTime,20),status:clean(event.strStatus||event.strProgress,30),venue:clean(event.strVenue),report:clean(event.strDescriptionEN,280),thumb:/^https:\/\//.test(event.strThumb||'')?event.strThumb:''}}

const UK_RE=/\b(england|english|scotland|scottish|wales|welsh|northern ireland|britain|british|united kingdom|premier league|championship|fa cup|efl|six nations|county championship|super league)\b/i;
function ukScore(event){return UK_RE.test([event.country,event.league,event.title,event.venue].join(' '))?1:0}
function ukFirst(events){return events.map((event,index)=>({event,index,uk:ukScore(event)})).sort((a,b)=>b.uk-a.uk||a.index-b.index).map(x=>x.event)}

async function dayFeed(key,sport,date){
  const url=`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/eventsday.php?d=${date}&s=${encodeURIComponent(SPORTS[sport])}`;
  const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Sport/1.0'}});
  if(!response.ok)throw new Error(`provider_${response.status}`);
  const body=await response.json();return ukFirst((body.events||[]).map(e=>normalise(e,sport))).slice(0,24);
}

async function leagueFeed(key,id,sport,endpoint){
  const response=await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/${endpoint}.php?id=${id}`,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Sport/1.0'}});
  if(!response.ok)return[];const body=await response.json();return (body.events||[]).map(e=>normalise(e,sport));
}

async function footballFeed(key,date){
  const [today,next,recent]=await Promise.all([dayFeed(key,'football',date),leagueFeed(key,'4328','football','eventsnextleague'),leagueFeed(key,'4328','football','eventspastleague')]);
  const seen=new Set();return ukFirst([...today,...next,...recent]).filter(event=>event.id&&!seen.has(event.id)&&seen.add(event.id)).slice(0,24);
}

export async function sportClubhouseRoutes(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(request.method!=='GET'||path!=='/v1/sport/clubhouse')return null;
  const requested=clean(url.searchParams.get('sport')||'football',20).toLowerCase();
  const sport=SPORTS[requested]?requested:'football';
  const date=/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date')||'')?url.searchParams.get('date'):new Date().toISOString().slice(0,10);
  try{
    const key=env.SPORTSDB_API_KEY||'123';
    const events=sport==='football'?await footballFeed(key,date):await dayFeed(key,sport,date);
    return json({ok:true,source:'TheSportsDB',sport,date,updated_at:new Date().toISOString(),coverage:'uk_first_fixtures_and_results',events});
  }catch(error){
    return json({ok:false,source:'TheSportsDB',sport,date,updated_at:new Date().toISOString(),events:[],message:'Live sport is temporarily off the board. Please try again shortly.'},503);
  }
}
