const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const title=s=>s.split(' ').map(w=>({nhs:'NHS',uk:'UK',esg:'ESG',mounjaro:'Mounjaro',wegovy:'Wegovy',ozempic:'Ozempic',saxenda:'Saxenda',orlistat:'Orlistat'}[w]||w[0]?.toUpperCase()+w.slice(1))).join(' ');
const clean=s=>s.replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replace(/\s+/g,' ').trim();
export function graphic(page,meta){
 const names=page.path.split('/').at(-1).split('-vs-').map(s=>s.replaceAll('-',' '));
 if(page.kind==='comparison'&&names.length===2)return '<div class="qr-graphic rest-art" data-rp-decoration aria-hidden="true"><p class="qr-micro">Compare the whole picture.</p><div class="rest-pair">'+names.map((n,i)=>'<div><span>0'+(i+1)+'</span><strong>'+esc(title(n))+'</strong></div>').join('')+'</div><div class="sg-dimensions"><span>Evidence</span><span>Trade-offs</span><span>Follow-up</span></div><p>Prepare your questions.</p></div>';
 const heads=(meta.headings||[]).filter(s=>!/^Sources|About this content|Want support|What Shift|Related|Further reading/i.test(s)).slice(0,3);
 return '<div class="qr-graphic rest-art" data-rp-decoration aria-hidden="true"><p class="qr-micro">'+(page.path.startsWith('/comparisons/europe/')?'Before you commit.':'A clearer next step.')+'</p><div class="rest-rows">'+heads.map((h,i)=>'<div><span>0'+(i+1)+'</span><strong>'+esc(h)+'</strong></div>').join('')+'</div><p>Read the detail. Keep the context.</p></div>';
}
