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

// Enter the proposed SURGE state with R1 as the designated breaker.
run(`
  state.beacons[0].energy = 60;
  state.beacons[1].energy = 34.9;
  state.player.x = state.beacons[1].x;
  state.player.y = state.beacons[1].y;
  state.player.charge = 100;
  update(0.01);
`);

let state = snapshot();
assert.equal(state.operational.phase, 'SURGE');
assert.equal(state.operational.fault.breakerIndex, 0);
assert.equal(state.operational.fault.clearThreshold, 70);

// The new mechanic uses raw >=70 as the clear gate. A sub-threshold value must
// therefore not be presented as 70%, or the HUD says the target is satisfied
// while the phase remains blocked waiting for that same target.
run(`
  state.beacons[0].energy = 69.6;
  updateHud();
`);
state = snapshot();
assert.ok(state.beacons[0].energy < state.operational.fault.clearThreshold);
assert.equal(elements.stateText.textContent, 'SURGE — REINFORCE R1 TO 70%');
assert.match(
  elements.relayDetail.textContent,
  /R1 69%/,
  `sub-threshold surge breaker must not display 70%: ${elements.relayDetail.textContent}`
);

// Exact threshold remains eligible to display 70 and resolves the surge on the
// next normal update.
run(`
  state.beacons[0].energy = 70;
  update(0);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.match(elements.relayDetail.textContent, /R1 70%/);

console.log('qa surge threshold truth passed: sub-70 breaker cannot display 70%, exact 70 resolves to RECOVERY');
