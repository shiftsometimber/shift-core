(()=>{
  'use strict';
  const API=(window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
  const actions={'/auth/register':'member_register','/auth/login':'member_login','/auth/request-password-reset':'password_reset','/v1/hq/auth/bootstrap':'hq_bootstrap','/v1/hq/auth/login':'hq_login'};
  let configPromise,scriptPromise;
  const pending=new Map();
  function problem(message,code='security_check_unavailable'){const e=new Error(message);e.code=code;return e}
  async function config(){
    if(configPromise)return configPromise;
    configPromise=(async()=>{
      const controller=new AbortController();let timer;
      try{
        return await Promise.race([
          (async()=>{
            const response=await fetch(API+'/v1/auth/turnstile-config',{credentials:'include',cache:'no-store',signal:controller.signal});
            if(!response.ok)throw problem('The sign-in security check is unavailable. Please try again.');
            const c=await response.json();
            if(typeof c.required!=='boolean'||typeof c.enabled!=='boolean')throw problem('The sign-in security check returned an invalid response. Please try again.');
            return c;
          })(),
          new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(problem('The sign-in security check could not connect. Please try again.','security_check_timeout'))},8000)})
        ]);
      }finally{clearTimeout(timer)}
    })().catch(error=>{configPromise=null;throw error});
    return configPromise;
  }
  function script(){
    if(window.turnstile)return Promise.resolve();
    if(scriptPromise)return scriptPromise;
    scriptPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');let done=false;
      const finish=error=>{if(done)return;done=true;clearTimeout(timer);s.onload=s.onerror=null;if(error){s.remove();reject(error)}else resolve()};
      const timer=setTimeout(()=>finish(problem('The security check did not load. Please try again.','security_check_timeout')),12000);
      s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.defer=true;
      s.onload=()=>finish(window.turnstile?null:problem('The security check did not start. Please try again.'));
      s.onerror=()=>finish(problem('The security check could not load. Please try again.'));
      document.head.appendChild(s);
    }).catch(error=>{scriptPromise=null;throw error});
    return scriptPromise;
  }
  async function getToken(action){
    if(pending.has(action))return pending.get(action);
    const form=document.activeElement?.closest('form')||document.querySelector('input[type="password"]')?.form;
    const task=(async()=>{
      const c=await config();if(!c.required)return '';
      if(!c.enabled||!c.siteKey)throw problem('Secure sign-in is temporarily unavailable. Please try again.');
      await script();
      return new Promise((resolve,reject)=>{
        const node=document.createElement('div');node.className='sst-turnstile';node.setAttribute('aria-label','Sign-in security check');
        node.style.cssText='display:block;grid-column:1/-1;max-width:100%;min-height:65px;margin:12px 0;';
        const button=form?.querySelector('button');if(button)button.before(node);else(form||document.body).appendChild(node);
        let id,done=false;
        const cleanup=()=>{try{if(id!==undefined)window.turnstile.remove(id)}catch(_){}node.remove()};
        const finish=(error,token)=>{if(done)return;done=true;clearTimeout(timer);cleanup();if(error)reject(error);else resolve(token)};
        const timer=setTimeout(()=>finish(problem('The security check timed out. Please try signing in again.','security_check_timeout')),45000);
        const failed=()=>finish(problem('The security check failed. Please try again.'));
        try{
          id=window.turnstile.render(node,{sitekey:c.siteKey,action,theme:'auto',execution:'execute',appearance:'always',
            callback:token=>token?finish(null,token):failed(),
            'error-callback':failed,
            'expired-callback':()=>finish(problem('The security check expired. Please try again.')),
            'timeout-callback':()=>finish(problem('The security check timed out. Please try again.','security_check_timeout')),
            'unsupported-callback':()=>finish(problem('The security check could not run in this browser. Please try another browser.'))
          });
          if(done){cleanup();return}
          window.turnstile.execute(id);
        }catch(error){finish(problem('The security check could not start. Please try again.'))}
      });
    })();
    pending.set(action,task);
    try{return await task}finally{if(pending.get(action)===task)pending.delete(action)}
  }
  async function protect(path,data={}){const action=actions[path];if(!action)return data;const token=await getToken(action);return token?{...data,turnstileToken:token}:data}
  window.SSTTurnstile={protect,getToken,config};
})();
