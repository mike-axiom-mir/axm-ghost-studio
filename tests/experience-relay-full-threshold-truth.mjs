import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

const noop = () => {};
const ctx = {
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  arc: noop,
  stroke: noop,
  fill: noop,
  fillRect: noop,
  clearRect: noop,
  fillText: noop,
  strokeRect: noop,
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start'
};

function makeElement() {
  return { textContent: '', addEventListener: noop };
}

const elements = {
  game: { width: 960, height: 600, getContext: () => ctx },
  chargeText: makeElement(),
  relayText: makeElement(),
  relayDetail: makeElement(),
  stateText: makeElement(),
  restartButton: makeElement()
};

const context = vm.createContext({
  document: {
    getElementById: id => elements[id],
    addEventListener: noop
  },
  window: { addEventListener: noop },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  Math,
  Set,
  console
});
vm.runInContext(gameSource, context, { filename: 'game.js' });
const run = expression => vm.runInContext(expression, context);

run(`
  state.mode = 'RUNNING';
  state.player.x = state.beacons[0].x;
  state.player.y = state.beacons[0].y;
  state.player.charge = 50;
  state.beacons[0].energy = 99.6;
  updateHud();
`);
assert.equal(elements.stateText.textContent, 'TRANSFER R1', 'a relay below 100 energy should remain an active transfer target');
assert.equal(run('getDisplayedBeaconEnergy(state.beacons[0])'), 99, 'a transfer-eligible relay below 100 must not display the completed 100% value');
assert.match(elements.relayDetail.textContent, /R1 99%/, 'the nonvisual relay summary should remain below 100% while transfer is still possible');

run(`
  state.beacons[0].energy = 100;
  updateHud();
`);
assert.equal(run('getTransferTarget()'), null, 'an exactly full relay should no longer be an active transfer target');
assert.equal(run('getDisplayedBeaconEnergy(state.beacons[0])'), 100, 'an exactly full relay should display 100%');
assert.match(elements.relayDetail.textContent, /R1 100%/, 'the nonvisual relay summary should expose exact completion as 100%');

run(`
  state.beacons[0].energy = 98.4;
  updateHud();
`);
assert.equal(run('getDisplayedBeaconEnergy(state.beacons[0])'), 98, 'ordinary non-threshold relay energy should retain nearest-integer display behavior');

console.log('experience relay full-threshold truth passed: transfer-eligible relays stay below displayed 100% until exact completion');
