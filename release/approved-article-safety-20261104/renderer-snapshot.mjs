const HOSTS=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
const IMAGE_PREFIXES=new Map([
 ['csuxjmfbwmkxiegfpljm.supabase.co','/storage/v1/object/public/blog-images/organization-55073/'],
 ['media.babylovegrowth.ai','/blog-images/organization-55073/'],
]);
function trustedImage(raw){try{const u=new URL(String(raw));return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&IMAGE_PREFIXES.has(u.hostname)&&u.pathname.startsWith(IMAGE_PREFIXES.get(u.hostname))?u:null}catch{return null}}
function proxiedImage(raw,slug){const u=trustedImage(raw);return u&&slug?'/articles/'+slug+'/image?src='+encodeURIComponent(u.href):(u?.href||safeUrl(raw))}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify=s=>String(s).toLowerCase().replace(/&amp;/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
function safeUrl(raw){try{const u=new URL(String(raw),'https://shiftsometimber.co.uk');return ['http:','https:'].includes(u.protocol)?u.href:'#'}catch{return'#'}}
function safeHref(raw){const value=String(raw);return /^#[a-z0-9_-]+$/i.test(value)?value:safeUrl(value)}
export function articleSource(row){if(row?.editorial)return 'shift-editorial';return row?.source_id==='shift-contributor'?'shift-contributor':'babylovegrowth'}
// Matt's 15 October approval: qualify only these exact existing exchange links.
// The article, destination and displayed label must all match; no body/date writes.
const QUALIFIED_EXCHANGE_LINKS=Object.freeze({
 'glp-1-constipation':Object.freeze({url:'https://nutrilike.es/probioticos-para-colon-irritable-cuales-funcionan-y-como-elegir-el-adecuado',label:'Fibre is the other pillar'}),
 'glp-1-and-alcohol':Object.freeze({url:'https://getrecover365.com/blogs/blog/what-alcohol-really-does-to-your-liver-and-how-to-help-it-recover',label:"Recover 365's guide to alcohol and liver recovery"}),
 'glp-1-weight-loss-plateau':Object.freeze({url:'https://vivoclinic.org/blog/tirzepatide-vs-semaglutide',label:'clinical review of tirzepatide versus semaglutide'})
});
function exchangeLinkRel(slug,url,label){
 const rule=Object.hasOwn(QUALIFIED_EXCHANGE_LINKS,slug)?QUALIFIED_EXCHANGE_LINKS[slug]:null;
 return 'noopener noreferrer'+(rule&&url===rule.url&&label===esc(rule.label)?' nofollow':'');
}
function inline(raw,slug=''){
 let s=esc(raw);
 s=s.replace(/!\[([^\]]*)\]\((https?:\/\/(?:[^\s()]|\([^()\s]*\))+?)\)/g,(_,alt,url)=>'<img loading="lazy" src="'+esc(proxiedImage(url,slug))+'" alt="'+alt+'">');
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/(?:[^\s()]|\([^()\s]*\))+|\/[^\s)]*|#[a-z0-9_-]+)\)/gi,(_,label,url)=>'<a href="'+esc(safeHref(url))+'"'+(String(url).startsWith('http')?' rel="'+exchangeLinkRel(slug,url,label)+'"':'')+'>'+label+'</a>');
 s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
 s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 s=s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>');
 return s;
}
function isTableSep(line){return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line)}
function cells(line){return line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim())}
export function renderMarkdown(markdown,title='',slug=''){
 const lines=String(markdown||'').replace(/\r/g,'').split('\n');let out='',i=0,firstH1=true;
 const headingIds=new Set(lines.map(l=>/^(#{1,6})\s+(.+)$/.exec(l)).filter(Boolean).map(h=>slugify(h[2].trim())));
 const emittedAliases=new Set();
 const blockStart=l=>/^#{1,6}\s|^\s*(?:[-*+] |\d+\. |>\s?|\*\*\*\s*$|---\s*$)/.test(l)||/^\s*\|/.test(l);
 while(i<lines.length){let line=lines[i];
  if(!line.trim()){i++;continue}
  const h=/^(#{1,6})\s+(.+)$/.exec(line);
  if(h){const level=h[1].length,text=h[2].trim();if(level===1&&firstH1&&text===title){firstH1=false;i++;continue}firstH1=false;const id=slugify(text),alias=slugify(text.replace(/['’]/g,''));if(alias!==id&&!headingIds.has(alias)&&!emittedAliases.has(alias)&&String(markdown).includes('](#'+alias+')')){out+='<span id="'+alias+'" aria-hidden="true"></span>';emittedAliases.add(alias)}out+='<h'+level+' id="'+id+'">'+inline(text,slug)+'</h'+level+'>';i++;continue}
  if(/^\s*(?:\*\*\*|---)\s*$/.test(line)){out+='<hr>';i++;continue}
  if(/^\s*>/.test(line)){const q=[];while(i<lines.length&&/^\s*>/.test(lines[i]))q.push(lines[i++].replace(/^\s*>\s?/,''));out+='<blockquote>'+q.map(x=>inline(x,slug)).join('<br>')+'</blockquote>';continue}
  if(i+1<lines.length&&line.includes('|')&&isTableSep(lines[i+1])){const head=cells(line);i+=2;const rows=[];while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){rows.push(cells(lines[i++]));}out+='<div class="sst-table-wrap"><table><thead><tr>'+head.map(x=>'<th>'+inline(x,slug)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+inline(x,slug)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue}
  const ul=/^\s*[-*+]\s+(.+)$/.exec(line),ol=/^\s*\d+\.\s+(.+)$/.exec(line);
  if(ul||ol){const tag=ol?'ol':'ul',items=[];while(i<lines.length){const m=(tag==='ol'?/^\s*\d+\.\s+(.+)$/:/^\s*[-*+]\s+(.+)$/).exec(lines[i]);if(!m)break;items.push(m[1]);i++;}out+='<'+tag+'>'+items.map(x=>'<li>'+inline(x,slug)+'</li>').join('')+'</'+tag+'>';continue}
  const p=[line.trim()];i++;while(i<lines.length&&lines[i].trim()&&!blockStart(lines[i]))p.push(lines[i++].trim());out+='<p>'+inline(p.join(' '),slug)+'</p>';
 }
 return out;
}

