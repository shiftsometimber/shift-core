const UPSTREAM='https://projectshift.pages.dev/member-product-v33d.js?v=33h';
const EXPECTED_SHA256='2d50a7ab38e586b317faa9a4fac7b7319dfe983f3f19dd974f76cab862406a33';
const OLD_STONE="const st=Math.floor(pounds/14),lb=Math.round(pounds-st*14); return `${st} st ${lb} lb`;";
const NEW_STONE="const rounded=Math.round(pounds),st=Math.floor(rounded/14),lb=rounded%14; return `${st} st ${lb} lb`;";
const OLD_WAIST="${x.waist_cm?` · ${esc(Number(x.waist_cm).toFixed(1)+' cm')} waist`:''}";
const NEW_WAIST="${x.waist_cm?` · ${esc((localStorage.getItem('shiftWaistUnit')==='in'?(Number(x.waist_cm)/2.54).toFixed(1)+' in':Number(x.waist_cm).toFixed(1)+' cm'))} waist`:''}";

export async function progressStaticPatch(request){
  const url=new URL(request.url);
  if(request.method!=='GET'||url.pathname!=='/member-product-v33d.js')return null;
  const upstream=await fetch(UPSTREAM,{headers:{'Accept':'application/javascript'}});
  if(!upstream.ok)return fail('upstream_unavailable',502);
  const source=await upstream.text();
  const sha=await sha256Hex(source);
  if(sha!==EXPECTED_SHA256)return fail('upstream_fingerprint_drift',503,{sha});
  if(count(source,OLD_STONE)!==1||count(source,OLD_WAIST)!==1)return fail('patch_anchor_drift',503);
  const patched=source.replace(OLD_STONE,NEW_STONE).replace(OLD_WAIST,NEW_WAIST);
  const headers=new Headers({'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=300, must-revalidate','X-Content-Type-Options':'nosniff','X-Shift-Frontend-Authority':'pages-fingerprint+g2-012-patch','X-Shift-Upstream-SHA256':sha});
  return new Response(patched,{status:200,headers});
}
function count(haystack,needle){let n=0,p=0;while((p=haystack.indexOf(needle,p))!==-1){n++;p+=needle.length}return n}
async function sha256Hex(text){const bytes=new TextEncoder().encode(text),digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function fail(error,status,extra={}){return new Response(JSON.stringify({ok:false,error,...extra}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
