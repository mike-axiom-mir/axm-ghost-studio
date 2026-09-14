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
  state.player.x = 480;
  state.player.y = 200;
  state.player.charge = 25.49;
  updateHud();
`);
assert.equal(elements.stateText.textContent, 'ROUTING', 'charge above the low-charge threshold must remain outside LOW CHARGE');
assert.equal(elements.chargeText.textContent, '26%', 'charge above the 25 threshold must not round down to a displayed 25%');

run(`
  state.player.charge = 25;
  updateHud();
`);
assert.equal(elements.stateText.textContent, 'LOW CHARGE', 'exactly 25 charge should enter LOW CHARGE');
assert.equal(elements.chargeText.textContent, '25%', 'exactly 25 charge should remain displayed as 25%');

run(`
  state.player.charge = 0.49;
  updateHud();
`);
assert.equal(elements.stateText.textContent, 'LOW CHARGE', 'positive sub-one charge should remain LOW CHARGE before terminal depletion');
assert.equal(elements.chargeText.textContent, '1%', 'positive runner charge must not round down to a displayed 0%');

run(`
  state.player.charge = 42.4;
  updateHud();
`);
assert.equal(elements.chargeText.textContent, '42%', 'ordinary non-threshold charge should retain nearest-integer display behavior');

console.log('experience runner charge threshold truth passed: displayed integer charge cannot cross the low-charge or zero boundary before runtime state does');
