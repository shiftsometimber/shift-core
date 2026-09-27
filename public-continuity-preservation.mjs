import {continuityEntries,OLD_LIFE_LINK,NEW_LIFE_LINK} from './public-continuity.mjs';
export function preserveContinuityContent(path,input,{required=false}={}){
 const entry=continuityEntries[path];if(!entry)return input;
 let html=input.toString('utf8');
 if(!Buffer.from(html).equals(input))throw Error(path+' must be valid UTF-8');
 const count=html.split('data-continuity-entry=').length-1;
 if(!count){if(required)throw Error(path+' missing approved Continuity entry');return input}
 if(count!==1)throw Error(path+' Continuity entry count differs from exact release source');
 const id=entry.match(/<!-- SHIFT_CONTINUITY_(.+?)_START -->/)?.[1]||'';
 const start='<!-- SHIFT_CONTINUITY_'+id+'_START -->';
 const end='<!-- SHIFT_CONTINUITY_'+id+'_END -->';
 const a=html.indexOf(start),b=html.indexOf(end,a);
 if(a<0||b<a)throw Error(path+' Continuity entry markers differ from exact release source');
 const actual=html.slice(a,b+end.length);
 // The production baseline may contain the immediately previous approved entry.
 // Strip exactly one marker-bounded Continuity block for preservation comparison;
 // all surrounding bytes and the Programme Life Back link remain locked.
 html=html.replace(actual,'');
 html=html.replace(entry,'');
 if(path==='/programme'){
  if(html.split(NEW_LIFE_LINK).length!==2)throw Error('Programme Life Back link differs from exact release source');
  html=html.replace(NEW_LIFE_LINK,OLD_LIFE_LINK);
 }
 return Buffer.from(html);
}
