import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

function noop() {}
const drawContext = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) target[prop] = noop;
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});
const windowHandlers = new Map();
const documentHandlers = new Map();
const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};

let pads = [];
let visibilityState = 'visible';
const documentStub = {
  getElementById: id => elements[id],
  hasFocus: () => true,
  get visibilityState() { return visibilityState; },
  addEventListener(type, handler) {
    const list = documentHandlers.get(type) ?? [];
    list.push(handler);
    documentHandlers.set(type, list);
  }
};
const sandbox = {
  document: documentStub,
  window: {
    addEventListener(type, handler) {
      const list = windowHandlers.get(type) ?? [];
      list.push(handler);
      windowHandlers.set(type, list);
    }
  },
  navigator: { getGamepads: () => pads },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
const run = source => vm.runInContext(source, sandbox);
const dispatchWindow = type => (windowHandlers.get(type) ?? []).forEach(handler => handler({ type }));
const dispatchDocument = type => (documentHandlers.get(type) ?? []).forEach(handler => handler({ type }));

const makePad = ({ movement = false } = {}) => ({
  connected: true,
  mapping: 'standard',
  index: 0,
  axes: movement ? [0.8, 0] : [0, 0],
  buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
});

assert.equal(elements.stateText.textContent, 'CORE FULL', 'active fresh run should retain normal status');

dispatchWindow('blur');
assert.equal(elements.stateText.textContent, 'PAUSED — RETURN TO GAME', 'focus loss should immediately expose the paused simulation state');

pads = [makePad({ movement: true })];
dispatchWindow('focus');
assert.equal(elements.stateText.textContent, 'RELEASE TO MOVE', 'focus return with held movement should hand status priority to neutral-release recovery');

pads = [makePad({ movement: false })];
run('update(0.01);');
assert.equal(elements.stateText.textContent, 'CORE FULL', 'neutral recovery should return to the normal status hierarchy');

pads = [makePad({ movement: true })];
run('resetForCurrentMovementIntent();');
assert.equal(elements.stateText.textContent, 'RELEASE TO MOVE', 'retry with held controller movement should start in release recovery');
pads = [];
visibilityState = 'hidden';
dispatchDocument('visibilitychange');
assert.equal(elements.stateText.textContent, 'PAUSED — RETURN TO GAME', 'hidden visibility should override recovery text while active simulation is paused');

visibilityState = 'visible';
dispatchDocument('visibilitychange');
assert.equal(elements.stateText.textContent, 'RECONNECT CONTROLLER', 'returning visible with the retry-owning controller absent should restore reconnect recovery');

pads = [makePad({ movement: false })];
run('update(0.01);');
assert.equal(elements.stateText.textContent, 'CORE FULL', 'observed neutral controller after resume should restore normal status');

run("state.mode = 'BLACKOUT'; updateHud();");
dispatchWindow('blur');
assert.equal(elements.stateText.textContent, 'BLACKOUT', 'terminal state should remain more important than an inactive-focus pause label');

console.log('experience focus-pause feedback passed: inactive focus/visibility pause, resume recovery priority, reconnect continuity, normal recovery, terminal precedence');
