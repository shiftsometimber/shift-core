import assert from 'node:assert/strict';
export const PASSPORT_HEAD='<link rel="stylesheet" href="/assets/member-experience/passport.css"><script defer data-health-passport-client src="/assets/member-experience/passport.js"></script>';
export function preservePassportHead(path,input,{required=false}={}){
 const body=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(path!=='/start-here')return body;
 const html=body.toString('utf8');assert.ok(Buffer.from(html).equals(body),'Start Here must be UTF-8');
 const count=html.split('data-health-passport-client').length-1;
 if(!count){assert.ok(!required,'Start Here is missing the activated Passport client');return body;}
 assert.equal(count,1,'Duplicate Passport entry');
 const start=html.indexOf(PASSPORT_HEAD),head=html.indexOf('<head'),end=html.indexOf('</head>');
 assert.ok(start>head&&head>=0&&end>start+PASSPORT_HEAD.length-1,'Passport entry differs from the exact approved head addition');
 return Buffer.from(html.replace(PASSPORT_HEAD,''));
}
