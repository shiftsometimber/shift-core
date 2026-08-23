import fs from 'node:fs';
let failed=false;const fail=m=>{console.error(m);failed=true};
const worker=fs.readFileSync('worker.js','utf8');
const recovery=fs.readFileSync('auth-recovery-v1.js','utf8');

for(const marker of ['HttpOnly','Secure','SameSite=Lax']) if(!worker.includes(marker)) fail(`Session cookie missing ${marker}`);
if(!worker.includes('failed_login_attempts')) fail('Login failure counter missing');
if(!worker.includes('attempts >= 8')) fail('Login lockout threshold missing');
if(!worker.includes('15 * 60 * 1000')) fail('Temporary lockout duration missing');
if(!worker.includes("UPDATE user_sessions SET revoked_at=?")) fail('Session revocation path missing');
if(!worker.includes("PBKDF2")||!worker.includes("iterations = 100000")) fail('Password hashing contract missing or changed without review');
if(!recovery.includes('RESET_TTL_MS=30*60*1000')) fail('Password reset expiry must remain explicit');
if(!recovery.includes('password.length<12')) fail('Password reset minimum length must be 12+ characters');
if(!recovery.includes("token_type='password_reset'")) fail('Password reset token type contract missing');
if(!recovery.includes("UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL")) fail('Reset must revoke active sessions');
if(!recovery.includes('constantTimeBytesEqual')) fail('Password verification must use constant-time byte comparison');

if(failed)process.exit(1);
console.log('Gate 1 auth security source contract passed.');
