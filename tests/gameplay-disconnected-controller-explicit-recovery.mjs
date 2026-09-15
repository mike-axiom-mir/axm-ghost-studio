import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const noop = () => {};

function createHarness() {
  const context2d = new Proxy({}, {
    get(target, prop) {
      if (!(prop in target)) target[prop] = noop;
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });

  let restartClick = noop;
  const windowListeners = new Map();
  const elements = {
    game: { width: 960, height: 600, getContext: () => context2d },
    chargeText: { textContent: '' },
    relayText: { textContent: '' },
    relayDetail: { textContent: '' },
    stateText: { textContent: '' },
    restartButton: {
      addEventListener(type, handler) {
        if (type === 'click') restartClick = handler;
      }
    }
  };

  const pad0 = {
    index: 0,
    connected: true,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
  };
  const pad1 = {
    index: 1,
    connected: false,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
  };

  const sandbox = {
    document: {
      getElementById: id => elements[id],
      hasFocus: () => true,
      visibilityState: 'visible',
      addEventListener: noop
    },
    window: {
      addEventListener(type, handler) {
        windowListeners.set(type, handler);
      },
      matchMedia: () => ({ matches: false })
    },
    navigator: {
      getGamepads: () => [pad0.connected ? pad0 : null, pad1.connected ? pad1 : null]
    },
    performance: { now: () => 0 },
    requestAnimationFrame: noop,
    Math,
    Set,
    console
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__gameplayRecovery = { get state(){ return state; }, update, resetForCurrentMovementIntent, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get gamepadNeutralPendingIndex(){ return gamepadNeutralPendingIndex; } };`, sandbox);

  return {
    game: sandbox.__gameplayRecovery,
    elements,
    pad0,
    pad1,
    restart: () => restartClick(),
    keydown: windowListeners.get('keydown')
  };
}

function establishUnavailableControllerObligation(harness) {
  const { game, elements, pad0, restart } = harness;
  pad0.connected = true;
  pad0.axes = [1, 0];
  game.state.mode = 'BLACKOUT';
  restart();
  assert.equal(game.state.mode, 'RUNNING');
  assert.equal(game.movementArmed, false);
  assert.equal(game.gamepadNeutralPending, true);
  assert.equal(game.gamepadNeutralPendingIndex, 0);

  pad0.connected = false;
  game.update(0.05);
  assert.equal(elements.stateText.textContent, 'RECONNECT CONTROLLER');
  assert.equal(game.state.player.x, 480);
}

// A generic/internal retry must preserve the accepted safety contract: disappearance
// alone is not treated as a neutral edge.
{
  const harness = createHarness();
  establishUnavailableControllerObligation(harness);
  harness.game.resetForCurrentMovementIntent();
  assert.equal(harness.game.gamepadNeutralPending, true);
  assert.equal(harness.game.gamepadNeutralPendingIndex, 0);
  assert.equal(harness.game.movementArmed, false);
  assert.equal(harness.elements.stateText.textContent, 'RECONNECT CONTROLLER');
}

// A deliberate fresh keyboard R recovery may retire only the unreachable old-pad
// obligation, then fresh keyboard movement must be usable without reconnecting it.
{
  const harness = createHarness();
  establishUnavailableControllerObligation(harness);
  harness.keydown({ key: 'r', repeat: false, preventDefault: noop });
  assert.equal(harness.game.state.mode, 'RUNNING');
  assert.equal(harness.game.gamepadNeutralPending, false);
  assert.equal(harness.game.gamepadNeutralPendingIndex, null);
  assert.equal(harness.game.movementArmed, true);

  harness.keydown({ key: 'ArrowRight', repeat: false, preventDefault: noop });
  harness.game.update(0.05);
  assert.equal(harness.game.state.player.x, 491.75);
}

// The existing on-screen Restart surface has parity with keyboard R for the same
// explicit recovery action.
{
  const harness = createHarness();
  establishUnavailableControllerObligation(harness);
  harness.restart();
  assert.equal(harness.game.state.mode, 'RUNNING');
  assert.equal(harness.game.gamepadNeutralPending, false);
  assert.equal(harness.game.gamepadNeutralPendingIndex, null);
  assert.equal(harness.game.movementArmed, true);

  harness.keydown({ key: 'ArrowRight', repeat: false, preventDefault: noop });
  harness.game.update(0.05);
  assert.equal(harness.game.state.player.x, 491.75);
}

// If another available controller is already held, explicit non-gamepad recovery
// transfers the neutral obligation to that present input instead of enabling
// surprise movement.
{
  const harness = createHarness();
  establishUnavailableControllerObligation(harness);
  harness.pad1.connected = true;
  harness.pad1.axes = [1, 0];
  harness.game.update(0.05);
  assert.equal(harness.game.gamepadNeutralPendingIndex, 0);
  assert.equal(harness.game.state.player.x, 480);

  harness.keydown({ key: 'r', repeat: false, preventDefault: noop });
  assert.equal(harness.game.gamepadNeutralPending, true);
  assert.equal(harness.game.gamepadNeutralPendingIndex, 1);
  assert.equal(harness.game.movementArmed, false);
  harness.game.update(0.05);
  assert.equal(harness.game.state.player.x, 480);

  harness.pad1.axes = [0, 0];
  harness.game.update(0.01);
  assert.equal(harness.game.gamepadNeutralPending, false);
  assert.equal(harness.game.movementArmed, true);

  harness.pad1.axes = [1, 0];
  harness.game.update(0.05);
  assert.equal(harness.game.state.player.x, 491.75);
}

console.log('gameplay disconnected-controller explicit recovery passed: generic retry preserves unavailable-pad safety; keyboard R and Restart recover; held replacement pad inherits neutral obligation');
