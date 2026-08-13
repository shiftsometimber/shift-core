import fs from 'node:fs';
const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const OUT=process.env.TRUST_EVIDENCE_DIR||'trust-evidence';fs.mkdirSync(OUT,{recursive:true});
const clean=s=>String(s||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const hrefs=html=>[...html.matchAll(/href=["']([^"'#]+)["']/gi)].map(m=>m[1]).filter(x=>!/^mailto:|^tel:|^javascript:/i.test(x));
const toUrl=x=>{try{const u=new URL(x,SITE);return u.origin===new URL(SITE).origin?u:null}catch{return null}};
const pages=new Map(),queue=[new URL('/',SITE)],seen=new Set();
while(queue.length&&pages.size<80){const u=queue.shift();const key=u.pathname.replace(/\.html$/,'')||'/';if(seen.has(key))continue;seen.add(key);let r;try{r=await fetch(u,{headers:{'User-Agent':'Shift-Release-Trust-Audit/1.0'},redirect:'follow'})}catch(e){pages.set(key,{url:u.href,status:0,text:'',error:String(e)});continue}const ct=r.headers.get('content-type')||'';const html=ct.includes('text/html')?await r.text():'';const text=clean(html);pages.set(key,{url:r.url,status:r.status,text:text.slice(0,120000)});if(r.ok&&html)for(const h of hrefs(html)){const v=toUrl(h);if(!v)continue;const p=v.pathname.replace(/\/$/,'')||'/';if(!seen.has(p)&&!p.match(/\.(?:png|jpg|jpeg|webp|svg|pdf|zip|css|js|ico|woff2?)$/i))queue.push(v)}}
const all=[...pages.values()].filter(x=>x.status>=200&&x.status<400),blob=all.map(x=>x.text).join('\n');
const hits=(re)=>all.filter(x=>re.test(x.text)).map(x=>x.url);
const evidence={
 operator:{urls:hits(/Shift Some Timber Ltd|17393135|company number|registered (?:company|office)|operator/i)},
 ai:{urls:hits(/artificial intelligence|\bAI\b|Shift AI|Ask Shift|not a (?:doctor|clinician)|does not replace|human review/i)},
 privacy:{urls:hits(/privacy policy|UK GDPR|data protection|personal data|ICO/i)},
 support:{urls:hits(/contact us|support|help@|enquiries@|hello@|customer support|get in touch/i)},
 providerStatus:{urls:hits(/pharmacy|prescrib|clinician|clinical partner|provider|coming soon|not currently available|when available|partner/i)}
};
const failures=[];for(const [k,v] of Object.entries(evidence))if(!v.urls.length)failures.push(`${k}: no public evidence found`);
// Provider language must not imply a live prescribing/pharmacy service without an explicit qualified/current-status statement somewhere public.
const providerTexts=all.filter(x=>evidence.providerStatus.urls.includes(x.url)).map(x=>x.text).join(' ');const impliesLive=/our (?:pharmacy|prescriber|clinician)|we (?:prescribe|dispense)|medication (?:is|are) available|order (?:Mounjaro|Wegovy)|buy (?:Mounjaro|Wegovy)/i.test(providerTexts);const qualified=/coming soon|not currently available|when available|subject to clinical|partner(?:ship)? (?:being|is being|will be)|register (?:your )?interest|working (?:with|to secure)|independent clinician|provided by a third party/i.test(providerTexts);if(impliesLive&&!qualified)failures.push('providerStatus: live clinical/pharmacy capability appears implied without a qualification/current-status statement');
const report={proof:'G5_005_PUBLIC_TRUST_PRODUCTION_V1',site:SITE,crawled:pages.size,successful:all.length,evidence,providerInterpretation:{impliesLive,qualified},failures,pages:[...pages.entries()].map(([path,x])=>({path,url:x.url,status:x.status,text:x.text.slice(0,500)}))};fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({proof:report.proof,crawled:report.crawled,successful:report.successful,evidence,providerInterpretation:report.providerInterpretation,failures},null,2));if(failures.length)throw new Error(`G5-005 trust audit failed: ${failures.join('; ')}`);console.log('PASS G5-005 production public trust architecture.');