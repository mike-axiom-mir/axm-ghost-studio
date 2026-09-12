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
vm.runInContext(`${source}\n;globalThis.__world = { core, beaconSeed, bulkheads, positionBlocked, movePlayer };`, sandbox);

const { core, beaconSeed, bulkheads, positionBlocked, movePlayer } = sandbox.__world;
assert.equal(bulkheads.length, 2, 'world slice should retain exactly two bounded route blockers');
assert.deepEqual(
  JSON.parse(JSON.stringify(bulkheads)),
  [
    { x: 300, y: 170, w: 42, h: 260 },
    { x: 618, y: 170, w: 42, h: 260 }
  ],
  'bulkhead geometry drifted'
);

assert.equal(positionBlocked(321, 300, 13), true, 'left bulkhead center must block the runner');
assert.equal(positionBlocked(639, 300, 13), true, 'right bulkhead center must block the runner');
assert.equal(positionBlocked(321, 145, 13), false, 'upper passage must remain open');
assert.equal(positionBlocked(321, 455, 13), false, 'lower passage must remain open');

const blockedRunner = { x: core.x, y: core.y, r: 13 };
for (let i = 0; i < 20; i++) movePlayer(blockedRunner, -10, 0);
assert.equal(blockedRunner.x, 360, 'frame-sized direct left movement must stop at the left bulkhead');

const upperRunner = { x: core.x, y: 145, r: 13 };
for (let i = 0; i < 20; i++) movePlayer(upperRunner, -10, 0);
assert.equal(upperRunner.x, 280, 'upper passage should allow traversal beyond the left bulkhead');

const STEP = 5;
const RADIUS = 13;
const WIDTH = 960;
const HEIGHT = 600;
const directions = [
  [STEP, 0, STEP], [-STEP, 0, STEP], [0, STEP, STEP], [0, -STEP, STEP],
  [STEP, STEP, STEP * Math.SQRT2], [STEP, -STEP, STEP * Math.SQRT2],
  [-STEP, STEP, STEP * Math.SQRT2], [-STEP, -STEP, STEP * Math.SQRT2]
];
const key = (x, y) => `${x},${y}`;

function shortestDistance(start, goal) {
  const frontier = [{ x: start.x, y: start.y, cost: 0 }];
  const best = new Map([[key(start.x, start.y), 0]]);

  while (frontier.length) {
    let bestIndex = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (frontier[i].cost < frontier[bestIndex].cost) bestIndex = i;
    }
    const current = frontier.splice(bestIndex, 1)[0];
    if (current.cost !== best.get(key(current.x, current.y))) continue;

    if (Math.hypot(current.x - goal.x, current.y - goal.y) <= RADIUS + 29) return current.cost;

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

const coreDistances = beaconSeed.map(beacon => shortestDistance(core, beacon));
for (const [index, distance] of coreDistances.entries()) {
  assert.ok(Number.isFinite(distance), `relay R${index + 1} must remain reachable from the core`);
  assert.ok(distance < 420, `relay R${index + 1} core route unexpectedly exceeded bounded diagnostic range`);
}

const sameSide = shortestDistance(beaconSeed[0], beaconSeed[2]);
const crossTop = shortestDistance(beaconSeed[0], beaconSeed[1]);
const diagonal = shortestDistance(beaconSeed[0], beaconSeed[3]);
assert.ok(sameSide < crossTop, 'same-side relay route should remain shorter than cross-room top route');
assert.ok(crossTop < diagonal, 'cross-room top route should remain shorter than the long diagonal route');

console.log(
  `world routing passed: core=${coreDistances.map(v => v.toFixed(1)).join('/')}, ` +
  `same-side=${sameSide.toFixed(1)}, cross-top=${crossTop.toFixed(1)}, diagonal=${diagonal.toFixed(1)}`
);
