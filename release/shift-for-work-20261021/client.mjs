const LIVE_HOSTS = new Set(['shiftsometimber.co.uk', 'www.shiftsometimber.co.uk']);
const CHOICES = {
  sector: ['Haulage and logistics','Construction and trades','Manufacturing and warehousing','Grounds care and landscaping','Security','Football and sport','Other'],
  workforce: ['Under 30','30–75','76–250','251–499','500+'],
};
export function buildWorkEnquiry(values) {
  const clean = (key, max) => String(values[key] || '').trim().replace(/[\r\n\t]+/g, ' ').slice(0, max);
  const name = clean('name', 100), email = clean('email', 254), company = clean('company', 160), role = clean('role', 100);
  if (!name || !company) throw new Error('Enter your name and company.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Enter a valid work email address.');
  for (const [key, options] of Object.entries(CHOICES)) if (!options.includes(values[key])) throw new Error('Choose an option in each required field.');
  if (values.consent !== true) throw new Error('Please confirm SHIFT may respond to your enquiry.');
  return {name, email, type:'partner', consent:true, message:[
    'SHIFT for Work — employer enquiry', `Company: ${company}`, `Role: ${role || 'Not supplied'}`,
    `Sector: ${values.sector}`, `Total workforce: ${values.workforce}`,
    'Permission: use these business contact details to respond to this enquiry only.'
  ].join('\n')};
}
export async function submitWorkEnquiry(payload, {hostname, send=globalThis.fetch, timeout=20000}={}) {
  if (!LIVE_HOSTS.has(hostname)) return {preview:true, message:'Preview only: your enquiry has not been sent. No details have been stored.'};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await send('/v1/contact', {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body:JSON.stringify(payload), signal:controller.signal});
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true || result?.status !== 'sent') {
      if (response.status === 429) throw new Error('Too many attempts. Please try again later or email partners@shiftsometimber.co.uk.');
      throw new Error('We could not confirm delivery. Your details are still here. Please try again or email partners@shiftsometimber.co.uk.');
    }
    return {preview:false, message:'Enquiry sent to SHIFT’s partnerships inbox. A copy is on its way to your email. We’ll respond about what could work for your team; this has not enrolled anyone.'};
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('We could not confirm whether your enquiry arrived. Check your email before retrying, or contact partners@shiftsometimber.co.uk.');
    if (error instanceof TypeError) throw new Error('We could not connect. Your details are still here. Check your connection and try again.');
    throw error;
  } finally { clearTimeout(timer); }
}
if (typeof document !== 'undefined') {
  const form = document.querySelector('[data-work-enquiry]');
  if (form) {
    const button = form.querySelector('button[type=submit]');
    const status = document.getElementById('work-form-status');
    let busy = false;
    button.disabled = false;
    if (!LIVE_HOSTS.has(location.hostname)) {
      button.textContent = 'Check enquiry preview';
      status.textContent = 'Preview: submissions stay on this page and are not sent or saved.';
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;
      busy = true; button.disabled = true; status.textContent = 'Checking your enquiry…'; status.dataset.state = 'pending';
      try {
        const fields = Object.fromEntries(new FormData(form));
        fields.consent = form.elements.namedItem('consent').checked;
        const result = await submitWorkEnquiry(buildWorkEnquiry(fields), {hostname:location.hostname});
        status.textContent = result.message; status.dataset.state = result.preview ? 'preview' : 'success';
        if (!result.preview) form.reset();
      } catch (error) { status.textContent = error.message; status.dataset.state = 'error'; }
      finally { busy = false; button.disabled = false; status.focus(); }
    });
  }
}
