// Local-only QA harness. Never copy into web/public or deploy this server.
// No external network requests, real secrets or real email delivery.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const dist = fileURLToPath(new URL('../web/dist/', import.meta.url));
const mock = `<script>
window.turnstile = { render(target, options) { window.qaToken = () => options.callback('local-fixture-token'); window.qaToken(); return 'fixture'; }, reset() { window.qaToken(); } };
const append = document.head.append.bind(document.head);
document.head.append = function(node) { if (node.src && node.src.startsWith('https://challenges.cloudflare.com/')) { setTimeout(() => node.onload(), 0); return; } return append(node); };
window.fetch = async function(url, options) {
 if (url !== '/api/contact') throw new Error('External requests prohibited in QA');
 window.qaCalls = (window.qaCalls || 0) + 1;
 const scenario = document.getElementById('qa-scenario').value;
 if (scenario === 'pending') await new Promise(resolve => setTimeout(resolve, 1500));
 const id = options.headers['Idempotency-Key'];
 if (scenario === 'provider') return new Response(JSON.stringify({ok:false,code:'DELIVERY_FAILED'}),{status:502});
 if (scenario === 'security') return new Response(JSON.stringify({ok:false,code:'TURNSTILE_INVALID',fieldErrors:{turnstileToken:'Please complete a new security check.'}}),{status:422});
 if (scenario === 'malformed') return new Response(JSON.stringify({ok:true}),{status:200});
 return new Response(JSON.stringify({ok:true,code:'ACCEPTED',requestId:id}),{status:200});
};
</script>`;
const banner = `<aside style="padding:16px;background:#fff;color:#102b46;border:4px solid #d8ab56" id="qa-banner"><strong>LOCAL QA ONLY — simulated responses. No email is sent.</strong> <label>Scenario <select id="qa-scenario"><option value="success">Success</option><option value="provider">Provider failure</option><option value="security">Security failure</option><option value="malformed">Unconfirmed 200</option><option value="pending">Delayed success</option></select></label></aside>`;
createServer(async (request, response) => {
 try {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(resolve(dist) + sep)) { response.writeHead(403); response.end(); return; }
  let content = await readFile(path);
  if (extname(path) === '.html') content = Buffer.from(content.toString().replace('</head>', mock + '</head>').replace('<body>', '<body>' + banner).replace('data-enabled="false"', 'data-enabled="true"').replace('data-sitekey=""', 'data-sitekey="local-fixture"').replace(/<fieldset disabled(?:="")?>/, '<fieldset>').replace('Online requests are not open yet. Please do not enter personal information. Submission will be enabled once our privacy policy and contact service are ready.', 'Local fixture with fictional test data. No submission leaves this computer.'));
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp' };
  response.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Cache-Control':'no-store' }); response.end(content);
 } catch { response.writeHead(404); response.end(); }
}).listen(4323, '127.0.0.1', () => console.log('Local contact QA fixture: http://127.0.0.1:4323/ — simulated only'));
