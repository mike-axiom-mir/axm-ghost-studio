import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

function makeElement() {
  return {
    textContent: '',
    addEventListener() {}
  };
}

const ctx = {
  beginPath() {}, moveTo() {}, lineTo() {}, arc() {}, stroke() {}, fill() {},
  fillRect() {}, clearRect() {}, fillText() {}, strokeRect() {},
  strokeStyle: '', fillStyle: '', lineWidth: 1, font: '', textAlign: 'start'
};
const elements = {
  game: { width: 960, height: 600, getContext: () => ctx },
  chargeText: makeElement(), relayText: makeElement(), stateText: makeElement(), restartButton: makeElement()
};

let pads = [];
const context = vm.createContext({
  document: { getElementById: id => elements[id], hasFocus: () => true },
  window: { addEventListener() {} },
  navigator: { getGamepads: () => pads },
  performance: { now: () => 0 },
  requestAnimationFrame() {}, Math, Set, console
});
vm.runInContext(gameSource, context, { filename: 'game.js' });
const run = expression => vm.runInContext(expression, context);

const makePad = ({ movement = false } = {}) => ({
  connected: true,
  mapping: 'standard',
  index: 0,
  axes: movement ? [0.8, 0] : [0, 0],
  buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
});

assert.equal(elements.stateText.textContent, 'CORE FULL', 'fresh run should retain ordinary core status');

run("keys.add('d'); resetForCurrentMovementIntent();");
assert.equal(elements.stateText.textContent, 'RELEASE TO MOVE', 'held keyboard movement across retry should explain the neutral-release requirement');
assert.equal(run('movementArmed'), false, 'held keyboard retry should remain movement-disarmed');
run("keys.delete('d'); update(0.01);");
assert.equal(elements.stateText.textContent, 'CORE FULL', 'neutral keyboard input should restore ordinary status');
assert.equal(run('movementArmed'), true, 'neutral keyboard input should re-arm movement');

pads = [makePad({ movement: true })];
run('resetForCurrentMovementIntent();');
assert.equal(elements.stateText.textContent, 'RELEASE TO MOVE', 'held gamepad movement across retry should request neutral input');
assert.equal(run('gamepadNeutralPending'), true, 'held gamepad retry should remember the pending controller-neutral requirement');

pads = [];
const elapsedBeforeDisconnectWait = run('state.elapsed');
run('update(0.01);');
assert.equal(elements.stateText.textContent, 'RECONNECT CONTROLLER', 'an absent retry-owning controller should request reconnection instead of release');
assert.equal(run('movementArmed'), false, 'controller absence must not counterfeit a neutral movement edge');
assert.ok(run('state.elapsed') > elapsedBeforeDisconnectWait, 'the accepted retry-neutral wait should continue simulation while movement remains suppressed');

run('resetForCurrentMovementIntent();');
assert.equal(elements.stateText.textContent, 'RECONNECT CONTROLLER', 'repeating retry while the pending controller is absent should preserve the reconnect cue');
assert.equal(run('movementArmed'), false, 'repeating retry while the controller is absent must keep movement disarmed');
assert.equal(run('gamepadNeutralPending'), true, 'repeating retry must preserve the pending controller-neutral requirement');

pads = [makePad({ movement: true })];
run('update(0.01);');
assert.equal(elements.stateText.textContent, 'RELEASE TO MOVE', 'reconnecting while still held should switch from reconnect guidance to the neutral-release cue');
assert.equal(run('movementArmed'), false, 'reconnect-held movement must remain disarmed until a neutral observation');

pads = [makePad({ movement: false })];
run('update(0.01);');
assert.equal(elements.stateText.textContent, 'CORE FULL', 'observed neutral controller input should restore ordinary status');
assert.equal(run('movementArmed'), true, 'observed neutral controller input should re-arm movement');

run('resetGame();');
pads = [makePad({ movement: true })];
run('guardFocusedGamepadCarryover(); updateHud();');
assert.equal(elements.stateText.textContent, 'RELEASE TO MOVE', 'held gamepad movement on focus return should use the same neutral-release cue');

pads = [makePad({ movement: false })];
run('update(0.01);');
assert.equal(elements.stateText.textContent, 'CORE FULL', 'neutral input after focus return should resume the normal status hierarchy');

console.log('experience retry-neutral feedback passed: keyboard release cue, gamepad release cue, disconnected-controller reconnect cue, repeated-retry reconnect guidance, reconnect-held release cue, neutral recovery, focus-return carryover cue');
