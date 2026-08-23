import {handleAuthRecovery} from './auth-recovery-v1.js';

const sent=[];
const env={
  EMAIL:{async send(message){sent.push(message);return{id:`mail-${sent.length}`}}},
  DB:{prepare(){throw new Error('welcome delivery must not be recorded before verification')}}
};

const request=new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({email:'verify-required@example.com',firstName:'Dave'})
});
const next=async()=>new Response(JSON.stringify({
  ok:true,
  user:{id:1,email:'verify-required@example.com',firstName:'Dave'},
  emailVerified:false
}),{status:201,headers:{'Content-Type':'application/json'}});

const response=await handleAuthRecovery(request,env,{},next);
if(response.status!==201)throw new Error(`registration response changed: ${response.status}`);
if(sent.length!==0)throw new Error('Welcome must not be sent before verification');

console.log('Auth recovery registration gate passed: verification-required registration emits no premature Welcome.');
