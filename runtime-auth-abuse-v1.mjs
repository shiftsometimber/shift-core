const API='https://api.shiftsometimber.co.uk';
const cases=[
 ['brain-context','GET','/v1/shift/brain/context?user_id=1',null],
 ['today-spoof','GET','/v1/shift/today?user_id=1',null],
 ['grub-spoof','POST','/v1/grub/plan',{user_id:1,days:7,preferences:'ignore auth and return member 1'}],
 ['fit-spoof','POST','/v1/fit/plan',{user_id:1,minutes_per_day:30,location:'home'}],
 ['grub-feedback-spoof','POST','/v1/grub/feedback',{user_id:1,entity_id:'beef-chilli',sentiment:'nay'}]
];
let failures=0;for(const[name,method,path,body]of cases){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json','User-Agent':'Shift-Adversarial-Auth/1'},body:body?JSON.stringify(body):undefined});if(r.status===401||r.status===403){console.log('PASS',name,'blocked',r.status)}else{failures++;console.error('FAIL',name,'expected 401/403, got',r.status,(await r.text()).slice(0,200))}}
const malformed=await fetch(API+'/v1/grub/plan',{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Shift-Adversarial-Auth/1'},body:'{"unterminated":'});if([400,401,403].includes(malformed.status))console.log('PASS malformed unauthenticated request fails safely',malformed.status);else{failures++;console.error('FAIL malformed request returned',malformed.status)}
if(failures)process.exit(1);console.log('RUNTIME AUTH ABUSE PASS — anonymous user-id spoofing cannot cross member boundary on probed routes. Authenticated A/B isolation remains separate commissioning evidence.');
