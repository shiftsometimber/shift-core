import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
export const TICKER_NAME='shift-latest-news-ticker-20261024',TICKER_BASE_VERSION='0f747c37-8c8a-4d82-a274-ddf4187662cb',TICKER_BASE_SHA256='48fb86770333fca09f2f3426a7e5f70782aa674f04ef8e1684bf957db4c124fc';
export const APPROVED_TICKER_PATHS=Object.freeze(["/medicine-news/prostate-screening-psa-testing-october-2026","/medicine-news/yellow-card-reporting-update-october-2026","/medicine-news/oral-vk2735-sunrise-announcement-registry-catch-up","/medicine-news/uk-archive-pharmacy-cholesterol-pilot-england"]);
export const hash=s=>createHash('sha256').update(s).digest('hex');
export function approvedTickerModule(source){
 assert.equal(hash(source),TICKER_BASE_SHA256,'Serving ticker source changed');
 const match=source.match(/^const body=("(?:\\.|[^"])*");\n/);assert(match,'Native ticker body literal missing');
 const body=JSON.parse(match[1]),needle="String(row.story_headline || row.headline || '')",replacement="String(("+JSON.stringify(APPROVED_TICKER_PATHS)+".includes(url.pathname) && row.ticker_line) || row.story_headline || row.headline || '')";
 assert.equal(body.split(needle).length,2,'Ticker selector must be unique');
 const afterBody=body.replace(needle,replacement);assert.equal(afterBody.replace(replacement,needle),body);
 const after=source.slice(0,match.index)+'const body='+JSON.stringify(afterBody)+';\n'+source.slice(match[0].length);
 assert.equal(after.replace(JSON.stringify(afterBody),match[1]),source,'Full source inverse must recover the selected native module');
 return {module:after,body:afterBody,beforeBody:body,proof:{beforeSHA256:TICKER_BASE_SHA256,afterSHA256:hash(after),fullInverseVerified:true,approvedPaths:APPROVED_TICKER_PATHS}};
}
