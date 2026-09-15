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
  { x: 800, y: 300 },
  'Operational Escalation crossline target R4 must stay in the right-side midline service position'
);
assert.equal(r4.y, core.y, 'R4 should sit on the core crossline so neither upper nor lower passage is the obvious geometric answer');
assert.ok(r4.x > bulkheads[1].x + bulkheads[1].w, 'R4 must remain beyond the right bulkhead in the service side');
assert.equal(positionBlocked(639, 300, 13), true, 'the direct core-to-R4 line must remain blocked by the right bulkhead');

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

assert.ok(Number.isFinite(coreToR4), 'crossline R4 must remain reachable from the core');
assert.ok(coreToR4 > 400 && coreToR4 < 420, `crossline R4 should be a material but bounded service route, measured ${coreToR4}`);
assert.ok(Number.isFinite(r4Upper) && Number.isFinite(r4Lower), 'both passage classes must provide a route to crossline R4');
assert.ok(Math.abs(r4Upper - r4Lower) <= 1, `crossline R4 should preserve a genuine upper/lower route choice: ${r4Upper} vs ${r4Lower}`);
assert.ok(r2Upper + 150 < r2Lower, `R2 should remain distinctly upper-biased, measured ${r2Upper} vs ${r2Lower}`);

console.log(
  `world operational escalation crossline relay passed: core->R4 ${coreToR4.toFixed(1)}, ` +
  `R4 upper/lower ${r4Upper.toFixed(1)}/${r4Lower.toFixed(1)}, ` +
  `R2 upper/lower ${r2Upper.toFixed(1)}/${r2Lower.toFixed(1)}`
);
