import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {bootstrap} from '../activation-measurement/assets.mjs';
import {PAIRS,AI_REFERRER_HOSTS} from '../acquisition-activation/model.mjs';
// Comparison-only: recognise precisely the prior live bootstrap and this
// source-pinned candidate. No runtime transform or broad script stripping.
const previousPairs={google:['organic','cpc'],bing:['organic','cpc'],facebook:['social','paid_social'],instagram:['social','paid_social'],x:['social','paid_social'],linkedin:['social','paid_social'],tiktok:['social','paid_social'],email:['email'],newsletter:['email'],partner:['referral'],referral:['referral'],direct_or_unknown:['none']};
const currentPairs='PAIRS='+JSON.stringify(PAIRS)+',AI_HOSTS='+JSON.stringify(AI_REFERRER_HOSTS)+';';
const priorPairs='PAIRS='+JSON.stringify(previousPairs)+';';
const aiLoop="  for(var aiHost in AI_HOSTS)if(h===aiHost||h==='www.'+aiHost)return{source:AI_HOSTS[aiHost],medium:'referral'};\n";
const once=(text,signature,replacement)=>{assert.equal(text.split(signature).length,2,'Metrics bootstrap signature drift');return text.replace(signature,replacement);};
const protocolGuard="if(ref.protocol!=='https:'&&ref.protocol!=='http:')return null;";
export const previousMetricsBootstrap=once(once(once(bootstrap,currentPairs,priorPairs),aiLoop,''),protocolGuard,'');
assert.equal(createHash('sha256').update(previousMetricsBootstrap).digest('hex'),'271feebb7a9040b1bbeb9011e958651d86e8266ddde3f7c55cce4fe9e4b38881','Prior live metrics bootstrap drift');
assert.equal(createHash('sha256').update(bootstrap).digest('hex'),'1c04156865c81cf052ba9dfd94022ad9c24bb4a2dcfd63a1f674e23c8562e5d3','Candidate metrics bootstrap drift');
const tag=client=>'<script data-shift-inline-bootstrap>'+client+'</script>';
export function preserveExactMetricsBootstrap(html){
 if(!html.includes('data-shift-inline-bootstrap'))return html;
 const prior=tag(previousMetricsBootstrap),current=tag(bootstrap);
 assert.equal(html.split('data-shift-inline-bootstrap').length,2,'Expected one inline metrics bootstrap');
 assert.equal((html.split(prior).length-1)+(html.split(current).length-1),1,'Unknown inline metrics bootstrap');
 return html.replace(prior,current);
}
