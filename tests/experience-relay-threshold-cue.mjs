import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

const textCalls = [];
const ctx = {
  beginPath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  stroke() {},
  fill() {},
  fillRect() {},
  clearRect() {},
  fillText(text) { textCalls.push(String(text)); },
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start'
};

function makeElement() {
  let value = '';
  return {
    get textContent() { return value; },
    set textContent(next) { value = String(next); },
    addEventListener() {}
  };
}

const elements = {
  game: { width: 960, height: 600, getContext: () => ctx },
  chargeText: makeElement(),
  relayText: makeElement(),
  stateText: makeElement(),
  restartButton: makeElement()
};

const context = vm.createContext({
  document: { getElementById: id => elements[id] },
  window: { addEventListener() {} },
  performance: { now: () => 0 },
  requestAnimationFrame() {},
  Math,
  Set,
  console
});

vm.runInContext(gameSource, context, { filename: 'game.js' });
const run = expression => vm.runInContext(expression, context);

function drawRelayAt(energy) {
  textCalls.length = 0;
  run(`
    state.mode = 'RUNNING';
    state.beacons.forEach(beacon => { beacon.energy = 0; });
    state.beacons[0].energy = ${energy};
    updateHud();
    drawBeacon(state.beacons[0], 0);
  `);
  return [...textCalls];
}

const justOffline = drawRelayAt(34.99);
assert.equal(elements.relayText.textContent, '0 / 4', '34.99 energy must remain mechanically offline');
assert.ok(justOffline.includes('34%'), 'offline threshold-adjacent relay should display a value below the 35% online threshold');
assert.ok(!justOffline.includes('35%'), 'offline relay must not display the online threshold value');

const exactlyOnline = drawRelayAt(35);
assert.equal(elements.relayText.textContent, '1 / 4', '35 energy must be mechanically online');
assert.ok(exactlyOnline.includes('35%'), 'relay at the online threshold should display 35%');

console.log('experience relay threshold cue passed: 34.99 is offline/34%, 35.00 is online/35%');