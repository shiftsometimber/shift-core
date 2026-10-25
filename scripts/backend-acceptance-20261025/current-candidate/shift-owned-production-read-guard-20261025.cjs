const fs=require('fs');
(async()=>{
 const root='/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024';const o=JSON.parse(fs.readFileSync(root+'/my-timber-owned-runtime-40188985851.json','utf8'));
 if(o.source!=='f8f05127c6578a8e9f040e6275d431348b102db6'||String(o.run)!=='40188985851')throw Error('Wrong owned source/run');
 const cfg=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');const token=cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];if(!token)throw Error('Existing read session missing');
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core/deployments',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const data=await r.json();if(!r.ok||!data.success)throw Error('Owned-version metadata read failed '+r.status);
 const d=data.result.deployments.sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];if(d.id!==o.deploymentId||d.versions.length!==1||d.versions[0].version_id!==o.versionId||d.versions[0].percentage!==100)throw Error('A different release owns production');
 console.log(JSON.stringify({owned:true,version:o.versionId}));
})().catch(e=>{console.error(e.message);process.exit(1)});
