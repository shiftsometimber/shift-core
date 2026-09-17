import {continuityEntries,OLD_LIFE_LINK,NEW_LIFE_LINK} from './public-continuity.mjs';
export function preserveContinuityContent(path,input,{required=false}={}){
 const entry=continuityEntries[path];if(!entry)return input;
 let html=input.toString('utf8');
 if(!Buffer.from(html).equals(input))throw Error(path+' must be valid UTF-8');
 const count=html.split('data-continuity-entry=').length-1;
 if(!count){if(required)throw Error(path+' missing approved Continuity entry');return input}
 if(count!==1||!html.includes(entry))throw Error(path+' Continuity entry differs from exact release source');
 html=html.replace(entry,'');
 if(path==='/programme'){
  if(html.split(NEW_LIFE_LINK).length!==2)throw Error('Programme Life Back link differs from exact release source');
  html=html.replace(NEW_LIFE_LINK,OLD_LIFE_LINK);
 }
 return Buffer.from(html);
}
