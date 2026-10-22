export const version='20261022-about-preview-v5-letter';
export const arrow='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function storyFrom(html){
 const article=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];if(!article)throw Error('Published story missing');
 const intro=article.match(/<p\b[^>]*class="[^"]*\bstandfirst\b[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1];
 const chapters=[...article.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/g)].map((m,i)=>({title:m[2],id:m[1].match(/\bid="([^"]*)"/)?.[1]||'about-chapter-'+String(i+1).padStart(2,'0'),body:m[3].replace(/<div class="actions">[\s\S]*?<\/div>/,'').trim()}));
 if(!intro||chapters.length!==7||!chapters[1].body.includes("I'm not convinced")||!chapters[1].body.includes('still occasionally'))throw Error('Published story structure changed');
 return{intro,chapters};
}
export function mainFor(html){
 storyFrom(html);
 const original=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)[1];
 const signoff='<div class="ab-signoff"><span class="ab-signature">Matt</span><p>Matt O’Brien<br><span>Founder, Shift Some Timber</span></p></div>';
 const story=original.replace('<div class="actions">',signoff+'<div class="actions">');
 return `<div class="ab-wrap"><div class="ab-letter"><div class="ab-letter-heading"><p class="ab-eyebrow">OUR STORY</p><h1>An open letter from Matt</h1><p class="ab-byline">Founder, Shift Some Timber</p></div><article class="ab-story">${story}</article></div></div>`;
}
