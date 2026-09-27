// Temporary synthetic evaluation only: no D1, member data, assets or site routes.
export default {async fetch(request,env){
 const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
 if(!env.EVAL_KEY||request.headers.get('Authorization')!==`Bearer ${env.EVAL_KEY}`)return new Response('Unauthorised',{status:401,headers});
 if(!env.EXPIRES_AT||Date.now()>Number(env.EXPIRES_AT))return new Response('Expired',{status:410,headers});
 if(request.method==='GET'&&new URL(request.url).pathname==='/health')return Response.json({ready:true},{headers});
 if(request.method!=='POST'||new URL(request.url).pathname!=='/run')return new Response('Not found',{status:404,headers});
 const text=await request.text();if(text.length>60000)return new Response('Too large',{status:413,headers});
 try{
 const input=JSON.parse(text);input.max_tokens=Math.min(900,Number(input.max_tokens)||900);
 const model=['@cf/meta/llama-3.3-70b-instruct-fp8-fast','@cf/meta/llama-3.1-8b-instruct'].includes(input.benchmarkModel)?input.benchmarkModel:'@cf/meta/llama-3.3-70b-instruct-fp8-fast';
 const stream=input.benchmarkStream===true;delete input.benchmarkModel;delete input.benchmarkStream;
 if(stream){delete input.response_format;input.stream=true;input.messages=input.messages.map(m=>({...m,content:m.content.replace(/Return valid JSON only\./g,'Return only the answer as natural prose.').replace(/Return the required JSON\./g,'Return only the answer as natural prose.')}));input.messages.push({role:'user',content:'For this benchmark return the answer as plain text only, not JSON. Preserve all evidence, privacy and safety rules.'});}
 const result=await env.AI.run(model,input);
 if(stream)return new Response(result,{headers:{...headers,'Content-Type':'text/event-stream'}});
 return Response.json(result,{headers});
 }catch{return Response.json({error:'evaluation_generation_failed'},{status:502,headers})}
}};
