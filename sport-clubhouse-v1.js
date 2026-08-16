const SPORTS={football:'Soccer',rugby:'Rugby',cricket:'Cricket',golf:'Golf',boxing:'Fighting',formula1:'Motorsport',tennis:'Tennis',darts:'Darts'};

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=120, stale-while-revalidate=300','X-Content-Type-Options':'nosniff'}})}
function clean(value,max=120){return String(value||'').replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function score(event){const home=event.intHomeScore,away=event.intAwayScore;return home!==null&&home!==undefined&&away!==null&&away!==undefined?`${home} – ${away}`:''}
function normalise(event,sport){return {id:clean(event.idEvent,40),sport,league:clean(event.strLeague),title:clean(event.strEvent||`${event.strHomeTeam||''} v ${event.strAwayTeam||''}`),home:clean(event.strHomeTeam),away:clean(event.strAwayTeam),score:score(event),date:clean(event.dateEvent,20),time:clean(event.strTime,20),status:clean(event.strStatus||event.strProgress,30),venue:clean(event.strVenue),report:clean(event.strDescriptionEN,280),thumb:/^https:\/\//.test(event.strThumb||'')?event.strThumb:''}}

async function dayFeed(key,sport,date){
  const url=`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/eventsday.php?d=${date}&s=${encodeURIComponent(SPORTS[sport])}`;
  const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Sport/1.0'}});
  if(!response.ok)throw new Error(`provider_${response.status}`);
  const body=await response.json();return (body.events||[]).slice(0,24).map(e=>normalise(e,sport));
}

export async function sportClubhouseRoutes(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(request.method!=='GET'||path!=='/v1/sport/clubhouse')return null;
  const requested=clean(url.searchParams.get('sport')||'football',20).toLowerCase();
  const sport=SPORTS[requested]?requested:'football';
  const date=/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date')||'')?url.searchParams.get('date'):new Date().toISOString().slice(0,10);
  try{
    const events=await dayFeed(env.SPORTSDB_API_KEY||'123',sport,date);
    return json({ok:true,source:'TheSportsDB',sport,date,updated_at:new Date().toISOString(),coverage:'fixtures_and_results',events});
  }catch(error){
    return json({ok:false,source:'TheSportsDB',sport,date,updated_at:new Date().toISOString(),events:[],message:'Live sport is temporarily off the board. Please try again shortly.'},503);
  }
}
