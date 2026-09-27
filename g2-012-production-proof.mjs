import fs from 'node:fs';
import crypto from 'node:crypto';

const URL='https://shiftsometimber.co.uk/member-product-v33d.js?v=33h&g2_012_proof=1';
const CANONICAL_PATH='frontend/member/member-product-v33d.js';
const EXPECTED_AUTHORITY='git:frontend/member/member-product-v33d.js';
const OLD_STONE="const st=Math.floor(pounds/14),lb=Math.round(pounds-st*14); return `${st} st ${lb} lb`;";
const NEW_STONE="const rounded=Math.round(pounds),st=Math.floor(rounded/14),lb=rounded%14; return `${st} st ${lb} lb`;";
const OLD_WAIST="${x.waist_cm?` · ${esc(Number(x.waist_cm).toFixed(1)+' cm')} waist`:''}";
const NEW_WAIST="${x.waist_cm?` · ${esc((localStorage.getItem('shiftWaistUnit')==='in'?(Number(x.waist_cm)/2.54).toFixed(1)+' in':Number(x.waist_cm).toFixed(1)+' cm'))} waist`:''}";

const fail=(m)=>{throw new Error(m)};
const count=(s,n)=>s.split(n).length-1;
const canonical=fs.readFileSync(CANONICAL_PATH,'utf8');
const canonicalSha256=crypto.createHash('sha256').update(canonical).digest('hex');
const response=await fetch(URL,{headers:{Accept:'application/javascript','Cache-Control':'no-cache'}});
if(!response.ok)fail(`live member client HTTP ${response.status}`);
const source=await response.text();
const sha256=crypto.createHash('sha256').update(source).digest('hex');
const authority=response.headers.get('x-shift-frontend-authority');
if(authority!==EXPECTED_AUTHORITY)fail(`unexpected frontend authority ${authority}`);
if(sha256!==canonicalSha256)fail(`live Git-authoritative member product drift ${sha256} != ${canonicalSha256}`);
if(count(source,NEW_STONE)!==1||count(source,OLD_STONE)!==0)fail('live source does not contain exactly the repaired stone/lb algorithm');
if(count(source,NEW_WAIST)!==1||count(source,OLD_WAIST)!==0)fail('live source does not contain exactly the repaired waist-unit history algorithm');

// Execute the exact deployed stone/lb algorithm body against rollover edges.
const stoneFormatter=new Function('pounds',`${NEW_STONE.replace(' return ',' return ')}`);
const stoneCases=[
  {pounds:13.49,expected:'0 st 13 lb'},
  {pounds:13.50,expected:'1 st 0 lb'},
  {pounds:27.50,expected:'2 st 0 lb'},
  {pounds:196,expected:'14 st 0 lb'},
];
for(const t of stoneCases){const actual=stoneFormatter(t.pounds);if(actual!==t.expected)fail(`stone rollover ${t.pounds}: ${actual} != ${t.expected}`);if(/ 14 lb$/.test(actual))fail(`illegal 14 lb remainder: ${actual}`)}

// Mirror the deployed history expression with the same persisted preference contract.
const waistHistory=(cm,unit)=>unit==='in'?`${(Number(cm)/2.54).toFixed(1)} in`:`${Number(cm).toFixed(1)} cm`;
const waistCases=[
  {cm:100,unit:'cm',expected:'100.0 cm'},
  {cm:100,unit:'in',expected:'39.4 in'},
  {cm:91.44,unit:'in',expected:'36.0 in'},
];
for(const t of waistCases){const actual=waistHistory(t.cm,t.unit);if(actual!==t.expected)fail(`waist history ${JSON.stringify(t)} => ${actual}`)}

const evidence={
  proof:'G2_012_DEPLOYED_PROGRESS_UNITS_V2_GIT_AUTHORITY',
  url:URL,
  capturedAt:new Date().toISOString(),
  status:response.status,
  authority,
  canonicalPath:CANONICAL_PATH,
  canonicalSha256,
  liveSha256:sha256,
  bytes:Buffer.byteLength(source),
  oldStoneOccurrences:count(source,OLD_STONE),
  newStoneOccurrences:count(source,NEW_STONE),
  oldWaistOccurrences:count(source,OLD_WAIST),
  newWaistOccurrences:count(source,NEW_WAIST),
  stoneCases,
  waistCases,
};
fs.mkdirSync('g2-012-production-evidence',{recursive:true});
fs.writeFileSync('g2-012-production-evidence/report.json',JSON.stringify(evidence,null,2));
fs.writeFileSync('g2-012-production-evidence/live-member-product.js',source);
console.log(JSON.stringify(evidence,null,2));
console.log('PASS G2-012 exact deployed Progress unit semantics from Git-authoritative member source.');
