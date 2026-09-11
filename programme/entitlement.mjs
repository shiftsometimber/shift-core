// The stored grant is not rewritten when time passes. Reads and writes resolve
// its current status so saved records survive expiry without a scheduled job.
export function resolvedEntitlement(grant={},now=new Date().toISOString()){
 const expiresAt=grant.expiresAt,hasExpiry=expiresAt!==undefined&&expiresAt!==null;
 const valid=typeof expiresAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(expiresAt)&&Number.isFinite(Date.parse(expiresAt));
 const expired=hasExpiry&&(!valid||!Number.isFinite(Date.parse(now))||Date.parse(expiresAt)<=Date.parse(now));
 return {...grant,active:grant.active===true&&!expired,...(expired?{status:valid?'expired':'invalid-expiry'}:{})};
}
