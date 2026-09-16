// Test harness only. Authenticate a newly created commissioning identity through
// the existing server flow; never inject member state or manufacture UI readiness.
const SYNTHETIC=/^shiftsometimber\+(?:finish|longitudinal|b03|structured|structured-authrender|sport|safety)-[a-z0-9-]+@gmail\.com$/i;
const identities=new WeakMap();

export async function commissioningLogin(page,{site,api=site,oidc,email,password}){
  if(!SYNTHETIC.test(String(email||'')))throw new Error('Acceptance login requires a synthetic commissioning account');
  if(!String(oidc||'').trim())throw new Error('SHIFT_COMMISSIONING_OIDC required');
  const context=page.context();
  const response=await context.request.post(`${api}/v1/auth/login`,{
    headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':oidc},
    data:{email,password}
  });
  if(!response.ok())throw new Error(`Commissioning login failed: HTTP ${response.status()}`);
  // The production server issues the shared-domain cookie. Keep its scope,
  // HttpOnly and SameSite attributes intact instead of copying host-only cookies.
  const origins=[...new Set([new URL(api).origin,new URL(site).origin])];
  for(const origin of origins){
    const me=await context.request.get(`${origin}/v1/me`,{headers:{Origin:site,'Cache-Control':'no-cache'}});
    const body=await me.json().catch(()=>null);
    if(!me.ok()||String(body?.user?.email||'').toLowerCase()!==email.toLowerCase())throw new Error(`Commissioning session did not verify the expected synthetic account at ${origin}: HTTP ${me.status()}`);
  }
  identities.set(context,{email:email.toLowerCase(),site,api});
  return{authenticated:true,origins};
}

export async function memberReady(page,{site,panel=null}){
  const identity=identities.get(page.context());
  if(!identity||identity.site!==site)throw new Error('Member readiness requires a verified commissioning session');
  await page.goto(`${site}/member/dashboard`,{waitUntil:'domcontentloaded',timeout:30000});
  try{
    await page.waitForFunction(()=>{
      const member=document.querySelector('#previewMember'),auth=document.querySelector('#previewAuth');
      return member?.classList.contains('is-ready')&&!member.hidden&&auth?.hidden===true&&member.getBoundingClientRect().height>0;
    },null,{timeout:30000});
  }catch{
    const state=await page.evaluate(()=>({path:location.pathname,title:document.title,memberPresent:!!document.querySelector('#previewMember'),memberReady:document.querySelector('#previewMember')?.classList.contains('is-ready')||false,memberHidden:document.querySelector('#previewMember')?.hidden??null,authHidden:document.querySelector('#previewAuth')?.hidden??null,panels:[...document.querySelectorAll('.mp-panel')].map(x=>x.id)})).catch(()=>({path:new URL(page.url()).pathname,documentUnavailable:true}));
    throw new Error(`Authenticated member UI did not become ready: ${JSON.stringify(state)}`);
  }
  if(panel)await requireMemberPanel(page,panel);
}

export async function requireMemberPanel(page,panel){
  if(!/^[a-z][a-z0-9-]*$/.test(panel))throw new Error('Invalid member panel name');
  const host=page.locator(`#panel-${panel}`);
  if(!await host.count())throw new Error(`Missing member capability: #panel-${panel} is absent from the current dashboard`);
  const candidates=page.locator(`[data-portal-panel="${panel}"],.mp-tab[data-panel="${panel}"]`);
  let control;
  for(let i=0;i<await candidates.count();i++)if(await candidates.nth(i).isVisible()){control=candidates.nth(i);break;}
  // Current utilities live in More. Open the real disclosure as a member would;
  // a hidden or absent navigation destination must still fail.
  if(!control)for(let i=0;i<await candidates.count();i++){
    const candidate=candidates.nth(i),disclosure=candidate.locator('xpath=ancestor::details[not(@open)][1]');
    if(!await disclosure.count())continue;
    const summary=disclosure.locator(':scope > summary').first();
    if(!await summary.isVisible())continue;
    await summary.click();
    if(await candidate.isVisible()){control=candidate;break;}
  }
  if(!control)throw new Error(`Missing member capability: no visible navigation opens #panel-${panel}`);
  await control.click();
  await page.waitForFunction(name=>document.querySelector(`#panel-${name}`)?.classList.contains('active'),panel,{timeout:10000});
  await host.waitFor({state:'visible',timeout:10000});
}
