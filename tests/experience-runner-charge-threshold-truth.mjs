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
  state.player.x = core.x + core.r + state.player.r + 10;
  state.player.y = core.y;
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
  state.mode = 'RUNNING';
  state.player.charge = 0.1511;
  update(0.05);
`);
assert.equal(run('state.mode'), 'RUNNING', 'charge just above the depletion threshold after drain should remain nonterminal');
assert.equal(run('state.player.charge > PLAYER_BLACKOUT_CHARGE_THRESHOLD'), true, 'nonterminal residual charge must remain above the shared depletion threshold');
assert.equal(elements.stateText.textContent, 'LOW CHARGE', 'nonterminal residual charge should remain LOW CHARGE');
assert.equal(elements.chargeText.textContent, '1%', 'nonterminal residual charge above the depletion threshold must not look empty');

run(`
  state.mode = 'RUNNING';
  state.player.charge = 0.1505;
  update(0.05);
`);
assert.equal(run('state.mode'), 'BLACKOUT', 'charge at or below the depletion threshold after drain should resolve to BLACKOUT');
assert.equal(run('state.player.charge <= PLAYER_BLACKOUT_CHARGE_THRESHOLD'), true, 'terminal residual charge must be at or below the shared depletion threshold');
assert.equal(elements.stateText.textContent, 'BLACKOUT', 'terminal depletion should remain explicit in Status');
assert.equal(elements.chargeText.textContent, '0%', 'BLACKOUT from depletion must not coexist with a positive displayed charge');

run(`
  state.mode = 'RUNNING';
  state.player.charge = 42.4;
  updateHud();
`);
assert.equal(elements.chargeText.textContent, '42%', 'ordinary non-threshold charge should retain nearest-integer display behavior');

run(`
  state.mode = 'RUNNING';
  state.player.x = core.x;
  state.player.y = core.y;
  state.player.charge = 99.6;
  updateHud();
`);
assert.equal(elements.stateText.textContent, 'RECHARGING', 'charge below actual full capacity must not report CORE FULL');
assert.equal(elements.chargeText.textContent, '99%', 'charge below actual full capacity must not round up to displayed 100%');

run('update(0.01);');
assert.equal(run('state.player.charge'), 100, 'core recharge should still reach and cap at actual full capacity');
assert.equal(elements.stateText.textContent, 'CORE FULL', 'actual full capacity should report CORE FULL');
assert.equal(elements.chargeText.textContent, '100%', 'actual full capacity should display 100%');

console.log('experience runner charge threshold truth passed: integer charge stays on the truthful side of low-charge, depletion, and full-charge state boundaries');
