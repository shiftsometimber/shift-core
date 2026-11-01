const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const tags=/<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'))?.slice(1).find(v=>v!==undefined);
export function bounds(source,predicate){
 const re=new RegExp(tags.source,'gi');let m;
 while((m=re.exec(source))){
  if(m[0].startsWith('</'))continue;
  if(['script','style'].includes(m[1].toLowerCase())){const at=source.toLowerCase().indexOf('</'+m[1].toLowerCase(),re.lastIndex);if(at>=0)re.lastIndex=source.indexOf('>',at)+1;continue;}
  if(!predicate(m[0],m[1].toLowerCase()))continue;
  const start=m.index,openEnd=re.lastIndex,tag=m[1].toLowerCase();
  if(voids.has(tag)||m[0].endsWith('/>'))return {start,end:openEnd,openEnd,closeStart:openEnd,html:source.slice(start,openEnd)};
  let depth=1,n;
  while((n=re.exec(source))){
   const name=n[1].toLowerCase();
   if(['script','style'].includes(name)&&!n[0].startsWith('</')){const at=source.toLowerCase().indexOf('</'+name,re.lastIndex);if(at>=0)re.lastIndex=source.indexOf('>',at)+1;continue;}
   if(name===tag){depth+=n[0].startsWith('</')?-1:n[0].endsWith('/>')?0:1;if(!depth)return {start,end:re.lastIndex,openEnd,closeStart:n.index,html:source.slice(start,re.lastIndex)};}
  }
  throw Error('Unclosed presentation boundary '+tag);
 }
 return null;
}
export const byClass=(s,c)=>bounds(s,t=>(attr(t,'class')||'').split(/\s+/).includes(c));
export const byId=(s,id)=>bounds(s,t=>attr(t,'id')===id);
export const mainHTML=s=>bounds(s,(_t,n)=>n==='main')?.html;
export const withoutTicker=s=>{const ticker=byId(s,'shift-public-news');return ticker?s.slice(0,ticker.start)+s.slice(ticker.end):s;};
