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
vm.runInContext(`${source}\n;globalThis.__world = { core, beaconSeed, bulkheads, positionBlocked };`, sandbox);

const { core, beaconSeed, bulkheads, positionBlocked } = sandbox.__world;
const r2 = beaconSeed[1];
const r4 = beaconSeed[3];

assert.deepEqual(
  JSON.parse(JSON.stringify(r4)),
  { x: 815, y: 425 },
  'Operational Escalation R4 must stay in the bounded right-side crossline-offset service position'
);
assert.ok(r4.y > core.y && r4.y < 450, 'R4 should move off the lower corner while remaining lower-side readable');
assert.ok(r4.x > bulkheads[1].x + bulkheads[1].w, 'R4 must remain beyond the right bulkhead in the service side');
assert.equal(positionBlocked(639, 359, 13), true, 'the direct core-to-R4 diagonal must remain blocked by the right bulkhead');

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

function shortestDistance(start, goal, goalRadius = RELAY_CONTACT) {
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

function routeVia(start, waypoint, goal) {
  const toWaypoint = shortestDistance(start, waypoint, 0);
  const toGoal = shortestDistance(waypoint, goal, RELAY_CONTACT);
  return toWaypoint + toGoal;
}

const upperPassage = { x: 680, y: 145 };
const lowerPassage = { x: 680, y: 455 };
const coreToR4 = shortestDistance(core, r4);
const r4Upper = routeVia(core, upperPassage, r4);
const r4Lower = routeVia(core, lowerPassage, r4);
const r2Upper = routeVia(core, upperPassage, r2);
const r2Lower = routeVia(core, lowerPassage, r2);
const r4AlternatePenalty = Math.abs(r4Upper - r4Lower);
const r2AlternatePenalty = Math.abs(r2Upper - r2Lower);

assert.ok(Number.isFinite(coreToR4), 'crossline-offset R4 must remain reachable from the core');
assert.ok(coreToR4 > 360 && coreToR4 < 380, `R4 should remain within the accepted service-distance envelope, measured ${coreToR4}`);
assert.ok(Number.isFinite(r4Upper) && Number.isFinite(r4Lower), 'both passage classes must provide a route to crossline-offset R4');
assert.ok(r4Lower < r4Upper, `R4 should keep a lower-route advantage, measured ${r4Lower} vs ${r4Upper}`);
assert.ok(r4AlternatePenalty < 200, `R4 alternate-passage penalty should be reduced below 200, measured ${r4AlternatePenalty}`);
assert.ok(r2Upper < r2Lower, `R2 should remain upper-biased, measured ${r2Upper} vs ${r2Lower}`);
assert.ok(r2AlternatePenalty > 220, `R2 should retain a strong corridor preference, penalty ${r2AlternatePenalty}`);
assert.ok(r4AlternatePenalty < r2AlternatePenalty * 0.85, 'R4 should be measurably less corridor-locked than R2');

console.log(
  `world operational escalation crossline relay passed: core->R4 ${coreToR4.toFixed(1)}, ` +
  `R4 upper/lower ${r4Upper.toFixed(1)}/${r4Lower.toFixed(1)} (penalty ${r4AlternatePenalty.toFixed(1)}), ` +
  `R2 upper/lower ${r2Upper.toFixed(1)}/${r2Lower.toFixed(1)} (penalty ${r2AlternatePenalty.toFixed(1)})`
);
