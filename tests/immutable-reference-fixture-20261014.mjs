export function createImmutableFixtureRead(exec,{cwd=()=>process.cwd()}={}){
 const facts=new Map();return(ref,path)=>{
  const run=()=>exec('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
  if(!/^[a-f0-9]{40}$/.test(ref))return run();
  const key=JSON.stringify([cwd(),ref,path]);if(!facts.has(key))facts.set(key,run());return facts.get(key);
 };
}
