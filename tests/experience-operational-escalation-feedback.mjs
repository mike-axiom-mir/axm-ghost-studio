import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const indexSource = readFileSync(path.join(root, 'index.html'), 'utf8');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');
const escalationSource = readFileSync(path.join(root, 'operational-escalation.js'), 'utf8');
const presentationSource = readFileSync(path.join(root, 'operational-escalation-presentation.js'), 'utf8');

// The visible Operation slot is dynamic run-state feedback, not decorative text.
// Preserve a polite atomic live-region contract so phase changes are exposed to
// assistive technology without turning every resource tick into an announcement.
assert.match(indexSource, /id="operationCard"[^>]*role="status"/);
assert.match(indexSource, /id="operationCard"[^>]*aria-live="polite"/);
assert.match(indexSource, /id="operationCard"[^>]*aria-atomic="true"/);

const drawLog = [];
const noop = () => {};
const drawContext = {
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  stroke: noop,
  arc: noop,
  fill: noop,
  clearRect: noop,
  fillRect: noop,
  strokeRect: (...args) => drawLog.push({ kind: 'strokeRect', args }),
  fillText: (text, ...args) => drawLog.push({ kind: 'fillText', text, args })
};

const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  relayDetail: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop },
  operationCard: { dataset: { phase: 'TRIAGE' } },
  operationText: { textContent: 'TRIAGE' }
};

const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => [] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
vm.runInContext(escalationSource, sandbox, { filename: 'operational-escalation.js' });
vm.runInContext(presentationSource, sandbox, { filename: 'operational-escalation-presentation.js' });

const run = source => vm.runInContext(source, sandbox);
const snapshot = () => JSON.parse(run('JSON.stringify(state)'));

// The run phase has its own information slot from the start. The existing Status
// surface stays focused on the immediate player action instead of repeating TRIAGE.
assert.equal(elements.operationText.textContent, 'TRIAGE');
assert.equal(elements.operationCard.dataset.phase, 'TRIAGE');
assert.equal(elements.stateText.textContent, 'CORE FULL');

// Enter SURGE using the Systems contract. The operation slot changes textually and
// the immediate Status surface becomes the action instruction without duplicating
// the phase name.
run(`
  state.beacons[0].energy = 60;
  state.beacons[1].energy = 34.9;
  state.player.x = state.beacons[1].x;
  state.player.y = state.beacons[1].y;
  state.player.charge = 100;
  update(0.01);
`);
let state = snapshot();
assert.equal(state.operational.phase, 'SURGE');
assert.equal(elements.operationText.textContent, 'SURGE');
assert.equal(elements.operationCard.dataset.phase, 'SURGE');
assert.equal(elements.stateText.textContent, 'REINFORCE R1 TO 70%');

// Preserve the Systems/QA numeric-truth boundary in the composed Experience surface:
// the current breaker value stays below 70 while the separate marker names 70 as a
// target, not as the relay's current reading.
run(`
  state.beacons[0].energy = 69.6;
  updateHud();
`);
assert.match(elements.relayDetail.textContent, /R1 69%/);
assert.equal(elements.stateText.textContent, 'REINFORCE R1 TO 70%');

drawLog.length = 0;
run('render()');
assert.ok(drawLog.some(entry => entry.kind === 'fillText' && entry.text === 'TARGET 70%'));
assert.equal(drawLog.filter(entry => entry.kind === 'strokeRect').length, 3, 'two bulkheads plus one R1 surge marker should be drawn');

// R4 has two accepted service locations: its primary beacon and the crossline R4 LINK.
// If R4 is the breaker, both mechanically valid service locations must carry the same
// SURGE target affordance so the presentation does not imply that the alternate route
// became inactive.
run(`
  state.operational.phase = OP_ESC_PHASES.SURGE;
  state.operational.fault = {
    kind: 'SURGE_LOAD',
    breakerIndex: 3,
    clearThreshold: 70,
    triggeredAt: state.elapsed,
    resolvedAt: null
  };
  state.beacons[3].energy = 60;
  updateHud();
`);
const r4ServicePad = JSON.parse(run('JSON.stringify(relayServicePads[0])'));
const r4Beacon = JSON.parse(run('JSON.stringify(state.beacons[3])'));
drawLog.length = 0;
run('render()');
const r4TargetLabels = drawLog.filter(entry => entry.kind === 'fillText' && entry.text === 'TARGET 70%');
assert.equal(r4TargetLabels.length, 2, 'R4 SURGE should mark both the beacon and accepted crossline service link');
assert.ok(r4TargetLabels.some(entry => entry.args[0] === r4Beacon.x), 'R4 primary beacon should remain marked as a valid SURGE service location');
assert.ok(r4TargetLabels.some(entry => entry.args[0] === r4ServicePad.x), 'R4 crossline service link should also be marked as a valid SURGE service location');
assert.ok(drawLog.some(entry => entry.kind === 'fillText' && entry.text === 'R4 LINK'), 'accepted R4 LINK identity should remain visible');
assert.equal(drawLog.filter(entry => entry.kind === 'strokeRect').length, 4, 'two bulkheads plus two R4 surge target markers should be drawn');

// Resolving the surge advances the dedicated phase surface while Status returns to
// the immediate interaction language rather than repeating RECOVERY.
run(`
  state.beacons[0].energy = 60;
  state.beacons[1].energy = 40;
  state.beacons[2].energy = 0;
  state.beacons[3].energy = 71;
  update(0.01);
`);
state = snapshot();
assert.equal(state.operational.phase, 'RECOVERY');
assert.equal(elements.operationText.textContent, 'RECOVERY');
assert.equal(elements.operationCard.dataset.phase, 'RECOVERY');
assert.equal(elements.stateText.textContent, 'TRANSFER R2');

// Terminal success receives a distinct resolution label in addition to the existing
// NETWORK STABLE overlay. This is a presentation extension, not a new win rule.
run(`
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  update(0.01);
`);
state = snapshot();
assert.equal(state.mode, 'WON');
assert.equal(elements.operationText.textContent, 'STABLE');
assert.equal(elements.operationCard.dataset.phase, 'STABLE');
assert.equal(elements.stateText.textContent, 'NETWORK STABLE');

drawLog.length = 0;
run('render()');
assert.ok(drawLog.some(entry => entry.kind === 'fillText' && entry.text === 'NETWORK STABLE'));
assert.ok(drawLog.some(entry => entry.kind === 'fillText' && entry.text === 'OPERATIONAL ESCALATION CLEARED'));

console.log('experience operational escalation feedback passed: live phase semantics, separate phase/action surfaces, target-truth cues at every accepted service location, and stronger completion label');
