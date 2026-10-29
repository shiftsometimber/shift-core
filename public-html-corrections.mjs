const BLOODS_PATH='/shift-health/blood-tests';
const DOUBLE_ENCODED_TITLE='Explore Baseline, Advanced &amp;amp; Complete | SHIFT Bloods';
const HTML_TITLE='Explore Baseline, Advanced &amp; Complete | SHIFT Bloods';
const PLAIN_TITLE='Explore Baseline, Advanced & Complete | SHIFT Bloods';

function correctBloodsHtml(html){
 let corrected=String(html).split(DOUBLE_ENCODED_TITLE).join(HTML_TITLE);
 corrected=corrected.replace(
  /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
  (_,open,json,close)=>open+json.split(HTML_TITLE).join(PLAIN_TITLE)+close,
 );
 return corrected;
}

export async function withPublicHtmlCorrections(request,response){
 const url=new URL(request.url);
 if(request.method!=='GET'||url.hostname!=='shiftsometimber.co.uk'||url.pathname!==BLOODS_PATH||
    response.status!==200||!String(response.headers.get('Content-Type')||'').toLowerCase().includes('text/html'))return response;
 const before=await response.text(),after=correctBloodsHtml(before);
 if(after===before)return new Response(before,response);
 const headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('Cache-Control','no-store');
 headers.set('X-Shift-Public-Correction','bloods-title-20261029');
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}

