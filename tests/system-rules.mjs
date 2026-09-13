import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

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
  fillRect: noop
};

const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
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

const run = source => vm.runInContext(source, sandbox);
const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};
const snapshot = () => JSON.parse(run('JSON.stringify(state)'));

// Founding state is explicit and reproducible.
assert.deepEqual(snapshot().beacons.map(beacon => beacon.energy), [34, 0, 0, 0]);
assert.equal(snapshot().player.charge, 100);
assert.equal(snapshot().mode, 'RUNNING');

// At the core, runner charge replenishes while relay leakage scales with stored energy.
run('state.player.charge = 50; update(1)');
let state = snapshot();
assert.equal(state.player.charge, 100);
closeTo(state.beacons[0].energy, 32.572);

// Away from the core and standing still, charge drains at the founded idle rate.
run('resetGame(); state.player.x = 480; state.player.y = 100; update(1)');
state = snapshot();
closeTo(state.player.charge, 97);

// Touching an empty relay applies decay first, then bounded transfer, while off-core idle drain still applies.
run('resetGame(); state.player.x = state.beacons[1].x; state.player.y = state.beacons[1].y; update(1)');
state = snapshot();
closeTo(state.beacons[1].energy, 44);
closeTo(state.player.charge, 53);

// Four relays above the online threshold resolve the run as a win.
run(`
  resetGame();
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  state.player.x = state.beacons[3].x;
  state.player.y = state.beacons[3].y;
  update(0.05);
`);
state = snapshot();
assert.equal(state.mode, 'WON');

// Exhausting carried charge away from the core resolves the run as a blackout.
run(`
  resetGame();
  state.player.x = 480;
  state.player.y = 100;
  state.player.charge = 0.1;
  update(0.05);
`);
state = snapshot();
assert.equal(state.mode, 'BLACKOUT');

// Terminal states freeze system progression until an explicit reset.
const terminalElapsed = state.elapsed;
const terminalEnergy = state.beacons[0].energy;
run('update(1)');
state = snapshot();
assert.equal(state.elapsed, terminalElapsed);
assert.equal(state.beacons[0].energy, terminalEnergy);
run('resetGame()');
state = snapshot();
assert.equal(state.mode, 'RUNNING');
assert.equal(state.elapsed, 0);
assert.deepEqual(state.beacons.map(beacon => beacon.energy), [34, 0, 0, 0]);

// Completion takes precedence when the final successful transfer both brings the last relay online
// and exhausts the runner's remaining carried charge in the same update.
run(`
  resetGame();
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  state.beacons[3].energy = 34.9;
  state.player.x = state.beacons[3].x;
  state.player.y = state.beacons[3].y;
  state.player.charge = 0.3;
  update(0.01);
`);
state = snapshot();
assert.ok(state.beacons.every(beacon => beacon.energy >= 35), 'all relays should be online in the tie scenario');
assert.equal(state.player.charge, 0);
assert.equal(state.mode, 'WON');

console.log('systems rules passed: reset, recharge, proportional decay, idle drain, transfer, win, blackout, terminal freeze, completion precedence');
