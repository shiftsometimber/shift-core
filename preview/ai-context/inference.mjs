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
 const result=await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast',input);
 return Response.json(result,{headers});
 }catch{return Response.json({error:'evaluation_generation_failed'},{status:502,headers})}
}};
