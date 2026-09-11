import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

const textCalls = [];
const pathCalls = [];
const ctx = {
  beginPath() { pathCalls.push(['beginPath']); },
  moveTo(x, y) { pathCalls.push(['moveTo', x, y]); },
  lineTo(x, y) { pathCalls.push(['lineTo', x, y]); },
  arc(x, y, r, start, end) { pathCalls.push(['arc', x, y, r, start, end]); },
  stroke() { pathCalls.push(['stroke']); },
  fill() { pathCalls.push(['fill']); },
  fillRect() {},
  clearRect() {},
  fillText(text, x, y) { textCalls.push([String(text), x, y]); },
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start'
};

function makeElement() {
  return {
    textContent: '',
    addEventListener() {}
  };
}

const elements = {
  game: {
    width: 960,
    height: 600,
    getContext: () => ctx
  },
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

assert.equal(elements.stateText.textContent, 'CORE FULL', 'fresh run should identify the full core state');

run('state.player.x = 145; state.player.y = 125; state.player.charge = 80; state.beacons[0].energy = 20; updateHud();');
assert.equal(elements.stateText.textContent, 'TRANSFER R1', 'relay contact should identify the transfer target');

textCalls.length = 0;
run('drawBeacon(state.beacons[0], 0);');
assert.ok(textCalls.some(([text]) => text === 'R1'), 'relay render should retain relay identity');
assert.ok(textCalls.some(([text]) => text === '20%'), 'relay render should expose a numeric energy cue');

pathCalls.length = 0;
run('drawTransferFeedback();');
assert.ok(pathCalls.some(([name]) => name === 'lineTo'), 'active transfer should render a runner-to-relay tether');
assert.ok(pathCalls.some(([name]) => name === 'arc'), 'active transfer should render a pulse marker');

run('state.player.x = 480; state.player.y = 200; state.player.charge = 20; updateHud();');
assert.equal(elements.stateText.textContent, 'LOW CHARGE', 'low carried charge should be explicit away from interactions');

run('state.player.x = core.x; state.player.y = core.y; state.player.charge = 55; updateHud();');
assert.equal(elements.stateText.textContent, 'RECHARGING', 'partial charge at the core should be explicit');

run("state.mode = 'WON'; updateHud();");
assert.equal(elements.stateText.textContent, 'WON', 'terminal WON state should remain explicit');
run("state.mode = 'BLACKOUT'; updateHud();");
assert.equal(elements.stateText.textContent, 'BLACKOUT', 'terminal BLACKOUT state should remain explicit');

console.log('experience feedback passed: core/recharge/low-charge/transfer/terminal status, relay numeric cue, transfer tether');
