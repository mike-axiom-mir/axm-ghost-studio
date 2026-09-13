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

function makeHarness() {
  const windowHandlers = new Map();
  const documentHandlers = new Map();
  let focused = true;
  let visibilityState = 'visible';
  let now = 0;

  const elements = {
    game: { width: 960, height: 600, getContext: () => drawContext },
    chargeText: { textContent: '' },
    relayText: { textContent: '' },
    stateText: { textContent: '' },
    restartButton: { addEventListener: noop }
  };

  const addHandler = (map, type, handler) => {
    const list = map.get(type) ?? [];
    list.push(handler);
    map.set(type, list);
  };

  const sandbox = {
    document: {
      getElementById: id => elements[id],
      hasFocus: () => focused,
      get visibilityState() { return visibilityState; },
      get hidden() { return visibilityState !== 'visible'; },
      addEventListener(type, handler) { addHandler(documentHandlers, type, handler); }
    },
    window: {
      addEventListener(type, handler) { addHandler(windowHandlers, type, handler); }
    },
    navigator: { getGamepads: () => [] },
    performance: { now: () => now },
    requestAnimationFrame: noop,
    cancelAnimationFrame: noop,
    console
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${gameSource}\n;globalThis.__qaFocusTime = { get state(){ return state; }, frame };`, sandbox, { filename: 'game.js' });

  const run = source => vm.runInContext(source, sandbox);
  const dispatch = (map, type, event = {}) => {
    for (const handler of map.get(type) ?? []) handler(event);
  };

  return {
    run,
    setNow(value) { now = value; },
    blur() {
      focused = false;
      dispatch(windowHandlers, 'blur');
    },
    focus() {
      focused = true;
      dispatch(windowHandlers, 'focus');
    },
    hide() {
      visibilityState = 'hidden';
      dispatch(documentHandlers, 'visibilitychange');
    },
    show() {
      visibilityState = 'visible';
      dispatch(documentHandlers, 'visibilitychange');
    }
  };
}

function closeTo(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

// Director contract: a long unfocused window gap is an explicit pause, not a
// partially simulated RUNNING interval and not a catch-up burst on return.
{
  const h = makeHarness();
  h.setNow(0);
  h.blur();
  h.setNow(10_000);
  h.run('frame(10000)');
  closeTo(h.run('state.elapsed'), 0);
  closeTo(h.run('state.beacons[0].energy'), 34);

  h.focus();
  h.setNow(10_010);
  h.run('frame(10010)');
  assert.ok(h.run('state.elapsed') <= 0.02, 'focus return must not catch up the lost unfocused wall-clock gap');
}

// Visibility loss is independently part of the accepted focus/time contract;
// a hidden page must not progress merely because no window blur was observed.
{
  const h = makeHarness();
  h.setNow(0);
  h.hide();
  h.setNow(10_000);
  h.run('frame(10000)');
  closeTo(h.run('state.elapsed'), 0);
  closeTo(h.run('state.beacons[0].energy'), 34);

  h.show();
  h.setNow(10_010);
  h.run('frame(10010)');
  assert.ok(h.run('state.elapsed') <= 0.02, 'visibility return must not catch up hidden wall-clock time');
}

// While focused, repeated 100 ms render intervals represent one full second of
// active play. The maintenance clock must not silently collapse to 0.5 s just
// because the renderer is sustaining 10 FPS.
{
  const h = makeHarness();
  for (let frame = 1; frame <= 10; frame += 1) {
    const timestamp = frame * 100;
    h.setNow(timestamp);
    h.run(`frame(${timestamp})`);
  }
  closeTo(h.run('state.elapsed'), 1.0, 0.01);
}

console.log('QA focus/time contract passed: unfocused and hidden gaps pause without catch-up, while repeated focused 100ms frames preserve active simulation time');
