const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function evidenceDate(value){
 const text=String(value||'');
 if(/^\d{4}-\d{2}$/.test(text)&&Number(text.slice(5))>=1&&Number(text.slice(5))<=12)return new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(text+'-01T00:00:00Z'));
 const day=text.slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)return '';
 return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T00:00:00Z'));
}
export function articleTrust(content,row){
 const seo=content.seo||{},published=seo.datePublished||row.reviewed_at||row.created_at,modified=seo.dateModified;
 const publication=evidenceDate(published),update=evidenceDate(modified);
 return '<div class="radar-news-meta" data-editorial-trust><p>By '+esc(seo.author||'SHIFT Newsroom')+(publication?' · Published '+esc(publication):'')+(update&&update!==publication?' · Updated '+esc(update):'')+'</p>'+(content.automatic_review?'<p>AI-prepared summary with an automated accuracy check. Source findings and SHIFT’s interpretation are distinct. For information, not personal medical advice.</p>':'')+'<p><a href="/editorial-standards#newsroom">How we prepare and check newsroom articles</a> · <a href="/editorial-standards#corrections">Report a correction</a></p></div>';
}
export function sourceDateLabel(source){const date=evidenceDate(source.source_date||source.source_published_at||source.published_at);return date?' <span class="radar-news-meta">— Source date: '+esc(date)+'</span>':' <span class="radar-news-meta">— Source date not recorded</span>'}
export function newsSitemapDates(rows){
 const dates=new Map();
 for(const row of rows){let content;try{content=typeof row.content_package_json==='string'?JSON.parse(row.content_package_json):row.content_package_json}catch{continue}
 const slug=String(content?.seo?.slug||'').replace(/^\/+|\/+$/g,'');
 if(!content?.destinations?.includes('medicine_news')||!/^medicine-news\/[a-z0-9][a-z0-9-]+$/.test(slug))continue;
 const value=String(content.seo.dateModified||row.updated_at||content.seo.datePublished||row.reviewed_at||row.created_at||'').slice(0,10);
 if(!dates.has('/'+slug))dates.set('/'+slug,evidenceDate(value)&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:null);
 }
 return dates;
}
export function setSitemapDate(xml,path,date){
 const loc='<loc>https://shiftsometimber.co.uk'+path+'</loc>';
 return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/g,entry=>entry.includes(loc)?entry.replace(/<lastmod>[\s\S]*?<\/lastmod>/g,'').replace('</url>',(date?'<lastmod>'+date+'</lastmod>':'')+'</url>'):entry);
}
