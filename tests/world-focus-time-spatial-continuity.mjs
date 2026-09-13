import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const noop = () => {};
const ctx = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) target[prop] = noop;
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

const elements = new Map([
  ['game', { width: 960, height: 600, getContext: () => ctx }],
  ['chargeText', { textContent: '' }],
  ['relayText', { textContent: '' }],
  ['stateText', { textContent: '' }],
  ['restartButton', { addEventListener: noop }]
]);

let clock = 0;
const sandbox = {
  console,
  Math,
  navigator: { getGamepads: () => [] },
  performance: { now: () => clock },
  requestAnimationFrame: noop,
  document: {
    getElementById: id => elements.get(id),
    hasFocus: () => true,
    visibilityState: 'visible',
    addEventListener: noop
  },
  window: { addEventListener: noop }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(
  `${source}\n;globalThis.__worldTiming = { get state(){ return state; }, keys, frame, resetGame, core, beaconSeed, getTransferTarget };`,
  sandbox,
  { filename: 'game.js' }
);

const run = expression => vm.runInContext(expression, sandbox);

function resetAt(x, y, beaconEnergy = 34) {
  clock = 0;
  run('resetGame(); keys.clear();');
  run(`state.player.x = ${x}; state.player.y = ${y}; state.player.charge = 100; state.beacons[0].energy = ${beaconEnergy};`);
}

function advanceWithHeldKey(key, totalMs, cadenceMs) {
  run(`keys.clear(); keys.add('${key}');`);
  let advanced = 0;
  while (advanced < totalMs) {
    const step = Math.min(cadenceMs, totalMs - advanced);
    advanced += step;
    clock = advanced;
    run(`frame(${clock})`);
  }
  run('keys.clear();');
}

function blockedLeftScenario(cadenceMs) {
  resetAt(480, 300);
  advanceWithHeldKey('a', 1000, cadenceMs);
  return { x: run('state.player.x'), elapsed: run('state.elapsed') };
}

function upperPassageScenario(cadenceMs) {
  resetAt(480, 145);
  advanceWithHeldKey('a', 1000, cadenceMs);
  return { x: run('state.player.x'), elapsed: run('state.elapsed') };
}

function relayContactScenario(cadenceMs) {
  resetAt(190, 125, 10);
  advanceWithHeldKey('a', 100, cadenceMs);
  return {
    x: run('state.player.x'),
    elapsed: run('state.elapsed'),
    relayEnergy: run('state.beacons[0].energy'),
    playerCharge: run('state.player.charge'),
    transferIndex: run('state.beacons.indexOf(getTransferTarget())')
  };
}

const ordinaryBlocked = blockedLeftScenario(20);
const slowBlocked = blockedLeftScenario(100);
const wallContactBoundary = 300 + 42 + 13;
assert.ok(ordinaryBlocked.x >= wallContactBoundary, 'ordinary cadence must not cross the left bulkhead');
assert.ok(slowBlocked.x >= wallContactBoundary, 'slow focused cadence must not tunnel through the left bulkhead');
assert.ok(
  Math.abs(ordinaryBlocked.x - slowBlocked.x) <= 12,
  'slow-cadence blocked position should stay within one bounded simulation step of ordinary cadence'
);
assert.ok(Math.abs(ordinaryBlocked.elapsed - 1) < 1e-9, 'ordinary cadence should preserve one focused second');
assert.ok(Math.abs(slowBlocked.elapsed - 1) < 1e-9, 'slow cadence should preserve one focused second');

const ordinaryPassage = upperPassageScenario(20);
const slowPassage = upperPassageScenario(100);
assert.ok(ordinaryPassage.x < 300, 'ordinary cadence should traverse the open upper passage');
assert.ok(slowPassage.x < 300, 'slow focused cadence should preserve the open upper passage');
assert.ok(
  Math.abs(ordinaryPassage.x - slowPassage.x) < 1e-9,
  'open-passage travel distance should remain cadence-equivalent for the same focused second'
);
assert.ok(Math.abs(slowPassage.x - 245) < 1e-9, 'one focused second at accepted speed should move 235 px through open space');

const ordinaryContact = relayContactScenario(20);
const slowContact = relayContactScenario(100);
assert.equal(ordinaryContact.transferIndex, 0, 'ordinary cadence should enter R1 transfer range');
assert.equal(slowContact.transferIndex, 0, 'slow focused cadence should not skip R1 transfer range');
assert.ok(ordinaryContact.relayEnergy > 10, 'ordinary cadence should service R1 after contact');
assert.ok(slowContact.relayEnergy > 10, 'slow focused cadence should service R1 after contact');
assert.ok(
  Math.abs(ordinaryContact.x - slowContact.x) < 1e-9,
  'near-relay arrival position should remain cadence-equivalent over the same focused 100 ms'
);
assert.ok(
  Math.abs(ordinaryContact.relayEnergy - slowContact.relayEnergy) < 1e-9,
  'relay service amount should remain cadence-equivalent when contact exists throughout the bounded substeps'
);
assert.ok(
  Math.abs(ordinaryContact.playerCharge - slowContact.playerCharge) < 1e-9,
  'route/service charge consequence should remain cadence-equivalent in the representative contact window'
);

console.log(
  `world focus-time spatial continuity passed: blocked=${ordinaryBlocked.x.toFixed(2)}/${slowBlocked.x.toFixed(2)}, ` +
  `upper=${ordinaryPassage.x.toFixed(2)}/${slowPassage.x.toFixed(2)}, ` +
  `R1=${ordinaryContact.relayEnergy.toFixed(3)}/${slowContact.relayEnergy.toFixed(3)}`
);
