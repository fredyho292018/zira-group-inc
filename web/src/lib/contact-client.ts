import { validateContact, type FieldErrors, type FormState } from './contact';
interface Turnstile { render: (target: string, options: Record<string, unknown>) => string; reset: (id: string) => void }
declare global { interface Window { turnstile?: Turnstile } }
export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('#estimate-form');
  if (!form) return;
  if (form.dataset.enabled !== 'true') {
    const blocked = (event: Event) => {
      event.preventDefault();
      const status = form.querySelector<HTMLElement>('#estimate-status');
      const raw = Object.fromEntries(new FormData(form));
      // Demo validates the project fields only; no consent is recorded or token redeemed.
      const { errors } = validateContact({ ...raw, consent: true }, false);
      for (const name of ['fullName', 'email', 'phone', 'service', 'city', 'message'] as const) {
        const control = form.elements.namedItem(name);
        if (control instanceof HTMLElement) control.setAttribute('aria-invalid', String(!!errors[name]));
        const error = document.getElementById(`${name}-error`);
        if (error) error.textContent = errors[name] ?? '';
      }
      if (status) {
        status.dataset.state = Object.keys(errors).length ? 'ERROR' : 'IDLE';
        status.textContent = 'Demo mode — Your information has not been sent.' + (Object.keys(errors).length ? ' Please review the highlighted fields.' : '');
      }
      form.querySelector<HTMLElement>('[aria-invalid=true]')?.focus();
    };
    form.addEventListener('submit', blocked);
    form.querySelector('button')?.addEventListener('click', blocked);
    return;
  }
  const status = form.querySelector<HTMLElement>('#estimate-status')!;
  const fieldset = form.querySelector('fieldset')!;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  let state: FormState = 'IDLE', token = '', widget = '', requestId = '', submittedPayload = '';
  const transition = (next: FormState, message: string) => { state = next; status.dataset.state = next; status.textContent = message; form.setAttribute('aria-busy', String(next === 'SUBMITTING')); button.disabled = next === 'SUBMITTING' || next === 'SUCCESS'; };
  const showErrors = (errors: FieldErrors) => {
    for (const name of ['fullName','email','phone','service','city','message','consent','turnstileToken'] as const) {
      const control = form.elements.namedItem(name);
      if (control instanceof HTMLElement) control.setAttribute('aria-invalid', String(!!errors[name]));
      const error = document.getElementById(`${name}-error`);
      if (error) error.textContent = typeof errors[name] === 'string' ? errors[name]! : '';
    }
    form.querySelector<HTMLElement>('[aria-invalid=true]')?.focus();
  };
  const challenge = document.createElement('script');
  challenge.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; challenge.async = true;
  challenge.onload = () => { if (window.turnstile) widget = window.turnstile.render('#contact-turnstile', { sitekey: form.dataset.sitekey, action: 'contact', callback: (value: string) => { token = value; }, 'expired-callback': () => { token = ''; }, 'error-callback': () => { token = ''; transition('ERROR', 'The security check could not load. Please try again later.'); } }); };
  challenge.onerror = () => transition('ERROR', 'The security check could not load. Please try again later.');
  document.head.append(challenge);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state === 'SUBMITTING' || state === 'SUCCESS') return;
    transition('VALIDATING', 'Checking your details…');
    const raw = Object.fromEntries(new FormData(form));
    const { value, errors } = validateContact({ ...raw, consent: raw.consent === 'on', turnstileToken: token });
    showErrors(errors);
    if (Object.keys(errors).length) { transition('ERROR', 'Please review the highlighted fields.'); return; }
    const fingerprint = JSON.stringify({ ...value, turnstileToken: '' });
    if (fingerprint !== submittedPayload) { requestId = crypto.randomUUID(); submittedPayload = fingerprint; }
    transition('SUBMITTING', 'Sending your request…'); fieldset.disabled = true;
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId }, body: JSON.stringify(value), signal: AbortSignal.timeout(20000), credentials: 'same-origin' });
      const result = await response.json();
      if (response.status === 200 && result.ok === true && result.requestId === requestId) {
        transition('SUCCESS', 'Your request has been accepted. Thank you for sharing your project.'); form.reset();
      } else {
        fieldset.disabled = false;
        showErrors(result.fieldErrors ?? {});
        const messages: Record<string, string> = { RATE_LIMITED: 'Too many requests. Please wait 10 minutes before trying again.', TURNSTILE_INVALID: 'Please complete a new security check.', DELIVERY_FAILED: 'Your request could not be accepted. Please try again later.', DELIVERY_UNCERTAIN: 'We could not confirm acceptance. Do not start a new request; retry these same details later.', REQUEST_IN_PROGRESS: 'This request is still being processed. Please retry the same details shortly.', NOT_CONFIGURED: 'Online requests are temporarily unavailable.', VALIDATION_ERROR: 'Please review the highlighted fields.' };
        transition('ERROR', messages[result.code] ?? 'Your request could not be confirmed. Please try again later.');
        if (['TURNSTILE_INVALID', 'SECURITY_UNAVAILABLE', 'VALIDATION_ERROR', 'RATE_LIMITED', 'DELIVERY_FAILED'].includes(result.code)) submittedPayload = '';
      }
    } catch { transition('ERROR', 'We could not confirm acceptance. Please retry the same details; avoid starting a second request.'); }
    finally { fieldset.disabled = status.dataset.state === 'SUCCESS'; token = ''; if (widget) window.turnstile?.reset(widget); }
  });
}
