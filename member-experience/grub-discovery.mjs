// A discovery overlay never edits recipe content or member state.
// Saved references remain addressable. New content needs its own publication proof.
import {GRUB_DISCOVERY_MANIFEST} from './grub-discovery-manifest-20261017.mjs';
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
export const discoverable=recipe=>recipe?.discovery?.eligible!==false;
export const discoveryRank=recipe=>recipe?.discovery?.rank??1000;
export const discoveryTier=recipe=>recipe?.discovery?.tier==='core'?0:recipe?.discovery?.tier==='cooking'?1:2;
export async function applyGrubDiscovery(authority,manifest=GRUB_DISCOVERY_MANIFEST){
 if(authority.incomplete||manifest.status!=='approved')return authority;
 if(manifest.proof!=='GRUB_UK_DISCOVERY_20261017'||!Array.isArray(manifest.rows)||new Set(manifest.rows.map(r=>r.id)).size!==manifest.rows.length)throw Error('Invalid Grub discovery authority');
 const bindings=new Map(manifest.rows.map(r=>[r.id,r]));
 const rows=await Promise.all(authority.rows.map(async r=>{
  const binding=bindings.get(r.id);
  const exact=binding?.eligible===true&&await digest({title:r.title,data:r.data,review:r.review})===binding.content_sha256;
  return {...r,discovery:{eligible:exact,tier:exact?binding.tier:'saved-only',rank:exact?binding.rank:10000,decision:binding?.decision||'withdraw',reason:binding?.reason||'This saved recipe is no longer offered in new suggestions.',hideImage:true}};
 }));
 return {...authority,rows,discoveryApplied:true};
}
