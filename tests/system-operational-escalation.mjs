import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');
const escalationSource = readFileSync(path.join(root, 'operational-escalation.js'), 'utf8');

function noop() {}
const drawContext = {
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  stroke: noop,
  arc: noop,
  fill: noop,
  fillText: noop,
  clearRect: noop,
  fillRect: noop,
  strokeRect: noop
};

const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  relayDetail: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
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
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
vm.runInContext(escalationSource, sandbox, { filename: 'operational-escalation.js' });

const run = source => vm.runInContext(source, sandbox);
const snapshot = () => JSON.parse(run('JSON.stringify(state)'));
const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};

// Phase 1 is explicit from a normal reset and keeps the founded resource seed.
let state = snapshot();
assert.equal(state.operational.phase, 'TRIAGE');
assert.equal(state.operational.fault, null);
assert.equal(state.operational.surgeResolved, false);
assert.equal(state.operational.routeCutResolved, false);
assert.deepEqual(state.beacons.map(beacon => beacon.energy), [34, 0, 0, 0]);
assert.equal(elements.stateText.textContent, 'TRIAGE — CORE FULL');

// Crossing from one to two online relays creates SURGE_LOAD. R1 was already online
// below 70%, so it becomes the breaker even though R3/R4 are lower-energy offline
// relays. This keeps the first incident distinct from simply visiting the lowest relay.
run(`
  state.beacons[0].energy = 60;
  state.beacons[1].energy = 34.9;
  state.player.x = state.beacons[1].x;
  state.player.y = state.beacons[1].y;
  state.player.charge = 100;
  update(0.01);
`);
state = snapshot();
assert.equal(state.mode, 'RUNNING');
assert.equal(state.operational.phase, 'SURGE');
assert.equal(state.operational.fault.kind, 'SURGE_LOAD');
assert.equal(state.operational.fault.breakerIndex, 0);
assert.equal(state.operational.fault.clearThreshold, 70);
assert.ok(state.beacons[2].energy < state.beacons[0].energy, 'surge breaker should not be the lowest-energy relay');
assert.equal(elements.stateText.textContent, 'SURGE — REINFORCE R1 TO 70%');

// Existing decay, idle drain, and transfer rules remain the underlying economy.
closeTo(state.beacons[0].energy, 59.9748);
closeTo(state.beacons[1].energy, 35.325342);
closeTo(state.player.charge, 99.53);

// The SURGE gate is raw >=70. Player-facing integer projection must stay on the
// same side of that gate: a raw 69.6 breaker cannot say 70% while SURGE still
// requires 70. Existing exact 35%-online and 100%-full boundaries remain intact.
run(`
  state.beacons[0].energy = 69.6;
  state.beacons[1].energy = 35;
  state.beacons[2].energy = 100;
  updateHud();
`);
state = snapshot();
assert.equal(state.operational.phase, 'SURGE');
assert.ok(state.beacons[0].energy < state.operational.fault.clearThreshold);
assert.equal(run('getDisplayedBeaconEnergy(state.beacons[0])'), 69);
assert.equal(run('getDisplayedBeaconEnergy(state.beacons[1])'), 35);
assert.equal(run('getDisplayedBeaconEnergy(state.beacons[2])'), 100);
assert.match(elements.relayDetail.textContent, /R1 69%/);
assert.match(elements.relayDetail.textContent, /R2 35%/);
assert.match(elements.relayDetail.textContent, /R3 100%/);
assert.equal(elements.stateText.textContent, 'SURGE — REINFORCE R1 TO 70%');

// All four relays crossing the old 35% completion threshold does not bypass an
// unresolved surge. The run stays active until the breaker is reinforced.
run(`
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  state.player.x = core.x;
  state.player.y = core.y;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'SURGE');
assert.equal(state.mode, 'RUNNING');

// Reinforcing the designated breaker to >=70 advances into RECOVERY while the
// original transfer verb and resource rules remain in use.
run(`
  state.beacons[0].energy = 71;
  state.beacons[1].energy = 40;
  state.beacons[2].energy = 0;
  state.beacons[3].energy = 0;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(state.operational.surgeResolved, true);
assert.equal(state.operational.routeCutResolved, false);
assert.ok(state.operational.fault.resolvedAt !== null);
assert.equal(state.mode, 'RUNNING');
assert.equal(elements.stateText.textContent, 'RECOVERY — CORE FULL');

// Exact 70 is eligible for ordinary display and clears on the next normal update.
run(`
  resetGame();
  state.operational.phase = OP_ESC_PHASES.SURGE;
  state.operational.fault = {
    kind: 'SURGE_LOAD',
    breakerIndex: 0,
    clearThreshold: 70,
    triggeredAt: state.elapsed,
    resolvedAt: null
  };
  state.beacons[0].energy = 70;
  state.beacons[1].energy = 35;
  update(0);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(state.operational.surgeResolved, true);
assert.equal(run('getDisplayedBeaconEnergy(state.beacons[0])'), 70);
assert.match(elements.relayDetail.textContent, /R1 70%/);

// Wave 02 adds a qualitatively different second incident. Once SURGE has resolved,
// the next live update enters REROUTE and cuts whichever accepted R4 service location
// is currently closer to the runner. At the core the crossline link is closer, so it
// is cut and the player must reroute to the primary R4 beacon.
run(`
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  state.player.x = core.x;
  state.player.y = core.y;
  update(0.01);
`);
state = snapshot();
assert.equal(state.mode, 'RUNNING', 'old all-online completion must wait for the second incident');
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.fault.kind, 'ROUTE_CUT');
assert.equal(state.operational.fault.relayIndex, 3);
assert.equal(state.operational.fault.blockedLocation, 'CROSSLINE');
assert.equal(state.operational.fault.requiredLocation, 'PRIMARY');
assert.equal(elements.stateText.textContent, 'REROUTE — USE R4 PRIMARY');

// The cut service location is mechanically unavailable while the incident is active.
// Reaching it does not transfer into R4 and does not resolve the fault.
const r4EnergyBeforeBlockedService = state.beacons[3].energy;
run(`
  const cutPad = relayServicePads.find(pad => pad.relayIndex === 3);
  state.player.x = cutPad.x;
  state.player.y = cutPad.y;
  state.player.charge = 100;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.routeCutResolved, false);
assert.equal(state.mode, 'RUNNING');
assert.ok(state.beacons[3].energy < r4EnergyBeforeBlockedService, 'blocked crossline service must not transfer into R4');

// Reaching the surviving R4 primary service location resolves the route cut. Because
// all four relays are still online, the same update may then complete NETWORK STABLE.
run(`
  state.player.x = state.beacons[3].x;
  state.player.y = state.beacons[3].y;
  state.player.charge = 100;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(state.operational.routeCutResolved, true);
assert.ok(state.operational.fault.resolvedAt !== null);
assert.equal(state.mode, 'WON');
assert.equal(elements.stateText.textContent, 'NETWORK STABLE');

// The selection policy has at least two reachable route outcomes. If REROUTE begins
// while the runner is at the primary R4 beacon, that primary location is the nearer
// one and is cut instead, forcing the accepted crossline R4 LINK.
run(`
  resetGame();
  state.operational.phase = OP_ESC_PHASES.RECOVERY;
  state.operational.surgeResolved = true;
  state.operational.routeCutResolved = false;
  state.operational.fault = {
    kind: 'SURGE_LOAD',
    breakerIndex: 0,
    clearThreshold: 70,
    triggeredAt: 0,
    resolvedAt: 0
  };
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  state.player.x = state.beacons[3].x;
  state.player.y = state.beacons[3].y;
  update(0);
`);
state = snapshot();
assert.equal(state.mode, 'RUNNING');
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.fault.blockedLocation, 'PRIMARY');
assert.equal(state.operational.fault.requiredLocation, 'CROSSLINE');
assert.equal(elements.stateText.textContent, 'REROUTE — USE R4 LINK');

run(`
  const requiredPad = relayServicePads.find(pad => pad.relayIndex === 3);
  state.player.x = requiredPad.x;
  state.player.y = requiredPad.y;
  update(0);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(state.operational.routeCutResolved, true);
assert.equal(state.mode, 'WON');

// BLACKOUT remains a valid terminal while the second incident is unresolved.
run(`
  resetGame();
  state.operational.phase = OP_ESC_PHASES.REROUTE;
  state.operational.surgeResolved = true;
  state.operational.routeCutResolved = false;
  state.operational.fault = {
    kind: 'ROUTE_CUT',
    relayIndex: 3,
    blockedLocation: OP_ESC_ROUTE_CUT_LOCATIONS.CROSSLINE,
    requiredLocation: OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY,
    triggeredAt: state.elapsed,
    resolvedAt: null
  };
  state.beacons[0].energy = 60;
  state.beacons[1].energy = 40;
  state.player.x = 480;
  state.player.y = 100;
  state.player.charge = 0.1;
  update(0.05);
`);
state = snapshot();
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.routeCutResolved, false);
assert.equal(state.mode, 'BLACKOUT');

// Retry returns the complete two-incident operational state to the reproducible seed.
run('resetGame()');
state = snapshot();
assert.equal(state.mode, 'RUNNING');
assert.equal(state.operational.phase, 'TRIAGE');
assert.equal(state.operational.fault, null);
assert.equal(state.operational.surgeResolved, false);
assert.equal(state.operational.routeCutResolved, false);
assert.equal(state.elapsed, 0);
assert.deepEqual(state.beacons.map(beacon => beacon.energy), [34, 0, 0, 0]);

console.log('systems operational escalation passed: TRIAGE -> SURGE_LOAD -> RECOVERY -> ROUTE_CUT/REROUTE -> RECOVERY -> WON, two route outcomes, BLACKOUT and reset preserved');
