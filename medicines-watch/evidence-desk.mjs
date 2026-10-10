// Public factual-review work, separate from prescribing or clinical approval.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v&&Number.isFinite(Date.parse(v))?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'}).format(new Date(v)):'Not recorded';
const interval=7*24*60*60*1000;
export function matchesSearch(entry,q){
 const terms=String(q||'').slice(0,100).trim().toLowerCase().split(/\s+/).filter(Boolean);
 // Search reviewed content; a match is not evidence of clinical suitability.
 const text=[entry.name,entry.developer,entry.ingredient,entry.mechanism,entry.route,entry.stage,entry.summary,entry.benefit,entry.authorisation,entry.ukAuthorisation,entry.nhsEngland,entry.supply,entry.limitations,...entry.tradeoffs||[],...(entry.evidenceLinks||entry.additionalEvidence||[]).map(l=>l.title)].join(' ').toLowerCase();
 return terms.every(term=>text.includes(term));
}
export function evidenceQueue(sources,health={},now=Date.now()){
 const observed=new Map((health.available===false?[]:health.sources||[]).map(s=>[s.id,s]));
 return sources.map(s=>{
  const h=observed.get(s.id),reasons=new Set(h?.reasons||[]),age=now-Date.parse(s.reviewedAt);
  if(!Number.isFinite(age)||age<0||age>interval)reasons.add('review_due');
  const review=reasons.has('review_due')||reasons.has('source_changed')||reasons.has('source_withdrawn')||h?.reviewStatus==='awaiting_review'||h?.status==='awaiting_review';
  const delayed=h?.checkStatus==='check_delayed'||h?.status==='check_delayed';
  const pending=!h||h.reviewStatus==='verification_pending'||h.status==='verification_pending'||!s.reviewedFingerprint;
  return {source:s,observation:h,review,delayed,pending,reasons:[...reasons]};
 }).filter(s=>s.review||s.delayed||s.pending);
}
export function manualEvidence(entries,sources){
 const configured=new Set(sources.map(s=>s.url)),links=new Map();
 for(const e of entries)for(const l of [...e.evidenceLinks||[],...e.additionalEvidence||[]])if(!configured.has(l.url)){
  const item=links.get(l.url)||{...l,programmes:[]};item.programmes.push(e.name);links.set(l.url,item);
 }
 return [...links.values()];
}
export function evidenceDeskMarkup(sources,entries,health={},now=Date.now()){
 const queue=evidenceQueue(sources,health,now),manual=manualEvidence(entries,sources);
 const row=q=>`<li><a href="${esc(q.source.url)}" rel="noopener noreferrer">${esc(q.source.title||q.source.id)}</a><small>${q.reasons.includes('source_withdrawn')?'Withdrawal notice detected. ':''}${q.reasons.includes('source_changed')?'Content changed. ':''}${q.reasons.includes('review_due')?'Factual review due. ':''}${q.delayed?'Source check delayed. ':''}${q.pending?'Verification pending. ':''}Reviewed ${date(q.source.reviewedAt)} · Last attempt ${date(q.observation?.lastAttemptAt)}${q.observation?.error?' · Check outcome: '+esc(q.observation.error):''}</small><small>Next action: ${q.review?'read the primary evidence and review affected wording.':'retry the source check; retain the dated summary and uncertainty.'}${q.delayed&&q.review?' A source retry is also needed.':''}</small></li>`;
 const group=(label,list)=>`<details class="mw-evidence"><summary>${label} (${list.length})</summary>${list.length?'<ul>'+list.map(row).join('')+'</ul>':'<p>No items in this queue.</p>'}</details>`;
 return `<section id="watch-evidence-desk" class="mw-overview"><h2>Evidence needs attention</h2><p>Changed evidence, overdue factual reviews and retrieval failures are different jobs. A delayed check does not establish a medical risk; an unchanged check does not approve medical advice.</p>${health.available===false?'<p class="mw-flag">The monitor is unavailable. Current source status cannot be confirmed.</p>':''}${group('Factual review needed',queue.filter(q=>q.review))}${group('Checks delayed',queue.filter(q=>q.delayed))}${group('Verification pending',queue.filter(q=>q.pending))}<p class="mw-note">Queues can overlap when a source needs both a check and a factual review. They cover configured sources only.</p></section><section id="watch-coverage-gaps" class="mw-overview"><h2>What automatic checks can miss</h2><p>${manual.length} additional evidence URLs are outside automatic content monitoring. They keep their dated factual reviews and need manual follow-up. Selected developers and search domains do not define the whole industry; an absent programme is not proof that it does not exist.</p><details class="mw-evidence"><summary>See evidence requiring manual follow-up</summary><ul>${manual.map(l=>`<li><a href="${esc(l.url)}" rel="noopener noreferrer">${esc(l.title)}</a><small>${esc([...new Set(l.programmes)].join(', '))} · Reviewed ${date(l.reviewedAt)} · Publication ${date(l.sourcePublishedAt)} · Update ${date(l.sourceUpdatedAt)}</small></li>`).join('')}</ul></details><p class="mw-note">Trial status monitoring covers the submitted record, not the truth of every claim or the assessment of study outcomes. Safety coverage and UK access coverage are also selected, not complete.</p></section>`;
}
