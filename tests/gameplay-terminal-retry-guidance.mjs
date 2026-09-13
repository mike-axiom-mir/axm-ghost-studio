import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');
const indexSource = readFileSync(path.join(root, 'index.html'), 'utf8');

function noop() {}
const drawnText = [];
const drawContext = {
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  stroke: noop,
  arc: noop,
  fill: noop,
  clearRect: noop,
  fillRect: noop,
  strokeRect: noop,
  fillText: text => drawnText.push(text)
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
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible',
    addEventListener: noop
  },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => [] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};

vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
const run = source => vm.runInContext(source, sandbox);
const expectedRetryGuidance = 'Press R, Restart, or gamepad Start to run the chamber again';

assert.match(indexSource, /Retry:\s*R, Restart, or gamepad Start/);
assert.match(gameSource, /pad\.buttons\?\.\[9\]\?\.pressed/);

for (const terminalMode of ['WON', 'BLACKOUT']) {
  drawnText.length = 0;
  run(`state.mode = '${terminalMode}'; drawOverlay()`);
  assert.ok(
    drawnText.includes(expectedRetryGuidance),
    `${terminalMode} overlay must expose gamepad Start alongside R and Restart`
  );
}

console.log('gameplay terminal retry guidance passed: WON and BLACKOUT overlays expose every accepted retry control, including gamepad Start');
