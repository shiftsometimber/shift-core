import {uid} from './store.mjs';import {canExecute} from './permissions.mjs';
export function calendarPreview(state,actionId,start){const a=state.actions.find(a=>a.id===actionId&&a.status==='accepted');if(!a||!canExecute(state,a)||!state.permissions.calendar||typeof start!=='string'||!Number.isFinite(Date.parse(start)))throw Object.assign(Error('calendar_preview_unavailable'),{status:409});return{actionId:a.id,title:a.title,start,minutes:a.minutes,created:false,transport:'synthetic'};}
export function calendarAccept(state,actionId,start,explicitTap){
 if(explicitTap!==true)throw Object.assign(Error('explicit_tap_required'),{status:400});const p=calendarPreview(state,actionId,start);
 const existing=state.calendar.find(c=>c.actionId===actionId&&c.start===start&&!c.undone);if(existing)return{event:existing,dataUsed:existing.dataUsed};
 const a=state.actions.find(a=>a.id===actionId),c={id:uid(),actionId,start,title:p.title,createdBy:'shift-ai',dataUsed:a.dataUsed,sources:['calendar'],synthetic:true,undone:false};state.calendar.push(c);return{event:c,dataUsed:a.dataUsed};
}
export function undoCalendar(state,id){const c=state.calendar.find(c=>c.id===id&&c.createdBy==='shift-ai');if(!c)throw Object.assign(Error('owned_event_required'),{status:404});c.undone=true;return{dataUsed:[]};}
