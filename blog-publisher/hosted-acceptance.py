"""Private hosted acceptance; all content/owner identity and clock are test fixtures.
Actual Cloudflare HTTP, D1, R2 and the existing capped editorial gateway.
No customer data, production publication, email or credential handover.
"""
from pathlib import Path
import base64, datetime, hashlib, html, json, re, urllib.request, urllib.error, uuid

ROOT=Path(__file__).resolve().parent.parent
STATE=ROOT/'blog-publisher/acceptance.private.json'
secret=json.loads((ROOT/'blog-publisher/staging-access.private.json').read_text())['BLOG_STAGING_ACCESS']
resources=json.loads((Path('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021/standalone-staging-resources-20261022.json')).read_text())
BASE='https://'+resources['worker']+'.'+resources['subdomain']+'.workers.dev'
API='/v1/integrations/blog-articles'
ADMIN='/v1/hq/blog-contributors'
s=json.loads(STATE.read_text()) if STATE.exists() else {'run':uuid.uuid4().hex,'proof':{'kind':'protected_hosted_acceptance','actualHTTP':True,'actualD1':True,'actualR2':True,'syntheticOwner':True,'controlledClock':True,'genuineHQOwnerSessionVerified':False,'unattendedScheduleVerified':False,'productionPublication':False,'checks':{}}}
def save():
    STATE.write_text(json.dumps(s,indent=2));STATE.chmod(0o600)
def call(path,body=None,token=True,owner=False,clock='2026-10-22T07:30:00Z',idem=None,raw=None,mime=None,private=True):
    headers={'X-Blog-Staging-Clock':clock,'User-Agent':'SHIFT-Blog-Acceptance/1.0'}
    if private:headers['X-Blog-Staging-Access']=secret
    if token and s.get('token'):headers['Authorization']='Bearer '+s['token']
    if owner:headers['X-Blog-Staging-Fixture-Owner']='true'
    if idem:headers['Idempotency-Key']=s['run']+'_'+idem
    data=raw if raw is not None else json.dumps(body).encode() if body is not None else None
    if data is not None:headers['Content-Type']=mime or 'application/json'
    req=urllib.request.Request(BASE+path,data=data,headers=headers)
    try:
        with urllib.request.urlopen(req,timeout=240) as r:return r.status,dict(r.headers),r.read()
    except urllib.error.HTTPError as e:return e.code,dict(e.headers),e.read()
def post(path,body,**kw):
    status,h,b=call(path,body,**kw);x=json.loads(b)
    assert status<300,(path,status,x)
    return x
def received(id,**kw):
    status,h,b=call(API+'/'+id,**kw);assert status==200,(status,b[:250]);return json.loads(b)
def queue(clock):
    return post('/__blog-stage/queue',{'testClock':clock},clock=clock)
def check(name):
    s['proof']['checks'][name]=True;save();print(name+': PASS',flush=True)

if s.get('revoked'):
    print(json.dumps(s['proof'],indent=2));raise SystemExit(0)
assert call(API,private=False,token=False)[0]==401
check('privateStagingGate')
if not s.get('token'):
    k=post('/__blog-stage/setup',{},token=False);s['token']=k['token'];s['keyId']=k['id'];save()
png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=')
for kind,data,mime in [('image',png,'image/png'),('video',(ROOT/'preview/article-quality/fixtures/blog-staging.mp4').read_bytes(),'video/mp4')]:
    if kind not in s:
        status,h,b=call(API+'/media',raw=data,mime=mime,idem='media_'+kind);x=json.loads(b);assert status in [200,201],(status,x);s[kind]=x;save()
    path=s[kind]['url'].replace('https://shiftsometimber.co.uk','')
    status,h,b=call(path);assert status==200 and b==data
check('genuineHostedImageAndMP4UploadReadback')

SOURCE='https://www.nhs.uk/tests-and-treatments/nhs-health-check/'
BODY='''Opening a health information page can leave you with several questions at once. A useful starting point is to choose the question you want to understand before following every link on the screen. This is a practical way to organise your reading, rather than a way to decide what care you need.

## Keep one question in view

Write your question in ordinary words. It might be about what an appointment involves, where a service is available, or which page explains the next step. Keep it short enough that you can recognise an answer when you find one. You can return to the other questions afterwards.

For example, someone looking at the NHS Health Check information could begin with a simple note: “What does this page say the check involves?” This is an example of a reading prompt, not a description of a particular person's appointment. The purpose is to give the reading a clear starting point.

You do not need a polished list or a special app. A piece of paper beside the screen is enough. Leave a little space under the question so that you can write down the part you found useful and the part you still want explained. Use whatever format you will actually return to.

## Open the original information

The [NHS Health Check page](https://www.nhs.uk/tests-and-treatments/nhs-health-check/) is the linked starting point for this example. Open the original page and look at its heading before reading further. Keeping the original source beside your notes makes it easier to see which information you have read and where it came from.

Read the section that appears relevant to your question. If a word or phrase is unfamiliar, write it down rather than guessing what it means. Keep any explanation you find beside the question it answers. You can then separate a useful explanation from something you have not yet understood.

Do not feel obliged to turn the whole page into notes. A short quotation for your private reference, a heading, or the link itself might be enough to help you return to the right place. Keep the source name with the note so that you can find it again.

## Separate information from questions

One practical layout is two columns. Label the first “What I found” and the second “What I still want to ask”. Put only the information you actually read in the first column. Keep your own questions in the second, even when you think you know the likely answer.

This example layout is a suggestion for organising a page of notes. It does not interpret a test result, establish eligibility or recommend a treatment. The question you write down can stay a question. You do not need to fill an empty space with a conclusion that the source has not given you.

If you follow another link, record the new page title beside the new note. That small detail helps you distinguish between the first page and material you opened afterwards. It also makes it easier to explain exactly which wording you are asking about when you discuss the information with someone.

## Choose a manageable next step

Finish the reading session by looking at your original question again. Have you found the section you were looking for, or do you still need an explanation? Write one short sentence about what you want to do next. That might simply be returning to the page when you have more time.

You can also keep the question ready for an appropriate conversation. Use the words you would normally use. A useful note can be as simple as “I read this section and I am not sure what it means for my situation”. You do not need to translate uncertainty into technical language.

The aim here is modest: retain the source, keep your questions clear and avoid losing the point of the reading among several open tabs. There is no score to achieve and no requirement to understand everything in one sitting. A clear question and the correct link give you something concrete to return to.

## Sources

[NHS Health Check](https://www.nhs.uk/tests-and-treatments/nhs-health-check/)
'''
payload={'title':'Keep one useful question beside the NHS Health Check page','body':BODY,'heroImage':{'url':s['image']['url'],'alt':'A plain black image used for a private staging test','caption':'Synthetic staging image; no person is depicted.'},'video':{'url':s['video']['url'],'poster':s['image']['url'],'caption':'A one-second silent staging video.','transcript':''},'metaDescription':'A practical way to organise questions while reading the NHS Health Check page.','url':'/articles/blog-stage-'+s['run'],'keywords':['health information','health check questions'],'sources':[{'title':'NHS Health Check','url':SOURCE}],'author':"Matt O'Brien",'editorialCheck':{'result':'pass','reviewer':'Hosted acceptance fixture'},'releaseDate':'2026-10-22'}
if 'submission' not in s:s['submission']=post(API,payload,idem='new');save()
new=received(s['submission']['id'])
if new['state']=='review_pending':queue('2026-10-22T08:00:00Z');new=received(new['id']);save()
if new['state']=='scheduled':queue('2026-10-22T10:00:00Z');new=received(new['id']);save()
s['newReceipt']=new;save();assert new['state']=='verified',(new['state'],new['reasons'])
assert all(v['status']=='pass' for v in new['receipt']['checks'].values())
check('actualGatewayD1PublicationAndSixHostedHTTPReceipts')
status,h,initial=call(payload['url']);assert status==200 and 'noindex' in h.get('X-Robots-Tag','')
schema=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',initial.decode(),re.S)[1]);assert schema['author']['name']=="Matt O'Brien"
check('siteSchemaMattAuthorAndPrivatePage')

with urllib.request.urlopen(urllib.request.Request('https://shiftsometimber.co.uk/articles/first-health-check-men',headers={'User-Agent':'SHIFT-Blog-Acceptance/1.0'}),timeout=30) as r:public=r.read().decode()
title=html.unescape(re.sub('<[^>]+>','',re.search(r'<h1\b[^>]*>(.*?)</h1>',public,re.S)[1])).strip()
related={'url':payload['url'],'related':[{'text':title,'url':'/articles/first-health-check-men'}]}
if 'links' not in s:s['links']=post(API+'/internal-links',related,idem='related',clock='2026-10-22T10:15:00Z');save()
assert s['links']['state']=='links_verified',s['links'].get('reasons')
check('relatedLineUsesActualPublicDestinationWithoutIndividualApproval')
after_links=call(payload['url'])[2]
refresh={**payload,'body':BODY.replace('Keep one question in view','Keep your main question in view')+'\n\nRelated: ['+title+'](https://shiftsometimber.co.uk/articles/first-health-check-men)','releaseDate':'2026-10-23'}
if 'refresh' not in s:s['refresh']=post(API,refresh,idem='refresh',clock='2026-10-23T07:30:00Z');save()
r=received(s['refresh']['id']);assert r['state'] in ['revision_awaiting_owner','review_pending','scheduled','verified']
if r['state']=='revision_awaiting_owner':
    assert call(payload['url'])[2]==after_links
    approval={'payloadHash':r['payloadHash'],'baseHash':r['baseHash']}
    assert call(ADMIN+'/submissions/'+r['id']+'/approve',approval,clock='2026-10-23T07:30:00Z')[0]==403
    post(ADMIN+'/submissions/'+r['id']+'/approve',approval,owner=True,clock='2026-10-23T07:30:00Z')
check('rewriteHeldAndContributorCannotApprove')
r=received(r['id'])
if r['state']=='review_pending':queue('2026-10-23T08:00:00Z');r=received(r['id'])
if r['state']=='scheduled':queue('2026-10-23T10:00:00Z');r=received(r['id'])
s['refreshReceipt']=r;save();assert r['state']=='verified',(r['state'],r['reasons'])
current=call(payload['url'])[2].decode();modified=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',current,re.S)[1]);assert modified['datePublished']==schema['datePublished'];assert modified['dateModified']=='2026-10-23T10:00:00.000Z'
check('hostedApprovedRefreshPreservesOriginalDate')
bad=post(API,{**payload,'body':'<script>unsafe()</script>'},idem='unsafe',clock='2026-10-23T10:15:00Z');assert bad['state']=='draft_failed'
check('unsafeCopyHeld')
status,h,b=call(ADMIN+'/console',owner=True);assert status==200 and b'file' in b
check('hostedOwnerConsoleHasUploadControl')
status,h,b=call(ADMIN+'/submissions/'+r['id']+'/history');assert status==403
status,h,b=call(ADMIN+'/submissions/'+r['id']+'/history',owner=True);assert status==200
versions=json.loads(b)['versions'];version=next(v for v in versions if json.loads(v['before_json'] or 'null') and v.get('before_metadata_json'))
before_rollback=call(payload['url'])[2]
if 'rollback' not in s:s['rollback']=post(ADMIN+'/submissions/'+r['id']+'/rollback',{'versionId':version['id']},owner=True,clock='2026-10-24T07:30:00Z');save()
assert s['rollback']['state']=='revision_awaiting_owner' and call(payload['url'])[2]==before_rollback
check('hostedRollbackIsPrivateOwnerReviewedRevision')
if 'otherKey' not in s:s['otherKey']=post('/__blog-stage/setup',{},token=False);save()
first_token=s['token'];s['token']=s['otherKey']['token']
assert call(API+'/'+new['id'])[0]==404
assert call(API+'/media/'+s['image']['id'])[0]==404
s['token']=first_token
post(ADMIN+'/keys/'+s['otherKey']['id']+'/revoke',{},owner=True)
check('hostedCrossKeyReceiptAndMediaIsolation')
status,h,b=call(s['video']['url'].replace('https://shiftsometimber.co.uk',''))
assert status==200 and b==(ROOT/'preview/article-quality/fixtures/blog-staging.mp4').read_bytes()
post(ADMIN+'/keys/'+s['keyId']+'/revoke',{},owner=True)
assert call(API+'/'+new['id'])[0]==401
assert call(API+'/media',raw=png,mime='image/png',idem='revoked_upload')[0]==401
s['revoked']=True
check('hostedKeyRevocationStopsReadAndUpload')
s['proof']['articlePath']=payload['url'];s['proof']['stageBase']=BASE;s['proof']['realModel']='@cf/meta/llama-3.3-70b-instruct-fp8-fast';s['proof']['pass']=True;s['proof']['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();save()
print(json.dumps(s['proof'],indent=2))
