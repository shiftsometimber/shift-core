export function repairUrgentPhoneRuntime(body){
 const broken='tel:116123?oai_link_source=model_response_hotline';
 if(!body.includes('My Timber six-page presentation recovery.'))return body;
 return body.split(broken).join('tel:116123');
}
