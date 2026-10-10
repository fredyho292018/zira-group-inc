import { validateContact, LIMITS, type ContactInput } from '../../web/src/lib/contact';

// Minimal structural interfaces for the documented Durable Object KV APIs.
export interface Store {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T>(): Promise<Map<string, T>>;
  transaction<T>(callback: (transaction: Store) => Promise<T>): Promise<T>;
  setAlarm(time: number): Promise<void>;
  getAlarm(): Promise<number | null>;
}
interface Namespace { idFromName(name: string): unknown; get(id: unknown): { fetch(request: Request): Promise<Response> } }
export interface Env {
  CONTACT_ENABLED?: string; SITE_ORIGIN?: string; PRIVACY_POLICY_URL?: string;
  TURNSTILE_SECRET?: string; IP_HASH_SECRET?: string;
  EMAIL_PROVIDER?: string; EMAIL_API_KEY?: string; EMAIL_FROM?: string; EMAIL_TO?: string;
  CONTACT: Namespace;
}
interface Receipt { fingerprint: string; status: 'pending' | 'sent' | 'failed' | 'uncertain' | 'challenge'; expires: number }
const retention = 24 * 60 * 60 * 1000, windowMs = 10 * 60 * 1000;
function reply(status: number, code: string, extra: Record<string, unknown> = {}): Response {
  return Response.json({ ok: status === 200, code, ...extra }, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(status === 429 ? { 'Retry-After': '600' } : {}) } });
}
function configured(env: Env): boolean {
  try {
    const origin = new URL(env.SITE_ORIGIN!);
    const privacy = new URL(env.PRIVACY_POLICY_URL!);
    const mailbox = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
    return env.CONTACT_ENABLED === 'true' && origin.protocol === 'https:' && origin.origin === env.SITE_ORIGIN && privacy.protocol === 'https:' && !!env.TURNSTILE_SECRET && (env.IP_HASH_SECRET?.length ?? 0) >= 32 && env.EMAIL_PROVIDER === 'resend' && !!env.EMAIL_API_KEY && mailbox.test(env.EMAIL_FROM ?? '') && mailbox.test(env.EMAIL_TO ?? '');
  } catch { return false; }
}
async function digest(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function boundedJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get('Content-Length')) > LIMITS.bodyBytes) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  let length = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > LIMITS.bodyBytes) { await reader.cancel(); throw new RangeError(); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== '/api/contact') return reply(404, 'NOT_FOUND');
    if (request.method !== 'POST') { const response = reply(405, 'METHOD_NOT_ALLOWED'); response.headers.set('Allow', 'POST'); return response; }
    if (!configured(env)) return reply(503, 'NOT_CONFIGURED');
    if (request.headers.get('Origin') !== env.SITE_ORIGIN) return reply(403, 'ORIGIN_DENIED');
    if (request.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return reply(415, 'UNSUPPORTED_MEDIA_TYPE');
    const id = request.headers.get('Idempotency-Key') ?? '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return reply(400, 'INVALID_REQUEST_ID');
    let raw: unknown;
    try { raw = await boundedJson(request); } catch (error) { return reply(error instanceof RangeError ? 413 : 400, error instanceof RangeError ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON'); }
    const { value, errors } = validateContact(raw);
    if (Object.keys(errors).length) return reply(422, 'VALIDATION_ERROR', { fieldErrors: errors });
    // CF-Connecting-IP is supplied by the Cloudflare edge; never accept an X-Forwarded-For override.
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return reply(503, 'EDGE_CONTEXT_REQUIRED');
    try {
      const ipHash = await digest(ip, env.IP_HASH_SECRET!);
      const fingerprint = await digest(JSON.stringify({ ...value, turnstileToken: '' }), env.IP_HASH_SECRET!);
      const stub = env.CONTACT.get(env.CONTACT.idFromName('contact-coordinator-v1'));
      return await stub.fetch(new Request('https://internal/contact', { method: 'POST', body: JSON.stringify({ value, ipHash, fingerprint, id }) }));
    } catch { return reply(503, 'SERVICE_UNAVAILABLE'); }
  }
};

export class ContactCoordinator {
  constructor(private ctx: { storage: Store }, private env: Env, private network: typeof fetch = fetch) {}
  async fetch(request: Request): Promise<Response> {
    const { value, ipHash, fingerprint, id } = await request.json() as { value: ContactInput; ipHash: string; fingerprint: string; id: string };
    const now = Date.now(), receiptKey = `request:${id}`, rateKey = `rate:${ipHash}`;
    const claim = await this.ctx.storage.transaction(async txn => {
      const old = await txn.get<Receipt>(receiptKey);
      if (old && old.expires > now) {
        if (old.fingerprint !== fingerprint) return 'conflict';
        return old.status;
      }
      const rate = await txn.get<{ count: number; expires: number }>(rateKey);
      if (rate && rate.expires > now && rate.count >= 5) return 'limited';
      await txn.put(rateKey, { count: rate && rate.expires > now ? rate.count + 1 : 1, expires: rate && rate.expires > now ? rate.expires : now + windowMs });
      await txn.put<Receipt>(receiptKey, { fingerprint, status: 'pending', expires: now + retention });
      return 'claimed';
    });
    if (await this.ctx.storage.getAlarm() === null) await this.ctx.storage.setAlarm(now + windowMs);
    if (claim === 'sent') return reply(200, 'ACCEPTED', { requestId: id });
    if (claim === 'pending') return reply(409, 'REQUEST_IN_PROGRESS');
    if (claim === 'conflict') return reply(409, 'IDEMPOTENCY_CONFLICT');
    if (claim === 'limited') return reply(429, 'RATE_LIMITED');
    if (claim === 'failed') return reply(502, 'DELIVERY_FAILED');
    if (claim === 'uncertain') return reply(503, 'DELIVERY_UNCERTAIN');
    if (claim === 'challenge') return reply(422, 'TURNSTILE_INVALID', { fieldErrors: { turnstileToken: 'Please complete a new security check.' } });
    const finish = async (status: Receipt['status']) => this.ctx.storage.put<Receipt>(receiptKey, { fingerprint, status, expires: now + retention });
    try {
      const check = await this.network('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: this.env.TURNSTILE_SECRET!, response: value.turnstileToken }), signal: AbortSignal.timeout(8000) });
      const result = await check.json() as { success?: boolean; hostname?: string; action?: string };
      if (!check.ok || result.success !== true || result.hostname !== new URL(this.env.SITE_ORIGIN!).hostname || result.action !== 'contact') {
        await finish('challenge'); return reply(422, 'TURNSTILE_INVALID', { fieldErrors: { turnstileToken: 'Please complete a new security check.' } });
      }
    } catch { await finish('challenge'); return reply(503, 'SECURITY_UNAVAILABLE'); }
    // Text-only email: user input is never interpolated into HTML or email headers.
    const receivedAt = new Date(now).toISOString();
    const text = `New Zira estimate request\n\nFull Name: ${value.fullName}\nEmail: ${value.email}\nPhone: ${value.phone}\nService: ${value.service}\nCity: ${value.city}\nReceived at (UTC): ${receivedAt}\nConsent: confirmed\n\nProject Description:\n${value.message}`;
    try {
      const response = await this.network('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${this.env.EMAIL_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `zira-contact/${id}` }, body: JSON.stringify({ from: this.env.EMAIL_FROM, to: [this.env.EMAIL_TO], reply_to: value.email, subject: 'New Zira estimate request', text }), signal: AbortSignal.timeout(10000) });
      const receipt = await response.json() as { id?: string };
      if (!response.ok || typeof receipt.id !== 'string' || !receipt.id.trim()) { await finish(response.status >= 500 || response.ok ? 'uncertain' : 'failed'); return reply(response.status >= 500 || response.ok ? 503 : 502, response.status >= 500 || response.ok ? 'DELIVERY_UNCERTAIN' : 'DELIVERY_FAILED'); }
      await finish('sent'); return reply(200, 'ACCEPTED', { requestId: id });
    } catch { await finish('uncertain'); return reply(503, 'DELIVERY_UNCERTAIN'); }
  }
  async alarm(): Promise<void> {
    const now = Date.now();
    const records = await this.ctx.storage.list<{ expires: number }>();
    for (const [key, record] of records) if (record.expires <= now) await this.ctx.storage.delete(key);
    if ([...records.values()].some(record => record.expires > now)) await this.ctx.storage.setAlarm(now + windowMs);
  }
}
