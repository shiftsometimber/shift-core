(function(){
  'use strict';
  function push(event,data){
    try{
      var payload=Object.assign({shift_event_version:'v42m'},data||{});
      if(window.SSTAnalytics&&typeof window.SSTAnalytics.track==='function'){
        window.SSTAnalytics.track(event,payload);
      }
    }catch(e){}
  }
  function template(){return document.body&&document.body.getAttribute('data-template')||'unknown';}
  function path(){return location.pathname;}
  function stage(){var p=path();if(p.indexOf('/start-here')===0)return 'start_here';if(p.indexOf('/tools')===0||p==='/tools'||p.indexOf('/health-mot')===0)return 'utility';if(p.indexOf('/member')===0)return 'member_experience';if(p.indexOf('/treatment')===0||p.indexOf('/before-you-decide')===0||p.indexOf('/comparison')===0)return 'treatment_intent';if(p.indexOf('/programme')===0)return 'programme_interest';return 'discovery';}
  function destination(href){
    if(!href)return 'none';
    if(href.indexOf('/member')===0)return 'my_shift';
    if(href.indexOf('/tools')===0||href==='/tools')return 'tools';
    if(href.indexOf('/treatment')===0||href.indexOf('/before-you-decide')===0)return 'treatment';
    if(href.indexOf('/programme')===0)return 'programme';
    if(href.indexOf('/tap-room')===0)return 'community';
    if(href.indexOf('/start-here')===0)return 'start_here';
    if(href.indexOf('/explore-knowledge')===0||href.indexOf('/knowledge')===0||href.indexOf('/guides')===0||href.indexOf('/articles')===0)return 'knowledge';
    if(href.indexOf('mailto:')===0||href.indexOf('tel:')===0||href.indexOf('/contact')===0)return 'contact';
    return href.charAt(0)==='/'?'internal_other':'external';
  }
  document.addEventListener('DOMContentLoaded',function(){
    push('shift_page_view',{shift_path:path(),shift_template:template(),shift_funnel_stage:stage()});
    push('shift_funnel_stage',{shift_path:path(),shift_template:template(),shift_funnel_stage:stage()});
    document.addEventListener('click',function(e){
      var el=e.target.closest&&e.target.closest('a,button'); if(!el)return;
      var href=el.getAttribute('href')||'';
      var id=el.id||el.getAttribute('data-panel')||el.getAttribute('data-shift-action')||'unlabelled_control';
      push('shift_action',{shift_path:path(),shift_template:template(),shift_action_id:id,shift_destination:destination(href)});
    },true);
    var toolForm=document.querySelector('form.toolbox');
    if(toolForm){
      toolForm.addEventListener('submit',function(){push('shift_tool_used',{shift_path:path(),shift_tool_id:toolForm.id||'tool',shift_funnel_stage:'utility_activation'});});
    }
  });
})();
