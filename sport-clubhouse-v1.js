const SPORTS={football:'Soccer',rugby:'Rugby',cricket:'Cricket',golf:'Golf',boxing:'Fighting',formula1:'Motorsport',tennis:'Tennis',darts:'Darts'};
const BBC_FEEDS={football:'football',rugby:'rugby-union',cricket:'cricket',golf:'golf',boxing:'boxing',formula1:'formula1',tennis:'tennis',darts:'darts'};

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=120, stale-while-revalidate=300','X-Content-Type-Options':'nosniff'}})}
function clean(value,max=120){return String(value||'').replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function score(event){const home=event.intHomeScore,away=event.intAwayScore;return home!==null&&home!==undefined&&away!==null&&away!==undefined?`${home} – ${away}`:''}
function normalise(event,sport){return {id:clean(event.idEvent,40),sport,country:clean(event.strCountry,40),league:clean(event.strLeague),title:clean(event.strEvent||`${event.strHomeTeam||''} v ${event.strAwayTeam||''}`),home:clean(event.strHomeTeam),away:clean(event.strAwayTeam),score:score(event),date:clean(event.dateEvent,20),time:clean(event.strTime,20),status:clean(event.strStatus||event.strProgress,30),venue:clean(event.strVenue),report:clean(event.strDescriptionEN,280),thumb:/^https:\/\//.test(event.strThumb||'')?event.strThumb:''}}

const UK_RE=/\b(england|english|scotland|scottish|wales|welsh|northern ireland|ireland|irish|britain|british|united kingdom|premier league|english championship|efl championship|fa cup|efl|six nations|county championship)\b/i;
function ukScore(event){return UK_RE.test([event.country,event.league,event.title,event.venue].join(' '))?1:0}
function ukFirst(events){return events.map((event,index)=>({event,index,uk:ukScore(event)})).sort((a,b)=>b.uk-a.uk||a.index-b.index).map(x=>x.event)}
function decodeXml(value){return clean(String(value||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>'),500)}
function tag(xml,name){return decodeXml((xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,'i'))||[])[1])}
async function storyFeed(sport){
 const section=BBC_FEEDS[sport]||'sport';const response=await fetch(`https://feeds.bbci.co.uk/sport/${section}/rss.xml`,{headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'Shift-Some-Timber-Sport/1.0'}});if(!response.ok)return[];
 const xml=await response.text();return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0,10).map((match,index)=>{const item=match[1],link=tag(item,'link');return{id:`bbc-${sport}-${index}`,title:tag(item,'title'),summary:tag(item,'description'),published_at:tag(item,'pubDate'),url:/^https:\/\/www\.bbc\.(co\.uk|com)\//.test(link)?link:'',source:'BBC Sport'}}).filter(x=>x.title&&x.url);
}
async function tableFeed(key,league,season){
 const response=await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/lookuptable.php?l=${encodeURIComponent(league)}&s=${encodeURIComponent(season)}`,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Sport/1.0'}});if(!response.ok)return[];const body=await response.json();
 return (body.table||[]).slice(0,20).map((row,index)=>({position:Number(row.intRank||index+1),team:clean(row.strTeam,80),played:Number(row.intPlayed||0),won:Number(row.intWin||0),drawn:Number(row.intDraw||0),lost:Number(row.intLoss||0),goal_difference:Number(row.intGoalDifference||0),points:Number(row.intPoints||0)}));
}
const FOOTBALL_COUNTRIES=['England','Scotland','Wales','Northern Ireland','Ireland'];
async function footballLeagues(key){
 const lists=await Promise.all(FOOTBALL_COUNTRIES.map(async country=>{const response=await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/search_all_leagues.php?c=${encodeURIComponent(country)}&s=Soccer`,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Sport/1.0'}});if(!response.ok)return[];const body=await response.json();return body.countries||[]}));
 const seen=new Set();return lists.flat().filter(x=>x.idLeague&&x.idCup!=='1'&&!seen.has(x.idLeague)&&seen.add(x.idLeague)).map(x=>({id:clean(x.idLeague,12),name:clean(x.strLeague,90),country:clean(x.strCountry,30),division:Number(x.intDivision||99),season:clean(x.strCurrentSeason,20)})).sort((a,b)=>FOOTBALL_COUNTRIES.indexOf(a.country)-FOOTBALL_COUNTRIES.indexOf(b.country)||a.division-b.division||a.name.localeCompare(b.name));
}

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

async function footballFeed(key,date,league){
  const [today,next,recent]=await Promise.all([dayFeed(key,'football',date),leagueFeed(key,league,'football','eventsnextleague'),leagueFeed(key,league,'football','eventspastleague')]);
  const leagueName=next[0]?.league||recent[0]?.league||'';const seen=new Set();return ukFirst([...today.filter(x=>String(x.league).toLowerCase()===String(leagueName).toLowerCase()),...next,...recent]).filter(event=>ukScore(event)&&event.id&&!seen.has(event.id)&&seen.add(event.id)).slice(0,30);
}

export async function sportClubhouseRoutes(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(request.method!=='GET'||path!=='/v1/sport/clubhouse')return null;
  const requested=clean(url.searchParams.get('sport')||'football',20).toLowerCase();
  const sport=SPORTS[requested]?requested:'football';
  const date=/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date')||'')?url.searchParams.get('date'):new Date().toISOString().slice(0,10);
  try{
    const key=env.SPORTSDB_API_KEY||'123';
    const leagues=sport==='football'?await footballLeagues(key):[];
    const requestedLeague=clean(url.searchParams.get('league')||'4328',12),selected=leagues.find(x=>x.id===requestedLeague)||leagues.find(x=>x.id==='4328')||leagues[0];
    const events=sport==='football'&&selected?await footballFeed(key,date,selected.id):await dayFeed(key,sport,date);
    const [stories,table]=await Promise.all([storyFeed(sport).catch(()=>[]),sport==='football'&&selected?tableFeed(key,selected.id,selected.season||`${new Date().getUTCFullYear()}-${new Date().getUTCFullYear()+1}`).catch(()=>[]):Promise.resolve([])]);
    return json({ok:true,source:'TheSportsDB + BBC Sport',sport,date,updated_at:new Date().toISOString(),coverage:'uk_and_ireland_multi_league_clubhouse',selected_league:selected||null,leagues,events,stories,table});
  }catch(error){
    return json({ok:false,source:'TheSportsDB',sport,date,updated_at:new Date().toISOString(),events:[],message:'Live sport is temporarily off the board. Please try again shortly.'},503);
  }
}
