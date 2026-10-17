import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
export const knownAutomaticGzipBodies={"/assets/v137-estate-closeout.css?v=footer-wire-20260911b": {"sha256": "a0e9927ac92becaf57f2c787985c78c5d4acea3b3b54c4a1c78b5f479358346f", "bytes": 8288, "type": "text/css; charset=utf-8"}, "/assets/member-shell-v6.css?v=canonical-20260909": {"sha256": "adbfc632e2bdd87aa173f56031e09bb1c61d3b47fe7e42505a1c9b12fc038e9f", "bytes": 1213, "type": "text/css; charset=utf-8"}, "/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2": {"sha256": "3edc9ac6a663ef3bd16bd7bc13215275dd8c86c46f2f550d3aac4cf0c500d632", "bytes": 219158, "type": "text/css; charset=utf-8"}, "/assets/header-navigation-v2.css": {"sha256": "fede0fcbc334af6c4183765006c2fde71909ed5e3bd0db365f77a8e21e2fefc4", "bytes": 4803, "type": "text/css; charset=utf-8"}, "/assets/member-login-security-20260912.js": {"sha256": "ab4c12202142282824fbf1e453254cc35a51892a07fd51fd844c4ab27d6d4532", "bytes": 4978, "type": "application/javascript"}, "/assets/ask-timber-sync-v1.js?v=3": {"sha256": "cb1434cc5fd0ea7b00aeea67767097ad1ed6c2ec6b29ac65a8c5f1681ad37e19", "bytes": 4000, "type": "application/javascript"}, "/assets/member-shell-v6.js?v=canonical-20260909": {"sha256": "6e3a6c3d6d136bb2369ad132d90747cc85056804dba4e9355da7ced2a5375dd2", "bytes": 462, "type": "application/javascript"}};

const sha=body=>createHash('sha256').update(body).digest('hex');
export function proofHTTPBody({path,body,headers,transport='gzip',acceptEncoding='gzip'}){
 const raw=Buffer.from(body),h={...headers};let decoded=raw,mode='identity',wire=raw;
 const encoding=(h['content-encoding']||'').trim().toLowerCase();
 if(encoding&&encoding!=='gzip'&&encoding!=='identity')throw Error('Unexpected proof transport encoding: '+encoding);
 if(encoding==='gzip'){
  if(raw[0]===31&&raw[1]===139){decoded=gunzipSync(raw);mode='manual-gzip'}
  else{
   const expected=knownAutomaticGzipBodies[path];
   if(!expected||expected.type!==h['content-type']||expected.bytes!==raw.length||expected.sha256!==sha(raw))throw Error('Unknown or altered automatic Worker body: '+path);
   wire=gzipSync(raw);mode='verified-worker-automatic-gzip';
  }
 }else if(transport==='gzip'&&acceptEncoding.includes('gzip')&&/text\/|application\/(?:json|javascript)/.test(h['content-type']||'')){
  wire=gzipSync(raw);h['content-encoding']='gzip';mode='proof-gzip';
 }
 h['content-length']=String(wire.length);
 return {body:wire,headers:h,evidence:{mode,decodedBytes:decoded.length,wireBytes:wire.length,decodedSha256:sha(decoded),wireSha256:sha(wire)}};
}
