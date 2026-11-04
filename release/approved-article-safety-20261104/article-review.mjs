// Narrow editorial tripwires, not a clinical reviewer or a ranking/quality score.
// Keep the original vendor receipt and body. Flagged NEW deliveries stay private.
export function articlePublicationReview(body){
 const text=String(body||'').replace(/\[([^\]]+)\]\([^\s)]+\)/g,'$1').replace(/[\*_]/g,'').replace(/\s+/g,' ');
 const rules=[
  ['unverified_partner_service',/clinical assessment, prescribing and dispensing (?:is|are) handled by appropriately regulated partners/i],
  ['regulatory_role',/NICE authorises/i],
  ['automatic_tirzepatide_stop',/NICE guidance says to stop tirzepatide if weight loss is under 5%/i],
  ['unscoped_semaglutide_setting',/(?:Semaglutide(?: \(Wegovy\))? (?:can only be prescribed|is only available)|This can only be prescribed) through a specialist weight management service/i],
  ['unverified_customer_experience',/(?:Plenty of men tell us the same thing|We hear the same worry from lots of men|Most men start here because)/i]
 ];
 const issues=rules.filter(([,pattern])=>pattern.test(text)).map(([code,pattern])=>({code,excerpt:text.match(pattern)[0]}));
 if(/^>\s*(?:[\*_])?(?:[—–-]\s*)?Matt O[’']Brien(?:[\*_])?\s*$/m.test(String(body||'')))issues.push({code:'organisation_byline_personal_signature',excerpt:'Matt-signed quotation requires attribution review'});
 return issues;
}
