import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');
const htmlSource = readFileSync(path.join(root, 'index.html'), 'utf8');

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
  let value = '';
  return {
    textWrites: 0,
    get textContent() { return value; },
    set textContent(next) { value = String(next); this.textWrites += 1; },
    addEventListener() {}
  };
}

const elements = {
  game: { width: 960, height: 600, getContext: () => ctx },
  chargeText: makeElement(), relayText: makeElement(), relayDetail: makeElement(), stateText: makeElement(), restartButton: makeElement()
};
const context = vm.createContext({
  document: { getElementById: id => elements[id] },
  window: { addEventListener() {} }, performance: { now: () => 0 }, requestAnimationFrame() {}, Math, Set, console
});
vm.runInContext(gameSource, context, { filename: 'game.js' });
const run = expression => vm.runInContext(expression, context);

assert.doesNotMatch(htmlSource, /<section\b[^>]*class=["']status["'][^>]*aria-live=/i, 'rapidly changing charge/relay values should not make the whole status strip a live region');
assert.match(htmlSource, /<strong\b(?=[^>]*\bid=["']stateText["'])(?=[^>]*\brole=["']status["'])(?=[^>]*\baria-atomic=["']true["'])[^>]*>/i, 'the concise state label should own the polite status announcement surface');
assert.match(htmlSource, /<p\b(?=[^>]*\bid=["']relayDetail["'])(?=[^>]*\bclass=["'][^"']*sr-only[^"']*["'])[^>]*>/i, 'individual relay state should have a non-visual accessible text surface');
assert.doesNotMatch(htmlSource, /<p\b(?=[^>]*\bid=["']relayDetail["'])[^>]*(?:aria-live|role=["']status["'])/i, 'rapid relay decay should not become an automatic live-announcement stream');
assert.match(htmlSource, /<canvas\b(?=[^>]*\bid=["']game["'])(?=[^>]*\baria-describedby=["']relayDetail["'])[^>]*>/i, 'the canvas should reference the non-visual relay-state description');

pathCalls.length = 0;
run('drawGrid();');
const horizontalGridYs = [];
for (let i = 0; i < pathCalls.length - 1; i += 1) {
  const move = pathCalls[i];
  const line = pathCalls[i + 1];
  if (move[0] === 'moveTo' && move[1] === 0 && line[0] === 'lineTo' && line[1] === 960 && move[2] === line[2]) {
    horizontalGridYs.push(move[2]);
  }
}
const expectedGridYs = Array.from({ length: Math.floor(600 / 48) + 1 }, (_, index) => index * 48);
assert.deepEqual(horizontalGridYs, expectedGridYs, 'grid rows should remain horizontal instead of fanning diagonally toward the lower-right corner');

assert.equal(elements.stateText.textContent, 'CORE FULL', 'fresh run should identify the full core state');
assert.equal(elements.relayDetail.textContent, 'Relay status: R1 34%, R2 0%, R3 0%, R4 0%', 'fresh run should expose individual relay state non-visually');
const initialWrites = { charge: elements.chargeText.textWrites, relay: elements.relayText.textWrites, detail: elements.relayDetail.textWrites, state: elements.stateText.textWrites };
run('updateHud(); updateHud();');
assert.deepEqual({ charge: elements.chargeText.textWrites, relay: elements.relayText.textWrites, detail: elements.relayDetail.textWrites, state: elements.stateText.textWrites }, initialWrites, 'unchanged HUD values should not be rewritten into accessibility surfaces');

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
assert.ok(
  pathCalls.some(([name, x, y, radius]) => name === 'arc' && x === 145 && y === 125 && radius > 40),
  'active transfer should surround the target relay with a visible outer halo'
);

// Bridge the accepted QA triage-consequence snapshot to the actual player-facing relay cues.
// This proves the proposal can expose that accepted decision state without hidden debug text;
// it does not prove that a human will interpret the urgency correctly.
textCalls.length = 0;
run(`
  state.mode = 'RUNNING';
  state.player.x = core.x;
  state.player.y = core.y;
  state.player.charge = 100;
  [28.36, 53.71, 0, 56.15].forEach((energy, index) => { state.beacons[index].energy = energy; });
  updateHud();
  state.beacons.forEach(drawBeacon);
`);
assert.equal(elements.relayText.textContent, '2 / 4', 'accepted triage snapshot should report two relays online');
assert.equal(elements.stateText.textContent, 'CORE FULL', 'accepted triage snapshot should preserve the centered full-core state');
assert.equal(elements.relayDetail.textContent, 'Relay status: R1 28%, R2 54%, R3 0%, R4 56%', 'accepted triage snapshot should expose each relay value non-visually');
for (const expected of ['R1', '28%', 'R2', '54%', 'R3', '0%', 'R4', '56%']) {
  assert.ok(textCalls.some(([text]) => text === expected), `accepted triage snapshot should expose ${expected}`);
}

run(`
  state.beacons.forEach(beacon => { beacon.energy = 0; });
  state.beacons[0].energy = 34.99;
  updateHud();
`);
assert.match(elements.relayDetail.textContent, /R1 34%/, 'offline threshold-adjacent relay should remain below 35% in the non-visual summary');
assert.doesNotMatch(elements.relayDetail.textContent, /R1 35%/, 'non-visual relay detail must not contradict the online threshold');
run('state.beacons[0].energy = 35; updateHud();');
assert.match(elements.relayDetail.textContent, /R1 35%/, 'exactly-online relay should expose 35% in the non-visual summary');

run('state.player.x = 480; state.player.y = 200; state.player.charge = 20; updateHud();');
assert.equal(elements.stateText.textContent, 'LOW CHARGE', 'low carried charge should be explicit away from interactions');
run('state.player.x = core.x; state.player.y = core.y; state.player.charge = 55; updateHud();');
assert.equal(elements.stateText.textContent, 'RECHARGING', 'partial charge at the core should be explicit');
run("state.mode = 'WON'; updateHud();");
assert.equal(elements.stateText.textContent, 'NETWORK STABLE', 'terminal success status should match the visible NETWORK STABLE overlay');
run("state.mode = 'BLACKOUT'; updateHud();");
assert.equal(elements.stateText.textContent, 'BLACKOUT', 'terminal BLACKOUT state should remain explicit');

console.log('experience feedback passed: orthogonal grid, scoped live status, stable HUD writes, truthful non-visual relay detail, core/recharge/low-charge/transfer/terminal status, relay numeric cue, transfer tether + target halo, accepted triage snapshot cues');
