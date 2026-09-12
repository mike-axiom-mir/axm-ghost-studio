import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const acceptedSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const currentDecayRule = 'beacon.energy = Math.max(0, beacon.energy - 4.2 * dt);';
const proposedDecayRule =
  'beacon.energy = Math.max(0, beacon.energy - 4.2 * (beacon.energy / 100) * dt);';

assert.equal(
  acceptedSource.split(currentDecayRule).length - 1,
  1,
  'probe must apply to exactly the accepted constant-decay rule'
);

const gameSource = acceptedSource.replace(currentDecayRule, proposedDecayRule);

function noop() {}
const drawContext = new Proxy({}, {
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
  ['game', { width: 960, height: 600, getContext: () => drawContext }],
  ['chargeText', { textContent: '' }],
  ['relayText', { textContent: '' }],
  ['stateText', { textContent: '' }],
  ['restartButton', { addEventListener: noop }]
]);

const sandbox = {
  console,
  Math,
  navigator: { getGamepads: () => [] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  document: { getElementById: id => elements.get(id) },
  window: { addEventListener: noop }
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js#proportional-decay-probe' });

const result = vm.runInContext(`(() => {
  const DT = 0.01;
  const MAX_STEPS = 12000;
  const directions = [
    [-1, -1, ['a', 'w']], [0, -1, ['w']], [1, -1, ['d', 'w']],
    [-1, 0, ['a']], [1, 0, ['d']],
    [-1, 1, ['a', 's']], [0, 1, ['s']], [1, 1, ['d', 's']]
  ];

  function routeTarget(target) {
    const p = state.player;
    const isCore = target === core;
    const targetLeft = target.x < 287;
    const targetRight = target.x > 673;
    const playerLeft = p.x < 287;
    const playerRight = p.x > 673;
    const passageY = y => y < core.y ? 150 : 450;

    if (targetLeft && !playerLeft) {
      const y = passageY(target.y);
      if (p.x > 360 && Math.abs(p.y - y) > 5) return { x: 360, y };
      if (p.x > 280) return { x: 280, y };
    }
    if (targetRight && !playerRight) {
      const y = passageY(target.y);
      if (p.x < 600 && Math.abs(p.y - y) > 5) return { x: 600, y };
      if (p.x < 680) return { x: 680, y };
    }
    if (isCore && playerLeft) {
      const y = passageY(p.y);
      if (Math.abs(p.y - y) > 5) return { x: 280, y };
      if (p.x < 360) return { x: 360, y };
    }
    if (isCore && playerRight) {
      const y = passageY(p.y);
      if (Math.abs(p.y - y) > 5) return { x: 680, y };
      if (p.x > 600) return { x: 600, y };
    }
    return target;
  }

  function chooseDirection(target) {
    target = routeTarget(target);
    let best = null;
    for (const [dx, dy, inputKeys] of directions) {
      const length = Math.hypot(dx, dy);
      const nx = clamp(state.player.x + (dx / length) * 235 * DT, state.player.r, W - state.player.r);
      const ny = clamp(state.player.y + (dy / length) * 235 * DT, state.player.r, H - state.player.r);
      const nextDistance = Math.hypot(nx - target.x, ny - target.y);
      if (!best || nextDistance < best.distance) best = { distance: nextDistance, inputKeys };
    }
    return best.inputKeys;
  }

  function driveTo(target, contactRadius) {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (state.mode !== 'RUNNING') return;
      if (distance(state.player, target) <= contactRadius) {
        keys.clear();
        return;
      }
      keys.clear();
      for (const key of chooseDirection(target)) keys.add(key);
      update(DT);
    }
    throw new Error('driveTo exceeded step budget');
  }

  function fullRecharge() {
    driveTo(core, state.player.r + core.r);
    keys.clear();
    for (
      let step = 0;
      step < MAX_STEPS && state.mode === 'RUNNING' && state.player.charge < 99.999;
      step += 1
    ) update(DT);
  }

  function chargeCore(targetCharge) {
    driveTo(core, state.player.r + core.r);
    keys.clear();
    for (
      let step = 0;
      step < MAX_STEPS && state.mode === 'RUNNING' && state.player.charge < targetCharge;
      step += 1
    ) update(DT);
  }

  function chargeRelay(index, targetEnergy) {
    const beacon = state.beacons[index];
    driveTo(beacon, state.player.r + beacon.r);
    keys.clear();
    for (
      let step = 0;
      step < MAX_STEPS && state.mode === 'RUNNING' && beacon.energy < targetEnergy;
      step += 1
    ) update(DT);
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  function travelTimeFrom(source, index) {
    state = JSON.parse(JSON.stringify(source));
    keys.clear();
    const start = state.elapsed;
    const target = state.beacons[index];
    driveTo(target, state.player.r + target.r);
    return state.elapsed - start;
  }

  // Re-run the accepted QA Adaptive Completion policy without retuning it:
  // full recharge, lowest-energy relay, route/index tie break, exactly 1.00 s service.
  function runLowestEnergyPolicy() {
    resetGame();
    const history = [];
    let coreReturns = 0;

    for (let round = 0; round < 24 && state.mode === 'RUNNING'; round += 1) {
      fullRecharge();
      coreReturns += 1;
      if (state.mode !== 'RUNNING') break;

      const decision = snapshot();
      const minEnergy = Math.min(...decision.beacons.map(beacon => beacon.energy));
      const candidates = decision.beacons
        .map((beacon, index) => ({ beacon, index }))
        .filter(({ beacon }) => Math.abs(beacon.energy - minEnergy) < 1e-9)
        .map(({ index }) => ({ index, travel: travelTimeFrom(decision, index) }))
        .sort((a, b) => a.travel - b.travel || a.index - b.index);

      state = JSON.parse(JSON.stringify(decision));
      keys.clear();
      const target = state.beacons[candidates[0].index];
      driveTo(target, state.player.r + target.r);
      for (let step = 0; step < 100 && state.mode === 'RUNNING'; step += 1) {
        keys.clear();
        update(DT);
      }
      history.push(candidates[0].index + 1);
    }

    return { final: snapshot(), history, coreReturns };
  }

  // Re-run accepted Systems #52 policy without changing its 45 reserve, 25 runner
  // reserve, route/deficit score, or 39.8 conservative fill estimate.
  function runCostAwarePolicy() {
    const MAX_DECISIONS = 40;
    const STABILITY_RESERVE = 45;
    const LOW_CHARGE_RESERVE = 25;
    const NET_FILL_ESTIMATE = 39.8;
    const FULL_MOVE_DRAIN = 4.8;

    function rankCurrentTargets() {
      const source = snapshot();
      const candidates = source.beacons
        .map((beacon, index) => ({ beacon, index }))
        .filter(({ beacon }) => beacon.energy < 35)
        .map(({ beacon, index }) => {
          const travel = travelTimeFrom(source, index);
          const deficit = Math.max(0, STABILITY_RESERVE - beacon.energy);
          const service = deficit / NET_FILL_ESTIMATE;
          const estimatedCharge =
            FULL_MOVE_DRAIN * travel + deficit * 44 / NET_FILL_ESTIMATE;
          return { index, score: travel + service, estimatedCharge };
        })
        .sort((a, b) => a.score - b.score || a.index - b.index);
      state = JSON.parse(JSON.stringify(source));
      keys.clear();
      return candidates;
    }

    resetGame();
    const history = [];
    let coreReturns = 0;

    for (
      let decision = 1;
      decision <= MAX_DECISIONS && state.mode === 'RUNNING';
      decision += 1
    ) {
      let candidates = rankCurrentTargets();
      if (candidates.length === 0) break;
      let selected = candidates[0];

      if (state.player.charge <= LOW_CHARGE_RESERVE + selected.estimatedCharge) {
        fullRecharge();
        coreReturns += 1;
        if (state.mode !== 'RUNNING') break;
        candidates = rankCurrentTargets();
        if (candidates.length === 0) break;
        selected = candidates[0];
      }

      const target = state.beacons[selected.index];
      driveTo(target, state.player.r + target.r);
      while (
        state.mode === 'RUNNING' &&
        target.energy < STABILITY_RESERVE - 1e-9 &&
        state.player.charge > LOW_CHARGE_RESERVE + 1e-9
      ) {
        keys.clear();
        update(DT);
      }
      history.push(selected.index + 1);
    }

    return { final: snapshot(), history, coreReturns };
  }

  function runScriptedSolvability() {
    resetGame();
    chargeRelay(0, 95);
    chargeCore(100);
    chargeRelay(1, 65);
    chargeCore(100);
    chargeRelay(0, 95);
    chargeCore(100);
    chargeRelay(1, 95);
    chargeCore(100);
    chargeRelay(3, 70);
    chargeCore(100);
    chargeRelay(2, 45);
    chargeRelay(0, 35);
    keys.clear();
    return snapshot();
  }

  function runOrdinaryBlackout() {
    resetGame();
    keys.clear();
    keys.add('d');
    for (let step = 0; step < 20000 && state.mode === 'RUNNING'; step += 1) update(DT);
    keys.clear();
    return snapshot();
  }

  return {
    lowest: runLowestEnergyPolicy(),
    costAware: runCostAwarePolicy(),
    scripted: runScriptedSolvability(),
    blackout: runOrdinaryBlackout()
  };
})()`, sandbox);

const lowestTargets = Array.from(result.lowest.history);
assert.equal(result.lowest.final.mode, 'WON');
assert.equal(JSON.stringify(lowestTargets), JSON.stringify([2,4,3,1,2,4,3,1,2,4,3]));
assert.equal(result.lowest.coreReturns, 11);
assert.ok(Math.abs(result.lowest.final.elapsed - 53.17) < 0.05);
assert.ok(Math.abs(result.lowest.final.player.charge - 83.516) < 0.05);
assert.ok(result.lowest.final.beacons.every(beacon => beacon.energy >= 35));

const costTargets = Array.from(result.costAware.history);
assert.equal(result.costAware.final.mode, 'BLACKOUT');
assert.equal(JSON.stringify(costTargets), JSON.stringify([1,2,1,2,4,2,1,4,2]));
assert.equal(result.costAware.coreReturns, 7);
assert.ok(Math.abs(result.costAware.final.elapsed - 50.06) < 0.05);
assert.equal(result.costAware.final.player.charge, 0);

assert.equal(result.scripted.mode, 'WON');
assert.ok(result.scripted.player.charge > 5);
assert.ok(result.scripted.beacons.every(beacon => beacon.energy >= 35));
assert.ok(result.scripted.elapsed < 40);

assert.equal(result.blackout.mode, 'BLACKOUT');
assert.ok(Math.abs(result.blackout.elapsed - 33.42) < 0.05);

console.log('Systems proportional-decay repair probe passed.');
console.log(JSON.stringify({
  proposedRule: proposedDecayRule,
  lowestEnergyAdaptive: {
    mode: result.lowest.final.mode,
    elapsed: result.lowest.final.elapsed,
    charge: result.lowest.final.player.charge,
    energies: result.lowest.final.beacons.map(beacon => beacon.energy),
    history: lowestTargets,
    coreReturns: result.lowest.coreReturns
  },
  costAwareAdaptive: {
    mode: result.costAware.final.mode,
    elapsed: result.costAware.final.elapsed,
    charge: result.costAware.final.player.charge,
    energies: result.costAware.final.beacons.map(beacon => beacon.energy),
    history: costTargets,
    coreReturns: result.costAware.coreReturns
  },
  scriptedWon: {
    elapsed: result.scripted.elapsed,
    charge: result.scripted.player.charge,
    energies: result.scripted.beacons.map(beacon => beacon.energy)
  },
  ordinaryBlackout: {
    elapsed: result.blackout.elapsed,
    energies: result.blackout.beacons.map(beacon => beacon.energy)
  }
}, null, 2));
