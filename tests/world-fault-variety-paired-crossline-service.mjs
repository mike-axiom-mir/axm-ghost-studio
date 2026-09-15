import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const gameSource = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const worldSource = fs.readFileSync(new URL('../world-route-service-topology.js', import.meta.url), 'utf8');

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
  `${gameSource}\n${worldSource}\n;globalThis.__world = { core, beaconSeed, relayServicePads, worldFaultVarietyServicePads, bulkheads, positionBlocked, update, getStatusLabel, state };`,
  sandbox
);

const {
  core,
  beaconSeed,
  relayServicePads,
  worldFaultVarietyServicePads,
  bulkheads,
  positionBlocked
} = sandbox.__world;
const r1 = beaconSeed[0];
const r2 = beaconSeed[1];
const r3 = beaconSeed[2];
const r4 = beaconSeed[3];
const r1Link = relayServicePads.find(pad => pad.relayIndex === 0);
const r4Link = relayServicePads.find(pad => pad.relayIndex === 3);

assert.deepEqual(
  JSON.parse(JSON.stringify(worldFaultVarietyServicePads)),
  [{ relayIndex: 0, x: 240, y: 300, r: 20 }],
  'Wave 02 World layer should add exactly one bounded R1 crossline service location'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(r1Link)),
  { relayIndex: 0, x: 240, y: 300, r: 20 },
  'R1 crossline service location must stay at the bounded left-side position'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(r4Link)),
  { relayIndex: 3, x: 720, y: 300, r: 20 },
  'accepted R4 crossline service location must remain unchanged'
);
assert.ok(r1Link.x + r1Link.r < bulkheads[0].x, 'R1 link must remain outside the left bulkhead');
assert.equal(positionBlocked(r1Link.x, r1Link.y, r1Link.r), false, 'R1 link itself must remain in reachable player space');
assert.equal(positionBlocked(321, 300, 13), true, 'direct core-to-R1-link crossline must remain blocked by the left bulkhead');

const STEP = 5;
const RADIUS = 13;
const WIDTH = 960;
const HEIGHT = 600;
const RELAY_CONTACT = RADIUS + 29;
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

const r1PadContact = RADIUS + r1Link.r;
const r4PadContact = RADIUS + r4Link.r;
const coreToR1Link = shortestDistance(core, r1Link, r1PadContact);
const coreToR1 = shortestDistance(core, r1, RELAY_CONTACT);
const r3ToR1Link = shortestDistance(r3, r1Link, r1PadContact);
const r3ToR1 = shortestDistance(r3, r1, RELAY_CONTACT);
const r2ToR4Link = shortestDistance(r2, r4Link, r4PadContact);
const r2ToR4 = shortestDistance(r2, r4, RELAY_CONTACT);

assert.ok(coreToR1Link > 380 && coreToR1Link < 395, `core -> R1 link should remain a bounded crossline route, measured ${coreToR1Link}`);
assert.ok(Math.abs(coreToR1Link - coreToR1) < 25, 'R1 link must not trivialize R1 from the core');
assert.ok(r3ToR1Link + 100 < r3ToR1, `after lower-left R3, the R1 link should materially shorten R1 service: ${r3ToR1Link} vs ${r3ToR1}`);
assert.ok(r2ToR4Link + 100 < r2ToR4, `after upper-right R2, the accepted R4 link should remain a materially shorter R4 service route: ${r2ToR4Link} vs ${r2ToR4}`);

const state = sandbox.__world.state;
state.player.x = r1Link.x;
state.player.y = r1Link.y;
state.player.charge = 100;
state.beacons.forEach(beacon => { beacon.energy = 0; });
const before = state.beacons[0].energy;
sandbox.__world.update(0.1);
const after = state.beacons[0].energy;
assert.ok(after > before + 4.3, `touching the R1 service link must use existing transfer behavior, measured ${before} -> ${after}`);
assert.equal(state.beacons[1].energy, 0, 'R1 link must not transfer into R2');
assert.equal(state.beacons[2].energy, 0, 'R1 link must not transfer into R3');
assert.equal(state.beacons[3].energy, 0, 'R1 link must not transfer into R4');
assert.equal(sandbox.__world.getStatusLabel(), 'TRANSFER R1', 'existing transfer feedback must truthfully identify the linked relay');

console.log(
  `world fault-variety paired crossline service passed: core R1 link/main ${coreToR1Link.toFixed(1)}/${coreToR1.toFixed(1)}, ` +
  `R3 R1 link/main ${r3ToR1Link.toFixed(1)}/${r3ToR1.toFixed(1)}, ` +
  `R2 R4 link/main ${r2ToR4Link.toFixed(1)}/${r2ToR4.toFixed(1)}, ` +
  `R1 transfer ${before.toFixed(1)} -> ${after.toFixed(1)}`
);
