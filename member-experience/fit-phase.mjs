// Catalogue protocols must match the requested session phase. Preserve the
// original records; this guards new plan selection and explicit replacements.
export function fitPhaseAllowed(row,group=''){
 const data=row.data||{},identity=String(data.variation_identity||row.id||'').toLowerCase();
 const facets=Array.isArray(data.relationships?.brain_facets)?data.relationships.brain_facets:[];
 const phase=facets.includes('protocol:cool-down')||/(?:^|-)cool-down(?:-|$)/.test(identity)?'cool-down':facets.includes('protocol:warm-up')||/(?:^|-)warm-up(?:-|$)/.test(identity)?'warm-up':null;
 const slot=String(group).toLowerCase().replace(/[_ ]/g,'-');
 return !phase||slot===phase;
}
