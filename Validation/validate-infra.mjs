import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../web/package.json', import.meta.url));
const { parse } = require('yaml');
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const compose = parse(read('infra/compose.yaml'));
assert.equal(compose.name, 'zira-group-inc');
assert.deepEqual(Object.keys(compose.services), ['zira-web']);
assert.equal(compose.services['zira-web'].container_name, 'zira-web');
assert.deepEqual(compose.services['zira-web'].ports, ['127.0.0.1:38081:80']);
assert.equal(compose.services['zira-web'].read_only, true);
assert.deepEqual(compose.services['zira-web'].cap_drop, ['ALL']);
assert.equal(compose.networks.zira.name, 'zira-group-inc');
assert.ok(!compose.networks.zira.external);
for (const path of ['.github/workflows/ci.yml', '.github/workflows/deploy.yml']) {
  const workflow = parse(read(path));
  assert.ok(workflow.on && workflow.jobs && workflow.permissions);
  assert.equal(workflow.permissions.contents, 'read');
}
const cd = parse(read('.github/workflows/deploy.yml'));
assert.equal(cd.jobs.deploy.environment, 'production');
assert.ok(cd.jobs.deploy.if.includes("vars.ZIRA_CD_ENABLED == 'true'"));
assert.ok(cd.jobs.deploy['runs-on'].includes('zira-production'));
assert.ok(read('infra/deploy.sh').includes('flock -n'));
assert.ok(read('infra/deploy.sh').includes('trap recover ERR'));
assert.ok(!/docker\s+(system\s+prune|compose\s+down)/.test(read('infra/deploy.sh')));
assert.ok(read('infra/Dockerfile').includes('USER 10001:10001'));
assert.ok(read('infra/Dockerfile').includes('HEALTHCHECK'));
const packageJson = JSON.parse(read('web/package.json'));
for (const version of Object.values({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
  assert.match(version, /^\d+\.\d+\.\d+$/);
}
console.log('INFRA_VALIDATION=PASS (YAML syntax and isolation invariants; GitHub execution remains a separate check)');
