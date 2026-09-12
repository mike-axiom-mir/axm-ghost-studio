import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

function noop() {}
const drawContext = { beginPath: noop, moveTo: noop, lineTo: noop, stroke: noop, arc: noop, fill: noop, fillText: noop, clearRect: noop, fillRect: noop };
const handlers = {};
const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' }, relayText: { textContent: '' }, stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};
const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: (type, handler) => { handlers[type] = handler; } },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
const run = source => vm.runInContext(source, sandbox);
const keyEvent = key => ({ key, preventDefault: noop });

handlers.keydown(keyEvent('d'));
run('update(0.1)');
assert.equal(run('state.player.x'), 503.5);
handlers.keyup(keyEvent('d'));
run("state.mode = 'BLACKOUT'; state.player.x = 700");
handlers.keydown(keyEvent('r'));
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
handlers.keyup(keyEvent('r'));
run('update(0.01)');
assert.ok(run('state.elapsed') > 0);

console.log('gameplay keyboard fallback passed: movement and retry remain usable without navigator/Gamepad API');
