const operationCard = document.getElementById('operationCard');
const operationText = document.getElementById('operationText');
const ROUTE_CUT_RESOLUTION_FEEDBACK_SECONDS = 1.4;

function getOperationalPresentationPhase() {
  const operational = ensureOperationalEscalationState();
  if (state.mode === 'WON') return 'STABLE';
  return operational.phase;
}

function updateOperationalPresentation() {
  const phase = getOperationalPresentationPhase();
  if (operationText) setTextIfChanged(operationText, phase);
  if (operationCard && operationCard.dataset.phase !== phase) operationCard.dataset.phase = phase;
}

function isRouteCutResolutionFeedbackActive(operational) {
  if (
    state.mode !== 'RUNNING' ||
    operational.phase !== OP_ESC_PHASES.RECOVERY ||
    !operational.routeCutResolved ||
    operational.fault?.kind !== 'ROUTE_CUT' ||
    operational.fault.resolvedAt === null
  ) return false;

  const age = state.elapsed - operational.fault.resolvedAt;
  return age >= 0 && age <= ROUTE_CUT_RESOLUTION_FEEDBACK_SECONDS;
}

// The dedicated Operation slot carries the run phase. Keep the Status slot focused
// on the immediate action/recovery instruction instead of repeating TRIAGE/SURGE/
// RECOVERY/REROUTE on the same row.
const baseExperienceOperationalStatusLabel = getStatusLabel;
getStatusLabel = function() {
  const baseLabel = baseExperienceOperationalStatusLabel();
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
    return `REINFORCE R${operational.fault.breakerIndex + 1} TO ${operational.fault.clearThreshold}%`;
  }

  if (isRouteCutResolutionFeedbackActive(operational)) return 'ROUTE RESTORED';

  const phasePrefix = `${operational.phase} — `;
  return baseLabel.startsWith(phasePrefix) ? baseLabel.slice(phasePrefix.length) : baseLabel;
};

const baseExperienceOperationalUpdateHud = updateHud;
updateHud = function() {
  baseExperienceOperationalUpdateHud();
  updateOperationalPresentation();
};

function drawSurgeTargetCue(servicePoint, relayIndex) {
  const operational = ensureOperationalEscalationState();
  if (
    state.mode !== 'RUNNING' ||
    operational.phase !== OP_ESC_PHASES.SURGE ||
    !operational.fault ||
    operational.fault.breakerIndex !== relayIndex
  ) return;

  const margin = servicePoint.r + 14;
  ctx.strokeStyle = '#ffe47a';
  ctx.lineWidth = 3;
  ctx.strokeRect(servicePoint.x - margin, servicePoint.y - margin, margin * 2, margin * 2);

  ctx.fillStyle = '#fff1ae';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`TARGET ${operational.fault.clearThreshold}%`, servicePoint.x, servicePoint.y - margin - 8);
}

function getRouteCutServiceLocation(servicePoint, relayIndex) {
  if (relayIndex !== OP_ESC_ROUTE_CUT_RELAY_INDEX) return null;
  if (servicePoint === state.beacons[OP_ESC_ROUTE_CUT_RELAY_INDEX]) {
    return OP_ESC_ROUTE_CUT_LOCATIONS.PRIMARY;
  }

  const crossline = getRouteCutCrosslinePad();
  if (crossline && servicePoint === crossline) return OP_ESC_ROUTE_CUT_LOCATIONS.CROSSLINE;
  return null;
}

function drawRouteCutServiceCue(servicePoint, relayIndex) {
  const operational = ensureOperationalEscalationState();
  if (
    state.mode !== 'RUNNING' ||
    operational.phase !== OP_ESC_PHASES.REROUTE ||
    operational.fault?.kind !== 'ROUTE_CUT' ||
    operational.fault.relayIndex !== relayIndex
  ) return;

  const location = getRouteCutServiceLocation(servicePoint, relayIndex);
  if (!location) return;

  const blocked = operational.fault.blockedLocation === location;
  const required = operational.fault.requiredLocation === location;
  if (!blocked && !required) return;

  const margin = servicePoint.r + 14;
  ctx.lineWidth = 3;
  ctx.strokeStyle = blocked ? '#ff7185' : '#7ce6ff';
  ctx.beginPath();

  if (blocked) {
    ctx.moveTo(servicePoint.x - margin, servicePoint.y - margin);
    ctx.lineTo(servicePoint.x + margin, servicePoint.y + margin);
    ctx.moveTo(servicePoint.x + margin, servicePoint.y - margin);
    ctx.lineTo(servicePoint.x - margin, servicePoint.y + margin);
  } else {
    ctx.moveTo(servicePoint.x, servicePoint.y - margin);
    ctx.lineTo(servicePoint.x + margin, servicePoint.y);
    ctx.lineTo(servicePoint.x, servicePoint.y + margin);
    ctx.lineTo(servicePoint.x - margin, servicePoint.y);
    ctx.lineTo(servicePoint.x, servicePoint.y - margin);
  }

  ctx.stroke();
  ctx.fillStyle = blocked ? '#ff9aaa' : '#b8f5ff';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(blocked ? 'CUT' : 'USE', servicePoint.x, servicePoint.y - margin - 8);
}

const baseExperienceOperationalDrawRelayServicePads = drawRelayServicePads;
drawRelayServicePads = function() {
  baseExperienceOperationalDrawRelayServicePads();
  for (const pad of relayServicePads) {
    drawSurgeTargetCue(pad, pad.relayIndex);
    drawRouteCutServiceCue(pad, pad.relayIndex);
  }
};

const baseExperienceOperationalDrawBeacon = drawBeacon;
drawBeacon = function(beacon, index) {
  baseExperienceOperationalDrawBeacon(beacon, index);
  drawSurgeTargetCue(beacon, index);
  drawRouteCutServiceCue(beacon, index);
};

const baseExperienceOperationalDrawOverlay = drawOverlay;
drawOverlay = function() {
  baseExperienceOperationalDrawOverlay();
  if (state.mode !== 'WON') return;

  ctx.fillStyle = '#8dffd4';
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('OPERATIONAL ESCALATION CLEARED', W / 2, H / 2 - 68);
};

updateHud();
