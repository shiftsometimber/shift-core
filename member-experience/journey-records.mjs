// Member-owned Journey records live inside the existing, revision-guarded
// Life Back record. No new identity, clinical calculation or database table.
export const journeyKinds = ['win', 'measurement', 'clothes', 'feeling', 'treatment', 'injection'];
export const treatmentLabels = {started:'Started treatment',changed:'Changed treatment',paused:'Paused treatment',finished:'Finished treatment'};
export const feelingLabels = {okay:'Felt okay',sick:'Felt sick',hungry:'Hungry again',tired:'Tired'};
export function journeyDay(at = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
}
export function validJourneyDate(value, today = journeyDay()) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && value >= '1900-01-01' && value <= today
    && Number.isFinite(Date.parse(value+'T12:00:00Z'))
    && new Date(value+'T12:00:00Z').toISOString().slice(0,10) === value;
}
export function validateJourneyRecord(input, today = journeyDay(), at = new Date().toISOString()) {
  const fail = message => {throw Object.assign(Error(message), {status:400});};
  if (!input || typeof input !== 'object' || Array.isArray(input) || !journeyKinds.includes(input.kind)) fail('Choose a Journey record to add.');
  if (!validJourneyDate(input.on, today)) fail('Choose a real date, up to today.');
  const words = (key,max=500) => {
    if (input[key] == null) return '';
    if (typeof input[key] !== 'string' || input[key].trim().length > max) fail('Check your '+key+'; use '+max+' characters or fewer.');
    return input[key].trim();
  };
  const record = {kind:input.kind,on:input.on};
  const note = words('note'); if (note) record.note = note;
  if (input.kind === 'win') {
    record.text = words('text',180); if (!record.text) fail('Add what you noticed in your own words.');
  } else if (input.kind === 'measurement') {
    for (const [key,min,max] of [['weightKg',20,400],['waistCm',40,250]]) {
      if (input[key] === undefined || input[key] === null || input[key] === '') continue;
      if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < min || input[key] > max) fail('Check your weight or waist reading.');
      record[key] = Math.round(input[key]*100)/100;
    }
    if (record.weightKg === undefined && record.waistCm === undefined) fail('Add a weight or waist reading.');
  } else if (input.kind === 'clothes') {
    record.top = words('top',30); record.trousers = words('trousers',30);
    if (!record.top && !record.trousers) fail('Add at least one clothes label size.');
  } else if (input.kind === 'feeling') {
    if (!Array.isArray(input.feelings) || !input.feelings.length || input.feelings.some(f => !Object.hasOwn(feelingLabels,f))) fail('Choose how you felt.');
    record.feelings = [...new Set(input.feelings)];
  } else if (input.kind === 'treatment') {
    if (!Object.hasOwn(treatmentLabels,input.change)) fail('Choose the change you want to record.');
    record.change = input.change;
  } else if (input.kind === 'injection') {
    // Past record only. No site rotation, schedule or next-site recommendation.
    record.site = words('site',80); if (!record.site) fail('Record where you injected.');
    const time = words('time',5);
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) fail('Check the time you recorded.');
    if (time && input.on===journeyDay(at) && time>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(at))) fail('Record an injection that has already happened.');
    if (time) record.time = time;
  }
  // Medicine details belong only in an optional treatment/injection record.
  if (['treatment','injection'].includes(input.kind)) {
    for (const key of ['medicine','dose']) {const value=words(key,80);if(value)record[key]=value;}
  }
  const allowed = ['kind','on','note',...({win:['text'],measurement:['weightKg','waistCm'],clothes:['top','trousers'],feeling:['feelings'],treatment:['change','medicine','dose'],injection:['site','time','medicine','dose']})[input.kind]];
  if (Object.keys(input).some(k => !allowed.includes(k))) fail('This record includes an unsupported field.');
  return record;
}
export function applyJourneyOperation(progress, input, at) {
  if (!String(input.action||'').startsWith('journey-')) return false;
  const fail = (message,status=400) => {throw Object.assign(Error(message),{status});};
  if (input.revision !== progress.revision) fail('Your Journey changed in another tab. Reload before saving.',409);
  const state = progress.journey || {version:1,records:[],showMedicine:false};
  if (input.action === 'journey-view') {
    if (typeof input.showMedicine !== 'boolean') fail('Choose whether to show the illustration.');
    state.showMedicine = input.showMedicine;
  } else if (input.action === 'journey-delete') {
    if (!state.records.some(r=>r.id===input.recordId)) fail('This Journey record is no longer available.',404);
    state.records = state.records.filter(r=>r.id!==input.recordId);
  } else if (input.action === 'journey-record') {
    const record = validateJourneyRecord(input.record,journeyDay(at),at);
    if (input.recordId) {
      const index=state.records.findIndex(r=>r.id===input.recordId);
      if(index<0)fail('This Journey record is no longer available.',404);
      const old=state.records[index];if(old.kind!==record.kind)fail('Keep the same record type when correcting it.');
      state.records[index]={...record,id:old.id,createdAt:old.createdAt,correctedAt:at};
    } else {
      if(state.records.some(r=>r.id===input.operationId))return false;
      if(state.records.length>=10000)fail('Your history is full. Contact support before adding another record.',409);
      state.records.push({...record,id:input.operationId,createdAt:at});
    }
  } else fail('Unknown Journey action.');
  if(new TextEncoder().encode(JSON.stringify(state)).length>512000)fail('Your Journey history is full. Export it and contact support before adding more.',409);
  progress.journey=state;
  return true;
}
