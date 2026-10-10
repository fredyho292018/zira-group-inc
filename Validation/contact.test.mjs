import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from '../web/node_modules/typescript/lib/typescript.js';
const root = new URL('../', import.meta.url);
const output = await mkdtemp(join(tmpdir(), 'zira-contact-tests-'));
for (const [file, name] of [['web/src/lib/contact.ts','contact'], ['contact-worker/src/worker.ts','worker']]) {
  const source = (await readFile(new URL(file, root), 'utf8')).replace("'../../web/src/lib/contact'", "'./contact.mjs'");
  await writeFile(join(output, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
}
after(async () => { if (resolve(output).startsWith(resolve(tmpdir()) + '\\') || resolve(output).startsWith(resolve(tmpdir()) + '/')) await rm(output, { recursive: true, force: true }); });
const { validateContact } = await import(pathToFileURL(join(output, 'contact.mjs')));
const { default: worker, ContactCoordinator } = await import(pathToFileURL(join(output, 'worker.mjs')));
const valid = { fullName: 'Test Customer', email: 'customer@example.test', phone: '+1 (305) 555-0100', service: 'Other', city: 'Miami', message: 'Please discuss a fictional kitchen renovation.', consent: true, turnstileToken: 'test-token' };
class MemoryStore {
  data = new Map(); alarmTime = null; queue = Promise.resolve();
  async get(key) { return structuredClone(this.data.get(key)); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { return this.data.delete(key); }
  async list() { return new Map(this.data); }
  transaction(callback) { const task = this.queue.then(() => callback(this)); this.queue = task.catch(() => {}); return task; }
  async setAlarm(time) { this.alarmTime = time; }
  async getAlarm() { return this.alarmTime; }
}
function fixture(options = {}) {
  const storage = new MemoryStore(), calls = [];
  const env = { CONTACT_ENABLED: 'true', SITE_ORIGIN: 'https://example.test', PRIVACY_POLICY_URL: 'https://example.test/privacy', TURNSTILE_SECRET: 'test-secret', IP_HASH_SECRET: 'test-only-hmac-key-at-least-32-characters', EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'test-only', EMAIL_FROM: 'sender@example.test', EMAIL_TO: 'recipient@example.test' };
  const network = async (url, init) => {
    calls.push({ url, init });
    if (url.includes('siteverify')) return Response.json(options.challenge ?? { success: true, hostname: 'example.test', action: 'contact' });
    if (options.wait) await options.wait;
    if (options.timeout) throw new Error('simulated timeout');
    return Response.json(options.email ?? { id: 'simulated-provider-receipt' }, { status: options.emailStatus ?? 200 });
  };
  const coordinator = new ContactCoordinator({ storage }, env, network);
  env.CONTACT = { idFromName: value => value, get: () => ({ fetch: request => coordinator.fetch(request) }) };
  const request = (value = valid, id = crypto.randomUUID(), headers = {}) => new Request('https://example.test/api/contact', { method: 'POST', headers: { Origin: env.SITE_ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.10', 'Idempotency-Key': id, ...headers }, body: JSON.stringify(value) });
  return { env, storage, calls, request, coordinator, send: (value = valid, id, headers) => worker.fetch(request(value, id, headers), env) };
}
test('all required fields, strict consent and security token are validated', () => {
  assert.deepEqual(Object.keys(validateContact({}).errors).sort(), Object.keys(valid).sort());
  assert.ok(validateContact({ ...valid, consent: 'true' }).errors.consent);
});
for (const [name, patch, field] of [
  ['invalid email', { email: 'not-an-email' }, 'email'],
  ['invalid phone', { phone: '123abc' }, 'phone'],
  ['long description', { message: 'x'.repeat(3001) }, 'message'],
  ['short description', { message: 'short' }, 'message'],
  ['missing consent', { consent: false }, 'consent'],
  ['unlisted service', { service: 'Unexpected' }, 'service'],
  ['email header injection', { email: 'customer@example.test\r\nBcc: other@example.test' }, 'email']
]) test(name, async () => { const f = fixture(); const response = await f.send({ ...valid, ...patch }); assert.equal(response.status, 422); assert.ok((await response.json()).fieldErrors[field]); assert.equal(f.calls.length, 0); });
test('normalization accepts international names and formatted telephone', () => {
  const result = validateContact({ ...valid, fullName: '  Jose\u0301 Rivera  ' }); assert.deepEqual(result.errors, {}); assert.equal(result.value.fullName, 'José Rivera');
});
for (const [name, challenge] of [['invalid Turnstile', { success: false }], ['wrong challenge host', { success: true, hostname: 'attacker.test', action: 'contact' }], ['wrong challenge action', { success: true, hostname: 'example.test', action: 'login' }]]) test(name, async () => { const f = fixture({ challenge }); assert.equal((await f.send()).status, 422); assert.equal(f.calls.length, 1); });
test('persistent rate limit: five attempts per IP hash per ten minutes', async () => {
  const f = fixture({ challenge: { success: false } });
  for (let i = 0; i < 5; i++) assert.equal((await f.send()).status, 422);
  const response = await f.send(); assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '600'); assert.equal(f.calls.length, 5);
  for (const key of f.storage.data.keys()) assert.ok(!key.includes('192.0.2.10'));
});
test('successful simulated provider confirmation and sequential duplicate send one email', async () => {
  const f = fixture(), id = crypto.randomUUID();
  assert.deepEqual(await (await f.send(valid, id)).json(), { ok: true, code: 'ACCEPTED', requestId: id });
  assert.equal((await f.send({ ...valid, turnstileToken: 'fresh-token' }, id)).status, 200);
  const emailCalls = f.calls.filter(call => call.url.includes('resend')); assert.equal(emailCalls.length, 1);
  const payload = JSON.parse(emailCalls[0].init.body);
  assert.equal(payload.from, 'sender@example.test'); assert.equal(payload.reply_to, valid.email); assert.equal(payload.to[0], 'recipient@example.test');
  for (const value of [valid.fullName, valid.email, valid.phone, valid.service, valid.city, valid.message, 'Received at (UTC):']) assert.ok(payload.text.includes(value));
  assert.ok(!('html' in payload)); assert.equal(emailCalls[0].init.headers['Idempotency-Key'], `zira-contact/${id}`);
  const records = JSON.stringify([...f.storage.data]); assert.ok(!records.includes(valid.email)); assert.ok(!records.includes(valid.message));
});
test('concurrent duplicate is blocked while provider is pending', async () => {
  let release; const wait = new Promise(resolve => { release = resolve; }); const f = fixture({ wait }), id = crypto.randomUUID();
  const first = f.send(valid, id);
  while (!f.calls.some(call => call.url.includes('resend'))) await new Promise(resolve => setImmediate(resolve));
  assert.equal((await f.send(valid, id)).status, 409); release(); assert.equal((await first).status, 200);
  assert.equal(f.calls.filter(call => call.url.includes('resend')).length, 1);
});
test('same key with different project data is rejected', async () => { const f = fixture(), id = crypto.randomUUID(); await f.send(valid, id); const response = await f.send({ ...valid, city: 'Hialeah' }, id); assert.equal((await response.json()).code, 'IDEMPOTENCY_CONFLICT'); });
test('provider rejection never produces success', async () => { const f = fixture({ emailStatus: 400, email: { message: 'private provider details' } }); const response = await f.send(); assert.equal(response.status, 502); assert.equal((await response.json()).code, 'DELIVERY_FAILED'); });
test('provider timeout remains uncertain and duplicate does not resend', async () => { const f = fixture({ timeout: true }), id = crypto.randomUUID(); assert.equal((await (await f.send(valid, id)).json()).code, 'DELIVERY_UNCERTAIN'); assert.equal((await (await f.send(valid, id)).json()).code, 'DELIVERY_UNCERTAIN'); assert.equal(f.calls.filter(call => call.url.includes('resend')).length, 1); });
test('provider 2xx without receipt is not a success', async () => { const f = fixture({ email: {} }); assert.equal((await f.send()).status, 503); });
test('release gate blocks all outbound requests', async () => { const f = fixture(); f.env.CONTACT_ENABLED = 'false'; assert.equal((await f.send()).status, 503); assert.equal(f.calls.length, 0); });
test('origin and content-type enforced before external calls', async () => { const f = fixture(); assert.equal((await f.send(valid, undefined, { Origin: 'https://attacker.test' })).status, 403); assert.equal((await f.send(valid, undefined, { 'Content-Type': 'text/plain' })).status, 415); assert.equal(f.calls.length, 0); });
test('actual body size enforced even without Content-Length', async () => { const f = fixture(); assert.equal((await f.send({ ...valid, message: 'x'.repeat(17000) })).status, 413); assert.equal(f.calls.length, 0); });
test('malformed JSON and invalid request identifiers are controlled errors', async () => {
  const f = fixture(); assert.equal((await f.send(valid, 'bad')).status, 400);
  const request = f.request(); assert.equal((await worker.fetch(new Request(request.url, { method: 'POST', headers: request.headers, body: '{' }), f.env)).status, 400);
});
test('alarm deletes only expired hashed records', async () => { const f = fixture(); await f.storage.put('expired', { expires: Date.now() - 1 }); await f.storage.put('active', { expires: Date.now() + 100000 }); await f.coordinator.alarm(); assert.equal(await f.storage.get('expired'), undefined); assert.ok(await f.storage.get('active')); });
