const operationCard = document.getElementById('operationCard');
const operationText = document.getElementById('operationText');

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

// The dedicated Operation slot carries the run phase. Keep the Status slot focused
// on the immediate action/recovery instruction instead of repeating TRIAGE/SURGE/
// RECOVERY on the same row.
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

const baseExperienceOperationalDrawRelayServicePads = drawRelayServicePads;
drawRelayServicePads = function() {
  baseExperienceOperationalDrawRelayServicePads();
  for (const pad of relayServicePads) drawSurgeTargetCue(pad, pad.relayIndex);
};

const baseExperienceOperationalDrawBeacon = drawBeacon;
drawBeacon = function(beacon, index) {
  baseExperienceOperationalDrawBeacon(beacon, index);
  drawSurgeTargetCue(beacon, index);
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
