// Discovery leads never constitute primary evidence or permission to publish.
const searchUrl = query => 'https://news.google.com/rss/search?' + new URLSearchParams({q: query + ' when:14d', hl: 'en-GB', gl: 'GB', ceid: 'GB:en'});
export const NEWS_DISCOVERY_SOURCES = [
  {id:'asa-weight-rulings',authority:'ASA / CAP',region:'UK',url:'https://www.asa.org.uk/topic/Weight_and_slimming.html',adapter:'html',eventType:'uk_advertising_enforcement',tier:1,confidence:99},
  {id:'asa-news',authority:'ASA / CAP',region:'UK',url:'https://www.asa.org.uk/advice-and-resources/news.html',adapter:'html',eventType:'uk_advertising_enforcement',tier:1,confidence:99},
  {id:'gphc-news',authority:'GPhC',region:'UK',url:'https://www.pharmacyregulation.org/about-us/news-and-updates',adapter:'html',eventType:'uk_pharmacy_regulation',tier:1,confidence:99},
  {id:'bbc-health',authority:'BBC News',region:'GLOBAL',url:'https://feeds.bbci.co.uk/news/health/rss.xml',adapter:'feed',eventType:'news_discovery',tier:4,confidence:60},
  {id:'guardian-health',authority:'The Guardian',region:'GLOBAL',url:'https://www.theguardian.com/society/health/rss',adapter:'feed',eventType:'news_discovery',tier:4,confidence:60},
  {id:'cd-regulation',authority:'Chemist+Druggist',region:'UK',url:'https://www.chemistanddruggist.co.uk/news/regulation/',adapter:'html',eventType:'news_discovery',tier:4,confidence:60},
  ...[
    ['uk-weight-news-search','UK ("weight loss" OR GLP-1 OR Mounjaro OR Wegovy)'],
    ['uk-health-news-search','UK ("men’s health" OR "mental health" OR "blood pressure" OR "NHS access")'],
    ['uk-advertising-news-search','(ASA OR GPhC OR MHRA) (advertising OR adverts OR enforcement OR "prescription-only")'],
    ['gphc-news-search','site:pharmacyregulation.org (medicines OR prescribing OR advertising OR pharmacies)']
  ].map(([id,query])=>({id,authority:'Google News discovery',region:'GLOBAL',url:searchUrl(query),adapter:'feed',eventType:'news_discovery',tier:4,confidence:40}))
];
export const REQUIRED_DISCOVERY_SOURCES = ['asa-weight-rulings','asa-news','gphc-news','bbc-health','guardian-health','cd-regulation','uk-weight-news-search','uk-health-news-search','uk-advertising-news-search','gphc-news-search'];
export function discoveryLead(source) { return source.eventType === 'news_discovery'; }
export function scanCoverage(sources, results) {
  const active = new Set(sources.map(x=>x.id));
  const missing = ['nhs-england-news','mhra-announcements',...REQUIRED_DISCOVERY_SOURCES].filter(id=>!active.has(id));
  const failed = results.filter(x=>!x.ok).map(x=>x.source);
  return {complete:missing.length===0 && failed.length===0,missing,failed};
}
