const html=String.raw`<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Request account deletion | SHIFT Some Timber</title>
<meta name="robots" content="noindex,follow"><meta name="theme-color" content="#050505">
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#050505;color:#e7e3da;font-family:Arial,sans-serif;line-height:1.55}
main{max-width:760px;margin:auto;padding:48px 22px 72px}a{color:#e7e3da}h1{font-size:clamp(34px,8vw,60px);line-height:1;margin:18px 0 24px}
.eyebrow{color:#707762;font-weight:800;letter-spacing:.12em}.card{border:1px solid #707762;border-radius:18px;padding:24px;margin:28px 0}
.button{display:inline-block;background:#e7e3da;color:#050505;padding:14px 18px;border-radius:9px;font-weight:800;text-decoration:none}
small{color:#b9b7ae}
</style></head><body><main>
<p class="eyebrow">MY TIMBER · PRIVACY</p><h1>Request account deletion</h1>
<p>If you have a My Timber account, you can ask SHIFT Some Timber to delete your account and personal data.</p>
<div class="card"><h2>Fastest route</h2><p>Sign in to My Timber, open <strong>Settings</strong>, then choose <strong>Request account deletion</strong>. The authenticated request signs you out of your current sessions and sends the request to SHIFT for review.</p>
<p><a class="button" href="/member-login?returnTo=%2Fmember%2Fsettings">Sign in to My Timber</a></p></div>
<h2>Can't sign in?</h2><p>Email <a href="mailto:privacy@shiftsometimber.co.uk?subject=My%20Timber%20account%20deletion%20request">privacy@shiftsometimber.co.uk</a> from the email address associated with your account. We may need to verify your identity before acting on the request.</p>
<h2>What happens next?</h2><p>A deletion request is reviewed rather than blindly erasing every record immediately. We will delete data that should be erased and tell you if particular records must be retained for a lawful reason. Requesting deletion does not cancel or alter legal record-retention duties that may apply to orders, payments or regulated healthcare records held by the relevant provider.</p>
<p><small>This page provides the public deletion-request route for My Timber. It does not expose member data and does not submit a request unless you use the authenticated Settings control or contact SHIFT.</small></p>
<p><a href="/">Back to SHIFT Some Timber</a></p>
</main></body></html>`;
export function accountDeletionPublicRoute(request){
 const u=new URL(request.url),path=u.pathname.replace(/\/+$/,'')||'/';
 if(path!=='/account-deletion'||!['GET','HEAD'].includes(request.method))return null;
 const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Robots-Tag':'noindex, follow'};
 return new Response(request.method==='HEAD'?null:html,{status:200,headers});
}
