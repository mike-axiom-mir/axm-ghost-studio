import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

const pathCalls = [];
const ctx = {
  beginPath() { pathCalls.push(['beginPath']); },
  moveTo(x, y) { pathCalls.push(['moveTo', x, y]); },
  lineTo(x, y) { pathCalls.push(['lineTo', x, y]); },
  arc(x, y, radius, start, end) { pathCalls.push(['arc', x, y, radius, start, end]); },
  stroke() { pathCalls.push(['stroke']); },
  fill() { pathCalls.push(['fill']); },
  fillRect() {},
  clearRect() {},
  fillText() {},
  strokeRect() {},
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
  relayDetail: makeElement(),
  stateText: makeElement(),
  restartButton: makeElement()
};

const motionPreference = { matches: false };
let observedMediaQuery = null;
const context = vm.createContext({
  document: { getElementById: id => elements[id] },
  window: {
    addEventListener() {},
    matchMedia(query) {
      observedMediaQuery = query;
      return motionPreference;
    }
  },
  performance: { now: () => 0 },
  requestAnimationFrame() {},
  Math,
  Set,
  console
});
vm.runInContext(gameSource, context, { filename: 'game.js' });
const run = expression => vm.runInContext(expression, context);

assert.equal(observedMediaQuery, '(prefers-reduced-motion: reduce)', 'canvas feedback should honor the operating-system reduced-motion preference');

run('state.elapsed = 0.25;');
motionPreference.matches = false;
pathCalls.length = 0;
run('drawCore();');
const animatedCoreRadius = pathCalls.find(([name]) => name === 'arc')?.[3];
assert.notEqual(animatedCoreRadius, 50, 'normal motion should retain the core pulse');

motionPreference.matches = true;
pathCalls.length = 0;
run('drawCore();');
const reducedCoreRadius = pathCalls.find(([name]) => name === 'arc')?.[3];
assert.equal(reducedCoreRadius, 50, 'reduced motion should freeze the core halo at its stable base radius');

run(`
  state.mode = 'RUNNING';
  state.elapsed = 0.25;
  state.player.x = 145;
  state.player.y = 125;
  state.player.charge = 80;
  state.beacons[0].energy = 20;
`);

motionPreference.matches = false;
pathCalls.length = 0;
run('drawTransferFeedback();');
const animatedTransferRadii = pathCalls.filter(([name]) => name === 'arc').map(call => call[3]);
assert.equal(animatedTransferRadii.length, 2, 'active transfer should keep both transfer feedback rings');
assert.notDeepEqual(animatedTransferRadii, [4, 43], 'normal motion should retain transfer pulse animation');

motionPreference.matches = true;
pathCalls.length = 0;
run('drawTransferFeedback();');
const reducedTransferRadii = pathCalls.filter(([name]) => name === 'arc').map(call => call[3]);
assert.deepEqual(reducedTransferRadii, [4, 43], 'reduced motion should freeze transfer pulses while keeping the tether and rings present');
assert.ok(pathCalls.some(([name]) => name === 'lineTo'), 'reduced motion should preserve the transfer tether as a non-pulsing state cue');

console.log('experience reduced-motion passed: OS preference freezes decorative core/transfer pulses while preserving transfer state cues');
