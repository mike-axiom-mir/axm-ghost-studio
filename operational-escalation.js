const OP_ESC_PHASES = Object.freeze({
  TRIAGE: 'TRIAGE',
  SURGE: 'SURGE',
  RECOVERY: 'RECOVERY'
});
const OP_ESC_ONLINE_THRESHOLD = 35;
const OP_ESC_REINFORCEMENT_THRESHOLD = OP_ESC_ONLINE_THRESHOLD * 2;

function createOperationalEscalationState() {
  return {
    phase: OP_ESC_PHASES.TRIAGE,
    fault: null
  };
}

function ensureOperationalEscalationState() {
  if (!state.operational) state.operational = createOperationalEscalationState();
  return state.operational;
}

function getOperationalOnlineIndices() {
  return state.beacons
    .map((beacon, index) => ({ index, energy: beacon.energy }))
    .filter(entry => entry.energy >= OP_ESC_ONLINE_THRESHOLD)
    .map(entry => entry.index);
}

function chooseSurgeBreakerIndex(beforeOnlineIndices, afterOnlineIndices) {
  const newlyOnline = afterOnlineIndices.filter(index => !beforeOnlineIndices.includes(index));
  const preexistingBelowReinforcement = afterOnlineIndices
    .filter(index => beforeOnlineIndices.includes(index))
    .filter(index => state.beacons[index].energy < OP_ESC_REINFORCEMENT_THRESHOLD)
    .sort((a, b) => state.beacons[a].energy - state.beacons[b].energy || a - b);

  if (preexistingBelowReinforcement.length > 0) return preexistingBelowReinforcement[0];
  if (newlyOnline.length > 0) return newlyOnline[0];

  return [...afterOnlineIndices]
    .sort((a, b) => state.beacons[a].energy - state.beacons[b].energy || a - b)[0] ?? null;
}

function beginOperationalSurge(beforeOnlineIndices, afterOnlineIndices) {
  const operational = ensureOperationalEscalationState();
  if (operational.phase !== OP_ESC_PHASES.TRIAGE) return false;
  if (afterOnlineIndices.length < 2 || afterOnlineIndices.length >= state.beacons.length) return false;

  const breakerIndex = chooseSurgeBreakerIndex(beforeOnlineIndices, afterOnlineIndices);
  if (breakerIndex === null) return false;

  operational.phase = OP_ESC_PHASES.SURGE;
  operational.fault = {
    kind: 'SURGE_LOAD',
    breakerIndex,
    clearThreshold: OP_ESC_REINFORCEMENT_THRESHOLD,
    triggeredAt: state.elapsed,
    resolvedAt: null
  };
  return true;
}

function resolveOperationalSurgeIfReady() {
  const operational = ensureOperationalEscalationState();
  if (operational.phase !== OP_ESC_PHASES.SURGE || !operational.fault) return false;

  const breaker = state.beacons[operational.fault.breakerIndex];
  if (!breaker || breaker.energy < operational.fault.clearThreshold) return false;

  operational.phase = OP_ESC_PHASES.RECOVERY;
  operational.fault.resolvedAt = state.elapsed;
  return true;
}

const baseOperationalResetGame = resetGame;
resetGame = function(...args) {
  baseOperationalResetGame(...args);
  state.operational = createOperationalEscalationState();
  updateHud();
};

const baseOperationalUpdate = update;
update = function(dt) {
  const operational = ensureOperationalEscalationState();
  const beforeOnlineIndices = getOperationalOnlineIndices();
  const updated = baseOperationalUpdate(dt);
  if (!updated) return updated;

  if (state.mode === 'BLACKOUT') {
    updateHud();
    return updated;
  }

  const afterOnlineIndices = getOperationalOnlineIndices();
  if (operational.phase === OP_ESC_PHASES.TRIAGE) {
    beginOperationalSurge(beforeOnlineIndices, afterOnlineIndices);
  }

  resolveOperationalSurgeIfReady();

  const onlineCount = getOperationalOnlineIndices().length;
  if (state.mode === 'WON' && operational.phase === OP_ESC_PHASES.SURGE) {
    state.mode = 'RUNNING';
  } else if (
    state.mode === 'RUNNING' &&
    operational.phase === OP_ESC_PHASES.RECOVERY &&
    onlineCount === state.beacons.length
  ) {
    state.mode = 'WON';
  }

  updateHud();
  return updated;
};

const baseOperationalStatusLabel = getStatusLabel;
getStatusLabel = function() {
  const baseLabel = baseOperationalStatusLabel();
  const operational = ensureOperationalEscalationState();

  if (state.mode !== 'RUNNING') return baseLabel;
  if (
    baseLabel === 'PAUSED — RETURN TO GAME' ||
    baseLabel === 'RELEASE TO MOVE' ||
    baseLabel === 'RECONNECT CONTROLLER'
  ) {
    return baseLabel;
  }

  if (operational.phase === OP_ESC_PHASES.SURGE && operational.fault) {
    return `SURGE — REINFORCE R${operational.fault.breakerIndex + 1} TO ${operational.fault.clearThreshold}%`;
  }

  return `${operational.phase} — ${baseLabel}`;
};

ensureOperationalEscalationState();
updateHud();
