import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');

const noop = () => {};
const ctx = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) target[prop] = noop;
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

const elements = new Map([
  ['game', { width: 960, height: 600, getContext: () => ctx }],
  ['chargeText', { textContent: '' }],
  ['relayText', { textContent: '' }],
  ['relayDetail', { textContent: '' }],
  ['stateText', { textContent: '' }],
  ['restartButton', { addEventListener: noop }]
]);

const sandbox = {
  console,
  Math,
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  document: { getElementById: id => elements.get(id) },
  window: { addEventListener: noop }
};
vm.createContext(sandbox);
vm.runInContext(
  `${source}\n;globalThis.__world = { core, beaconSeed, relayServicePads, bulkheads, positionBlocked, playerTouchesRelayService, update, getStatusLabel, state };`,
  sandbox
);

const { core, beaconSeed, relayServicePads, bulkheads, positionBlocked } = sandbox.__world;
const r1 = beaconSeed[0];
const r2 = beaconSeed[1];
const r4 = beaconSeed[3];
const pad = relayServicePads[0];

assert.deepEqual(
  JSON.parse(JSON.stringify(beaconSeed)),
  [
    { x: 145, y: 125 },
    { x: 815, y: 125 },
    { x: 145, y: 475 },
    { x: 815, y: 475 }
  ],
  'Operational Escalation must preserve the accepted four relay anchors'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(pad)),
  { relayIndex: 3, x: 720, y: 300, r: 20 },
  'R4 crossline service link must remain at the bounded right-side service position'
);
assert.ok(pad.x > bulkheads[1].x + bulkheads[1].w, 'R4 service link must remain beyond the right bulkhead');
assert.equal(positionBlocked(pad.x, pad.y, pad.r), false, 'R4 service link itself must remain in reachable player space');
assert.equal(positionBlocked(639, 300, 13), true, 'the direct core-to-link crossline must remain blocked by the right bulkhead');

const STEP = 5;
const RADIUS = 13;
const WIDTH = 960;
const HEIGHT = 600;
const RELAY_CONTACT = RADIUS + 29;
const PAD_CONTACT = RADIUS + pad.r;
const directions = [
  [STEP, 0, STEP], [-STEP, 0, STEP], [0, STEP, STEP], [0, -STEP, STEP],
  [STEP, STEP, STEP * Math.SQRT2], [STEP, -STEP, STEP * Math.SQRT2],
  [-STEP, STEP, STEP * Math.SQRT2], [-STEP, -STEP, STEP * Math.SQRT2]
];
const key = (x, y) => `${x},${y}`;

function shortestDistance(start, goal, goalRadius) {
  const frontier = [{ x: start.x, y: start.y, cost: 0 }];
  const best = new Map([[key(start.x, start.y), 0]]);

  while (frontier.length) {
    let bestIndex = 0;
    for (let i = 1; i < frontier.length; i += 1) {
      if (frontier[i].cost < frontier[bestIndex].cost) bestIndex = i;
    }
    const current = frontier.splice(bestIndex, 1)[0];
    if (current.cost !== best.get(key(current.x, current.y))) continue;
    if (Math.hypot(current.x - goal.x, current.y - goal.y) <= goalRadius) return current.cost;

    for (const [dx, dy, edgeCost] of directions) {
      const x = current.x + dx;
      const y = current.y + dy;
      if (x < RADIUS || x > WIDTH - RADIUS || y < RADIUS || y > HEIGHT - RADIUS) continue;
      if (positionBlocked(x, y, RADIUS)) continue;
      const nextCost = current.cost + edgeCost;
      const k = key(x, y);
      if (nextCost + 1e-9 >= (best.get(k) ?? Infinity)) continue;
      best.set(k, nextCost);
      frontier.push({ x, y, cost: nextCost });
    }
  }

  return Infinity;
}

const coreToPad = shortestDistance(core, pad, PAD_CONTACT);
const coreToR4 = shortestDistance(core, r4, RELAY_CONTACT);
const r2ToPad = shortestDistance(r2, pad, PAD_CONTACT);
const r2ToR4 = shortestDistance(r2, r4, RELAY_CONTACT);
const r1ToPad = shortestDistance(r1, pad, PAD_CONTACT);
const r1ToR4 = shortestDistance(r1, r4, RELAY_CONTACT);

assert.ok(coreToPad > 380 && coreToPad < 395, `core -> R4 link should be a bounded crossline route, measured ${coreToPad}`);
assert.ok(Math.abs(coreToPad - coreToR4) < 25, 'the link must not trivialize R4 from the core');
assert.ok(r2ToPad + 100 < r2ToR4, `after upper-right R2, the crossline link should materially shorten R4 service: ${r2ToPad} vs ${r2ToR4}`);
assert.ok(r1ToPad + 80 < r1ToR4, `from upper-left R1, the link should create a distinct crossline alternative: ${r1ToPad} vs ${r1ToR4}`);

const state = sandbox.__world.state;
state.player.x = pad.x;
state.player.y = pad.y;
state.player.charge = 100;
state.beacons.forEach(beacon => { beacon.energy = 0; });
const before = state.beacons[3].energy;
sandbox.__world.update(0.1);
const after = state.beacons[3].energy;
assert.ok(after > before + 4.3, `touching the R4 service link must transfer existing relay charge, measured ${before} -> ${after}`);
assert.equal(state.beacons[0].energy, 0, 'R4 link must not transfer into another relay');
assert.equal(state.beacons[1].energy, 0, 'R4 link must not transfer into another relay');
assert.equal(state.beacons[2].energy, 0, 'R4 link must not transfer into another relay');
assert.equal(sandbox.__world.getStatusLabel(), 'TRANSFER R4', 'existing transfer feedback must truthfully identify the linked relay');

console.log(
  `world operational escalation R4 service link passed: core link/main ${coreToPad.toFixed(1)}/${coreToR4.toFixed(1)}, ` +
  `R2 link/main ${r2ToPad.toFixed(1)}/${r2ToR4.toFixed(1)}, ` +
  `R1 link/main ${r1ToPad.toFixed(1)}/${r1ToR4.toFixed(1)}, ` +
  `R4 transfer ${before.toFixed(1)} -> ${after.toFixed(1)}`
);
