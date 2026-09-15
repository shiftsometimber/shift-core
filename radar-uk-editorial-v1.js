import { REQUIRED_DISCOVERY_SOURCES } from './radar-discovery-sources-v1.js';
const WEIGHT = /\b(obesity|overweight|weight[- ]?loss|weight management|anti-obesity|glp[- ]?1|glucagon-like peptide[- ]?1|semaglutide|tirzepatide|liraglutide|orlistat|retatrutide|orforglipron|cagrisema|cagrilintide|mounjaro|wegovy|saxenda|foundayo)\b/i;
const UK_HEALTH = /\b(pharmac(?:y|ies|ist|ists)|pharmacy first|prescrib\w*|blood pressure|hypertension|cholesterol|diabetes|mental[- ]health|talking therapies|burnout|depression|anxiety|men['’]?s health|prostate|testosterone|erectile|sleep apnoea|sleep apnea|smoking|stop smoking|flu jab\w*|vaccin\w*|screening|nhs access|waiting lists?|GP appointments?|GP walk-in|ADHD|HeartFlow|suicide|wellbeing|gambling|severe mental illness|antidepressants?)\b/i;
const UK_REGIONS = new Set(['UK', 'England', 'Scotland', 'Wales', 'Northern Ireland']);
const UK_HEALTH_AUTHORITIES = new Set(['ASA / CAP', 'GPhC', 'NHS England', 'MHRA', 'NICE', 'Department of Health and Social Care', 'Welsh Government', 'Scottish Government', 'Department of Health Northern Ireland', 'Mental Health UK', 'SAMH', 'Public Health Scotland', 'NIHR', 'University of Oxford', 'University of Bristol']);
export const REQUIRED_UK_NEWS_SOURCES = ['nhs-england-news', 'mhra-announcements', ...REQUIRED_DISCOVERY_SOURCES];
export function isRelevantNewsItem(source = {}, item = {}) {
  const text = `${item.title || ''} ${item.summary || ''}`;
  if (WEIGHT.test(text)) return true;
  if (['ASA / CAP','GPhC','Chemist+Druggist','Google News discovery','Sky News','ITV News','Associated Press'].includes(source.authority) && /\b(POMs?|prescription[- ]only|pharmac(?:y|ies)|medicines?)\b/i.test(text) && /\b(advertis\w*|adverts?|enforcement|crackdown|improvement notice)\b/i.test(text)) return true;
  if (['BBC News','The Guardian','Google News discovery','Sky News','ITV News','Associated Press','Chemist+Druggist'].includes(source.authority) && /\b(mental[- ]health|blood pressure|hypertension|cholesterol|diabetes|prostate|testosterone|erectile|sleep apnoea|smoking|NHS|men['’]?s health)\b/i.test(text) && /\b(UK|Britain|British|England|Scotland|Wales|Northern Ireland|NHS)\b/i.test(text)) return true;
  // Explicit UK authority/primary-charity sources only; evidence verification remains separate.
  return UK_REGIONS.has(source.region) && UK_HEALTH_AUTHORITIES.has(source.authority || '') && UK_HEALTH.test(text);
}
export function newsRegion(source = {}, item = {}) {
  if (UK_REGIONS.has(source.region)) return source.region;
  if (/\b(?:SURMOUNT-REAL UK|United Kingdom|UK cohort|UK study|UK trial)\b/i.test(item.title || '')) return 'UK';
  const countries = [...new Set((item.countries || []).filter(Boolean))];
  if (countries.length && countries.every(x => /^(United Kingdom|England|Scotland|Wales|Northern Ireland)$/i.test(x))) return 'UK';
  return source.region || 'GLOBAL';
}
export function ukCoverage(sources = []) {
  const active = new Set(sources.filter(x => x.active !== 0 && x.active !== false).map(x => x.id));
  const missing = REQUIRED_UK_NEWS_SOURCES.filter(id => !active.has(id));
  return { complete: missing.length === 0, required: REQUIRED_UK_NEWS_SOURCES, missing };
}
export function partitionNewsRows(rows) {
  const uk = [], international = [];
  for (const row of rows) {
    const region = newsRegion({ region: row.region }, { title: row.headline });
    (UK_REGIONS.has(region) ? uk : international).push({ ...row, region });
  }
  return { uk, international };
}
