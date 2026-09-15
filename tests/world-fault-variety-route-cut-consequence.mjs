import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const gameSource = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const escalationSource = fs.readFileSync(new URL('../operational-escalation.js', import.meta.url), 'utf8');

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
  `${gameSource}\n${escalationSource}\n;globalThis.__world = { core, beaconSeed, relayServicePads, bulkheads, positionBlocked, resetGame, update, getStatusLabel, state, OP_ESC_PHASES, OP_ESC_ROUTE_CUT_LOCATIONS };`,
  sandbox
);

const {
  core,
  beaconSeed,
  relayServicePads,
  bulkheads,
  positionBlocked
} = sandbox.__world;
const r2 = beaconSeed[1];
const r4 = beaconSeed[3];
const r4Link = relayServicePads.find(pad => pad.relayIndex === 3);

assert.deepEqual(
  JSON.parse(JSON.stringify(r4Link)),
  { relayIndex: 3, x: 720, y: 300, r: 20 },
  'ROUTE_CUT World evidence depends on the accepted R4 crossline service location'
);
assert.equal(positionBlocked(r4Link.x, r4Link.y, r4Link.r), false, 'accepted R4 link must remain in reachable player space');
assert.equal(positionBlocked(639, 300, 13), true, 'the direct core-to-link crossline remains blocked by the right bulkhead');

const STEP = 5;
const RADIUS = 13;
const WIDTH = 960;
const HEIGHT = 600;
const RELAY_CONTACT = RADIUS + 29;
const PAD_CONTACT = RADIUS + r4Link.r;
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

const coreToPrimary = shortestDistance(core, r4, RELAY_CONTACT);
const coreToLink = shortestDistance(core, r4Link, PAD_CONTACT);
const r2ToPrimary = shortestDistance(r2, r4, RELAY_CONTACT);
const r2ToLink = shortestDistance(r2, r4Link, PAD_CONTACT);
const primaryToLink = shortestDistance(r4, r4Link, PAD_CONTACT);

// Truth boundary: the bulkhead reverses the apparent straight-line ordering from core.
// The Systems selector intentionally uses straight-line distance, so this core case must
// not be cited as proof that ROUTE_CUT always removes the physically shorter route.
assert.ok(coreToPrimary < coreToLink, `from core the primary R4 route should remain slightly shorter than the link: ${coreToPrimary} vs ${coreToLink}`);

// Natural upper-right commitment: the crossline link is materially cheaper than R4 primary.
assert.ok(r2ToLink + 100 < r2ToPrimary, `from R2, R4 link should be materially shorter than R4 primary: ${r2ToLink} vs ${r2ToPrimary}`);

function seedResolvedSurgeAt(x, y) {
  vm.runInContext(`
    resetGame();
    state.operational.phase = OP_ESC_PHASES.RECOVERY;
    state.operational.surgeResolved = true;
    state.operational.routeCutResolved = false;
    state.operational.fault = {
      kind: 'SURGE_LOAD',
      breakerIndex: 0,
      clearThreshold: 70,
      triggeredAt: 0,
      resolvedAt: 0
    };
    state.beacons.forEach(beacon => { beacon.energy = 40; });
    state.player.x = ${x};
    state.player.y = ${y};
    state.player.charge = 100;
    update(0);
  `, sandbox);
  return JSON.parse(vm.runInContext('JSON.stringify(state)', sandbox));
}

// Outcome A: after an R2-side commitment, Systems cuts the currently attractive LINK.
// World measurement proves this forces a real route consequence to the primary R4 service.
let state = seedResolvedSurgeAt(r2.x, r2.y);
assert.equal(state.mode, 'RUNNING');
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.fault.kind, 'ROUTE_CUT');
assert.equal(state.operational.fault.blockedLocation, 'CROSSLINE');
assert.equal(state.operational.fault.requiredLocation, 'PRIMARY');
assert.equal(elements.stateText.textContent, 'REROUTE — USE R4 PRIMARY');
assert.ok(r2ToPrimary - r2ToLink > 100, 'R2-side CROSSLINE cut must force more than 100 px of additional collision-aware route cost');

// Outcome B: if the incident begins at the primary service area, PRIMARY is cut and
// the runner must leave that location and traverse to the link.
state = seedResolvedSurgeAt(r4.x, r4.y);
assert.equal(state.mode, 'RUNNING');
assert.equal(state.operational.phase, 'REROUTE');
assert.equal(state.operational.fault.blockedLocation, 'PRIMARY');
assert.equal(state.operational.fault.requiredLocation, 'CROSSLINE');
assert.equal(elements.stateText.textContent, 'REROUTE — USE R4 LINK');
assert.ok(primaryToLink > 170 && primaryToLink < 190, `primary R4 cut should force a bounded route to the link, measured ${primaryToLink}`);

console.log(
  `world ROUTE_CUT consequence passed: core primary/link ${coreToPrimary.toFixed(1)}/${coreToLink.toFixed(1)} truth-boundary, ` +
  `R2 primary/link ${r2ToPrimary.toFixed(1)}/${r2ToLink.toFixed(1)} forced +${(r2ToPrimary - r2ToLink).toFixed(1)}, ` +
  `R4 primary -> link ${primaryToLink.toFixed(1)}`
);
