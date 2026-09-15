import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');
const escalationSource = readFileSync(path.join(root, 'operational-escalation.js'), 'utf8');
const presentationSource = readFileSync(path.join(root, 'operational-escalation-presentation.js'), 'utf8');

const noop = () => {};
const drawContext = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) target[prop] = noop;
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  relayDetail: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop },
  operationCard: { dataset: { phase: 'TRIAGE' } },
  operationText: { textContent: 'TRIAGE' }
};

const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => [] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js#qa-wave02-route-cut-transition-attack' });
vm.runInContext(escalationSource, sandbox, { filename: 'operational-escalation.js#qa-wave02-route-cut-transition-attack' });
vm.runInContext(presentationSource, sandbox, { filename: 'operational-escalation-presentation.js#qa-wave02-route-cut-transition-attack' });

const run = source => vm.runInContext(source, sandbox);
const snapshot = () => JSON.parse(run('JSON.stringify(state)'));

function assertFreshReset() {
  const state = snapshot();
  assert.equal(state.mode, 'RUNNING');
  assert.equal(state.operational.phase, 'TRIAGE');
  assert.equal(state.operational.fault, null);
  assert.equal(state.operational.surgeResolved, false);
  assert.equal(state.operational.routeCutResolved, false);
  assert.equal(state.elapsed, 0);
  assert.deepEqual(state.beacons.map(beacon => beacon.energy), [34, 0, 0, 0]);
  assert.equal(elements.operationText.textContent, 'TRIAGE');
}

// Outcome A: resolve SURGE at R1, then allow the mandatory one-update RECOVERY seam
// to advance without teleporting the runner. From R1, the R4 crossline link is the
// nearer endpoint, so CROSSLINE should be cut and PRIMARY required.
run(`
  resetGame();
  state.beacons[0].energy = 60;
  state.beacons[1].energy = 34.9;
  state.player.x = state.beacons[1].x;
  state.player.y = state.beacons[1].y;
  state.player.charge = 100;
  update(0.01);
`);
let state = snapshot();
assert.equal(state.operational.phase, 'SURGE');
assert.equal(state.operational.fault.breakerIndex, 0, 'R1 should be the pre-existing SURGE breaker');

run(`
  state.player.x = state.beacons[0].x;
  state.player.y = state.beacons[0].y;
  state.beacons[0].energy = 69.9;
  state.player.charge = 100;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(state.operational.surgeResolved, true);
assert.equal(state.operational.routeCutResolved, false);
assert.equal(state.player.x, state.beacons[0].x, 'SURGE resolution should leave the runner at the servicing R1 endpoint');
assert.equal(state.player.y, state.beacons[0].y, 'SURGE resolution should leave the runner at the servicing R1 endpoint');

run('update(0.01)');
state = snapshot();
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.fault.kind, 'ROUTE_CUT');
assert.equal(state.operational.fault.blockedLocation, 'CROSSLINE');
assert.equal(state.operational.fault.requiredLocation, 'PRIMARY');
assert.equal(elements.operationText.textContent, 'REROUTE');
assert.equal(elements.stateText.textContent, 'USE R4 PRIMARY');

// Resolve the route cut while another relay is still offline. Resolution must return
// to continued RECOVERY play rather than manufacturing terminal completion.
run(`
  state.beacons[2].energy = 20;
  state.player.x = state.beacons[3].x;
  state.player.y = state.beacons[3].y;
  state.player.charge = 100;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(state.operational.routeCutResolved, true);
assert.equal(state.mode, 'RUNNING', 'ROUTE_CUT resolution must continue play while any relay remains offline');
assert.equal(elements.operationText.textContent, 'RECOVERY');
assert.equal(elements.stateText.textContent, 'ROUTE RESTORED');

// Once both incident families have resolved, the ordinary all-online condition may
// complete the run on a later update.
run(`
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  state.player.x = core.x;
  state.player.y = core.y;
  update(0.01);
`);
state = snapshot();
assert.equal(state.mode, 'WON');
assert.equal(state.operational.routeCutResolved, true);
assert.equal(elements.operationText.textContent, 'STABLE');
assert.equal(elements.stateText.textContent, 'NETWORK STABLE');

// Outcome B: resolve SURGE at R4 PRIMARY and again advance the one-update RECOVERY
// seam without moving the runner. PRIMARY is now the nearer/current service endpoint,
// so it must be cut and CROSSLINE required. This proves the inverse outcome from a
// phase-correct live service position instead of injecting the REROUTE target directly.
run(`
  resetGame();
  state.beacons[3].energy = 60;
  state.beacons[1].energy = 34.9;
  state.player.x = state.beacons[1].x;
  state.player.y = state.beacons[1].y;
  state.player.charge = 100;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'SURGE');
assert.equal(state.operational.fault.breakerIndex, 3, 'R4 should be the pre-existing SURGE breaker');

run(`
  state.player.x = state.beacons[3].x;
  state.player.y = state.beacons[3].y;
  state.beacons[3].energy = 69.9;
  state.player.charge = 100;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(state.operational.surgeResolved, true);
assert.equal(state.player.x, state.beacons[3].x, 'SURGE resolution should leave the runner at R4 PRIMARY');
assert.equal(state.player.y, state.beacons[3].y, 'SURGE resolution should leave the runner at R4 PRIMARY');

run('update(0.01)');
state = snapshot();
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.fault.blockedLocation, 'PRIMARY');
assert.equal(state.operational.fault.requiredLocation, 'CROSSLINE');
assert.equal(elements.operationText.textContent, 'REROUTE');
assert.equal(elements.stateText.textContent, 'USE R4 LINK');

// BLACKOUT remains possible during the inverse route-cut outcome, and a normal reset
// must remove every second-incident flag/fault so retry cannot inherit stale topology.
run(`
  state.player.x = 480;
  state.player.y = 100;
  state.player.charge = 0.1;
  update(0.05);
`);
state = snapshot();
assert.equal(state.mode, 'BLACKOUT');
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.routeCutResolved, false);

run('resetGame()');
assertFreshReset();

console.log('qa wave02 route-cut transition attack passed: both live SURGE-resolution endpoints reach distinct ROUTE_CUT outcomes, recovery can continue to terminal, BLACKOUT/retry preserved');
