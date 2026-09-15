const OP_ESC_PHASES = Object.freeze({
  TRIAGE: 'TRIAGE',
  SURGE: 'SURGE',
  RECOVERY: 'RECOVERY',
  REROUTE: 'REROUTE'
});
const OP_ESC_ONLINE_THRESHOLD = 35;
const OP_ESC_REINFORCEMENT_THRESHOLD = OP_ESC_ONLINE_THRESHOLD * 2;
const OP_ESC_ROUTE_CUT_RELAY_INDEX = 3;
const OP_ESC_ROUTE_CUT_LOCATIONS = Object.freeze({
  PRIMARY: 'PRIMARY',
  CROSSLINE: 'CROSSLINE'
});

function createOperationalEscalationState() {
  return {
    phase: OP_ESC_PHASES.TRIAGE,
    fault: null,
    surgeResolved: false,
    routeCutResolved: false
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
  operational.surgeResolved = true;
  return true;
}

function getRouteCutCrosslinePad() {
  return relayServicePads.find(pad => pad.relayIndex === OP_ESC_ROUTE_CUT_RELAY_INDEX) || null;
}

function getRouteCutLocationPoint(location) {
  if (location === OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY) {
    return state.beacons[OP_ESC_ROUTE_CUT_RELAY_INDEX] || null;
  }
  if (location === OP_ESC_ROUTE_CUT_LOCATIONS.CROSSLINE) return getRouteCutCrosslinePad();
  return null;
}

function chooseRouteCutBlockedLocation() {
  const primary = getRouteCutLocationPoint(OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY);
  const crossline = getRouteCutLocationPoint(OP_ESC_ROUTE_CUT_LOCATIONS.CROSSLINE);
  if (!primary || !crossline) return null;

  const primaryDistance = distance(state.player, primary);
  const crosslineDistance = distance(state.player, crossline);
  if (primaryDistance <= crosslineDistance) return OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY;
  return OP_ESC_ROUTE_CUT_LOCATIONS.CROSSLINE;
}

function beginOperationalRouteCut() {
  const operational = ensureOperationalEscalationState();
  if (operational.phase !== OP_ESC_PHASES.RECOVERY) return false;
  if (!operational.surgeResolved || operational.routeCutResolved) return false;

  const blockedLocation = chooseRouteCutBlockedLocation();
  if (!blockedLocation) return false;

  const requiredLocation = blockedLocation === OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY
    ? OP_ESC_ROUTE_CUT_LOCATIONS.CROSSLINE
    : OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY;

  operational.phase = OP_ESC_PHASES.REROUTE;
  operational.fault = {
    kind: 'ROUTE_CUT',
    relayIndex: OP_ESC_ROUTE_CUT_RELAY_INDEX,
    blockedLocation,
    requiredLocation,
    triggeredAt: state.elapsed,
    resolvedAt: null
  };
  return true;
}

function playerTouchesRouteCutLocation(player, location) {
  const point = getRouteCutLocationPoint(location);
  if (!point) return false;
  return distance(player, point) <= player.r + point.r;
}

function resolveOperationalRouteCutIfReady() {
  const operational = ensureOperationalEscalationState();
  if (
    operational.phase !== OP_ESC_PHASES.REROUTE ||
    !operational.fault ||
    operational.fault.kind !== 'ROUTE_CUT'
  ) return false;

  if (!playerTouchesRouteCutLocation(state.player, operational.fault.requiredLocation)) return false;

  operational.phase = OP_ESC_PHASES.RECOVERY;
  operational.fault.resolvedAt = state.elapsed;
  operational.routeCutResolved = true;
  return true;
}

function routeCutAllowsRelayService(player, beacon, relayIndex) {
  const operational = ensureOperationalEscalationState();
  if (
    state.mode !== 'RUNNING' ||
    operational.phase !== OP_ESC_PHASES.REROUTE ||
    !operational.fault ||
    operational.fault.kind !== 'ROUTE_CUT' ||
    operational.fault.relayIndex !== relayIndex
  ) return null;

  const touchesPrimary = distance(player, beacon) <= player.r + beacon.r;
  const crossline = getRouteCutCrosslinePad();
  const touchesCrossline = Boolean(
    crossline && distance(player, crossline) <= player.r + crossline.r
  );

  const primaryAllowed = operational.fault.blockedLocation !== OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY;
  const crosslineAllowed = operational.fault.blockedLocation !== OP_ESC_ROUTE_CUT_LOCATIONS.CROSSLINE;
  return (primaryAllowed && touchesPrimary) || (crosslineAllowed && touchesCrossline);
}

const baseOperationalPlayerTouchesRelayService = playerTouchesRelayService;
playerTouchesRelayService = function(player, beacon, relayIndex) {
  const routeCutResult = routeCutAllowsRelayService(player, beacon, relayIndex);
  if (routeCutResult !== null) return routeCutResult;
  return baseOperationalPlayerTouchesRelayService(player, beacon, relayIndex);
};

const baseOperationalDisplayedBeaconEnergy = getDisplayedBeaconEnergy;
getDisplayedBeaconEnergy = function(beacon) {
  const displayed = baseOperationalDisplayedBeaconEnergy(beacon);
  const operational = ensureOperationalEscalationState();

  if (
    state.mode !== 'RUNNING' ||
    operational.phase !== OP_ESC_PHASES.SURGE ||
    !operational.fault
  ) {
    return displayed;
  }

  const breaker = state.beacons[operational.fault.breakerIndex];
  if (beacon !== breaker || beacon.energy >= operational.fault.clearThreshold) return displayed;

  const highestVisibleBelowClear = Math.ceil(operational.fault.clearThreshold) - 1;
  return Math.min(displayed, highestVisibleBelowClear);
};

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

  const surgeResolvedNow = resolveOperationalSurgeIfReady();
  if (!surgeResolvedNow && operational.phase === OP_ESC_PHASES.RECOVERY) {
    beginOperationalRouteCut();
  }

  if (operational.phase === OP_ESC_PHASES.REROUTE) {
    resolveOperationalRouteCutIfReady();
  }

  const onlineCount = getOperationalOnlineIndices().length;
  const unresolvedOperationalGate =
    operational.phase === OP_ESC_PHASES.SURGE ||
    operational.phase === OP_ESC_PHASES.REROUTE ||
    (operational.surgeResolved && !operational.routeCutResolved);

  if (state.mode === 'WON' && unresolvedOperationalGate) {
    state.mode = 'RUNNING';
  } else if (
    state.mode === 'RUNNING' &&
    operational.phase === OP_ESC_PHASES.RECOVERY &&
    operational.routeCutResolved &&
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

  if (
    operational.phase === OP_ESC_PHASES.REROUTE &&
    operational.fault?.kind === 'ROUTE_CUT'
  ) {
    const target = operational.fault.requiredLocation === OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY
      ? 'R4 PRIMARY'
      : 'R4 LINK';
    return `REROUTE — USE ${target}`;
  }

  return `${operational.phase} — ${baseLabel}`;
};

ensureOperationalEscalationState();
updateHud();
