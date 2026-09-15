const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const chargeText = document.getElementById('chargeText');
const relayText = document.getElementById('relayText');
const relayDetail = document.getElementById('relayDetail');
const stateText = document.getElementById('stateText');
const restartButton = document.getElementById('restartButton');

const W = canvas.width;
const H = canvas.height;
const core = { x: W / 2, y: H / 2, r: 46 };
const beaconSeed = [
  { x: 145, y: 125 },
  { x: W - 145, y: 125 },
  { x: 145, y: H - 125 },
  { x: W - 145, y: H - 125 }
];
const bulkheads = [
  { x: 300, y: 170, w: 42, h: 260 },
  { x: W - 342, y: 170, w: 42, h: 260 }
];

const keys = new Set();
const GAMEPAD_DEADZONE = 0.2;
const MAX_SIMULATION_STEP = 0.05;
const PLAYER_LOW_CHARGE_THRESHOLD = 25;
const PLAYER_BLACKOUT_CHARGE_THRESHOLD = 0.001;
const gamepadRestartHeldIndices = new Set();
let selectedGamepadIndex = null;
let movementArmed = true;
let gamepadNeutralPending = false;
let gamepadNeutralPendingIndex = null;
let inputFocused = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
let pageVisible = typeof document.visibilityState === 'string' ? document.visibilityState !== 'hidden' : true;
let state;
let previousTime = performance.now();
const reducedMotionMedia = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

function resetGame(requireNeutralMovement = false, requireGamepadNeutral = false, neutralGamepadIndex = null) {
  state = {
    mode: 'RUNNING',
    player: { x: core.x, y: core.y, r: 13, charge: 100 },
    beacons: beaconSeed.map((b, i) => ({ ...b, r: 29, energy: i === 0 ? 34 : 0 })),
    elapsed: 0
  };
  movementArmed = !requireNeutralMovement;
  gamepadNeutralPending = requireNeutralMovement && requireGamepadNeutral;
  gamepadNeutralPendingIndex = gamepadNeutralPending ? neutralGamepadIndex : null;
  previousTime = performance.now();
  updateHud();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function circleIntersectsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function positionBlocked(x, y, radius) {
  return bulkheads.some(rect => circleIntersectsRect({ x, y, r: radius }, rect));
}

function movePlayer(player, moveX, moveY) {
  const nextX = clamp(player.x + moveX, player.r, W - player.r);
  if (!positionBlocked(nextX, player.y, player.r)) player.x = nextX;

  const nextY = clamp(player.y + moveY, player.r, H - player.r);
  if (!positionBlocked(player.x, nextY, player.r)) player.y = nextY;
}

function applyRadialDeadzone(x, y) {
  const rawLength = Math.hypot(x, y);
  if (rawLength <= GAMEPAD_DEADZONE) return { dx: 0, dy: 0 };

  const clampedLength = Math.min(rawLength, 1);
  const scaledLength = (clampedLength - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE);
  return {
    dx: (x / rawLength) * scaledLength,
    dy: (y / rawLength) * scaledLength
  };
}

function hasKeyboardMovementIntent() {
  return ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].some(key => keys.has(key));
}

function getStandardGamepad() {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  return Array.from(navigator.getGamepads() || []).find(candidate => candidate?.connected && candidate.mapping === 'standard') || null;
}

function getGamepadIndex(pad) {
  if (!pad || typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  if (Number.isInteger(pad.index)) return pad.index;
  const slot = Array.from(navigator.getGamepads() || []).indexOf(pad);
  return slot >= 0 ? slot : null;
}

function getStandardGamepadByIndex(index) {
  if (index === null || typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  return Array.from(navigator.getGamepads() || []).find((candidate, slot) =>
    candidate?.connected &&
    candidate.mapping === 'standard' &&
    (Number.isInteger(candidate.index) ? candidate.index : slot) === index
  ) || null;
}

function hasActiveGameplayFocus() {
  return inputFocused && pageVisible;
}

function syncSimulationClock() {
  previousTime = performance.now();
}

function hasGamepadMovementIntent(pad = getStandardGamepad()) {
  if (!pad) return false;

  const analog = applyRadialDeadzone(pad.axes?.[0] || 0, pad.axes?.[1] || 0);
  return analog.dx !== 0 || analog.dy !== 0 || [12, 13, 14, 15].some(index => pad.buttons?.[index]?.pressed);
}

function readGamepadMovementIntent(pad = getStandardGamepad()) {
  if (!pad) return { dx: 0, dy: 0 };

  const analog = applyRadialDeadzone(pad.axes?.[0] || 0, pad.axes?.[1] || 0);
  let dx = analog.dx;
  let dy = analog.dy;
  if (pad.buttons?.[14]?.pressed) dx -= 1;
  if (pad.buttons?.[15]?.pressed) dx += 1;
  if (pad.buttons?.[12]?.pressed) dy -= 1;
  if (pad.buttons?.[13]?.pressed) dy += 1;
  const length = Math.hypot(dx, dy);
  if (length > 1) {
    dx /= length;
    dy /= length;
  }
  return { dx, dy };
}

function readGamepadIntent() {
  if (!hasActiveGameplayFocus()) return { dx: 0, dy: 0 };

  const pad = getStandardGamepad();
  if (!pad) {
    if (selectedGamepadIndex !== undefined) selectedGamepadIndex = null;
    return { dx: 0, dy: 0 };
  }

  const movement = readGamepadMovementIntent(pad);
  const restartPressed = Boolean(pad.buttons?.[9]?.pressed);
  const padIndex = getGamepadIndex(pad);
  const selectionChanged = selectedGamepadIndex !== undefined && padIndex !== selectedGamepadIndex;
  selectedGamepadIndex = padIndex;
  if (selectionChanged && padIndex !== null) {
    if (!gamepadNeutralPending && hasGamepadMovementIntent(pad)) {
      movementArmed = false;
      gamepadNeutralPending = true;
      gamepadNeutralPendingIndex = padIndex;
    }
    if (restartPressed) gamepadRestartHeldIndices.add(padIndex);
  }
  const restartHeld = padIndex !== null && gamepadRestartHeldIndices.has(padIndex);
  if (restartPressed && !restartHeld) {
    resetForCurrentMovementIntent();
    if (padIndex !== null) gamepadRestartHeldIndices.add(padIndex);
    return null;
  }
  if (!restartPressed && padIndex !== null) gamepadRestartHeldIndices.delete(padIndex);
  return movement;
}

function guardFocusedGamepadCarryover() {
  const pad = getStandardGamepad();
  if (!pad) return;

  const padIndex = getGamepadIndex(pad);
  if (!gamepadNeutralPending && hasGamepadMovementIntent(pad)) {
    movementArmed = false;
    gamepadNeutralPending = true;
    gamepadNeutralPendingIndex = padIndex;
  }
  if (padIndex !== null && pad.buttons?.[9]?.pressed) gamepadRestartHeldIndices.add(padIndex);
}

function currentMovementIntentActive() {
  return hasKeyboardMovementIntent() || hasGamepadMovementIntent();
}

function resetForCurrentMovementIntent() {
  const pad = getStandardGamepad();
  const gamepadMovementActive = hasGamepadMovementIntent(pad);
  const pendingGamepadNeutral = gamepadNeutralPending;
  const requireGamepadNeutral = gamepadMovementActive || pendingGamepadNeutral;
  const neutralGamepadIndex = pendingGamepadNeutral
    ? gamepadNeutralPendingIndex
    : (gamepadMovementActive ? getGamepadIndex(pad) : null);
  resetGame(
    hasKeyboardMovementIntent() || requireGamepadNeutral,
    requireGamepadNeutral,
    neutralGamepadIndex
  );
}

function update(dt) {
  if (!hasActiveGameplayFocus()) return false;

  const gamepad = readGamepadIntent();
  if (!gamepad || state.mode !== 'RUNNING') return false;

  const p = state.player;
  let dx = gamepad.dx;
  let dy = gamepad.dy;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;

  const inputLength = Math.hypot(dx, dy);
  if (inputLength > 1) {
    dx /= inputLength;
    dy /= inputLength;
  }

  const movementPad = getStandardGamepad();
  const gamepadMovementActive = hasGamepadMovementIntent(movementPad);
  const movementInputActive = hasKeyboardMovementIntent() || gamepadMovementActive;
  if (!movementArmed) {
    const pendingPad = gamepadNeutralPending ? getStandardGamepadByIndex(gamepadNeutralPendingIndex) : null;
    if (gamepadNeutralPending && pendingPad && !hasGamepadMovementIntent(pendingPad)) {
      gamepadNeutralPending = false;
      gamepadNeutralPendingIndex = null;
    }
    if (movementInputActive || gamepadNeutralPending) {
      dx = 0;
      dy = 0;
    } else {
      movementArmed = true;
    }
  }

  state.elapsed += dt;
  const movementMagnitude = Math.hypot(dx, dy);
  let realizedMovementMagnitude = 0;
  if (movementMagnitude > 0) {
    const speed = 235;
    const startX = p.x;
    const startY = p.y;
    movePlayer(p, dx * speed * dt, dy * speed * dt);
    const maximumDistance = speed * dt;
    const actualDistance = Math.hypot(p.x - startX, p.y - startY);
    if (maximumDistance > 0) realizedMovementMagnitude = clamp(actualDistance / maximumDistance, 0, 1);
  }

  const atCore = distance(p, core) <= p.r + core.r;
  if (atCore) {
    p.charge = Math.min(100, p.charge + 58 * dt);
  } else {
    const drainRate = 3.0 + (4.8 - 3.0) * realizedMovementMagnitude;
    p.charge = Math.max(0, p.charge - drainRate * dt);
  }

  for (const beacon of state.beacons) {
    beacon.energy = Math.max(0, beacon.energy - 4.2 * (beacon.energy / 100) * dt);
    const touching = distance(p, beacon) <= p.r + beacon.r;
    if (touching && p.charge > 0 && beacon.energy < 100) {
      const transfer = Math.min(44 * dt, p.charge, 100 - beacon.energy);
      beacon.energy += transfer;
      p.charge -= transfer;
    }
  }

  const online = state.beacons.filter(b => b.energy >= 35).length;
  if (online === state.beacons.length) state.mode = 'WON';
  else if (p.charge <= PLAYER_BLACKOUT_CHARGE_THRESHOLD && !atCore) state.mode = 'BLACKOUT';
  updateHud();
  return true;
}

function getTransferTarget() {
  if (state.mode !== 'RUNNING') return null;
  const p = state.player;
  return state.beacons.find(beacon =>
    distance(p, beacon) <= p.r + beacon.r && p.charge > 0 && beacon.energy < 100
  ) || null;
}

function getStatusLabel() {
  if (state.mode !== 'RUNNING') return state.mode;
  if (!hasActiveGameplayFocus()) return 'PAUSED — RETURN TO GAME';
  if (!movementArmed) {
    if (gamepadNeutralPending && !getStandardGamepadByIndex(gamepadNeutralPendingIndex)) return 'RECONNECT CONTROLLER';
    return 'RELEASE TO MOVE';
  }
  const transferTarget = getTransferTarget();
  if (transferTarget) return `TRANSFER R${state.beacons.indexOf(transferTarget) + 1}`;
  const atCore = distance(state.player, core) <= state.player.r + core.r;
  if (atCore && state.player.charge < 100) return 'RECHARGING';
  if (state.player.charge <= PLAYER_LOW_CHARGE_THRESHOLD) return 'LOW CHARGE';
  return atCore ? 'CORE FULL' : 'ROUTING';
}

function setTextIfChanged(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function getDisplayedPlayerCharge() {
  const charge = state.player.charge;
  const rounded = Math.round(charge);
  if (charge > PLAYER_LOW_CHARGE_THRESHOLD && rounded <= PLAYER_LOW_CHARGE_THRESHOLD) return PLAYER_LOW_CHARGE_THRESHOLD + 1;
  if (charge <= PLAYER_BLACKOUT_CHARGE_THRESHOLD) return 0;
  if (rounded <= 0) return 1;
  if (charge < 100 && rounded >= 100) return 99;
  return rounded;
}

function getDisplayedBeaconEnergy(beacon) {
  const rounded = Math.round(beacon.energy);
  if (beacon.energy < 35) return Math.min(34, rounded);
  if (beacon.energy < 100) return Math.min(99, rounded);
  return 100;
}

function updateHud() {
  const online = state.beacons.filter(b => b.energy >= 35).length;
  setTextIfChanged(chargeText, `${getDisplayedPlayerCharge()}%`);
  setTextIfChanged(relayText, `${online} / ${state.beacons.length}`);
  if (relayDetail) {
    const relaySummary = state.beacons
      .map((beacon, index) => `R${index + 1} ${getDisplayedBeaconEnergy(beacon)}%`)
      .join(', ');
    setTextIfChanged(relayDetail, `Relay status: ${relaySummary}`);
  }
  setTextIfChanged(stateText, getStatusLabel());
}

function drawGrid() {
  ctx.strokeStyle = '#111a24';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawBulkheads() {
  for (const rect of bulkheads) {
    ctx.fillStyle = '#141b23';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = '#40515f';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = '#263440';
    ctx.lineWidth = 1;
    for (let y = rect.y + 14; y < rect.y + rect.h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(rect.x + 6, y);
      ctx.lineTo(rect.x + rect.w - 6, y);
      ctx.stroke();
    }
  }
}

function motionPulse(amplitude, speed) {
  return reducedMotionMedia?.matches ? 0 : Math.sin(state.elapsed * speed) * amplitude;
}

function drawCore() {
  const pulse = 4 + motionPulse(2, 4);
  ctx.beginPath();
  ctx.arc(core.x, core.y, core.r + pulse, 0, Math.PI * 2);
  ctx.strokeStyle = '#55e6ff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(core.x, core.y, core.r - 12, 0, Math.PI * 2);
  ctx.fillStyle = '#113849';
  ctx.fill();
  ctx.fillStyle = '#d9fbff';
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('CORE', core.x, core.y + 5);
}

function drawBeacon(beacon, index) {
  const pct = beacon.energy / 100;
  const online = beacon.energy >= 35;
  const displayedEnergy = getDisplayedBeaconEnergy(beacon);
  ctx.beginPath();
  ctx.arc(beacon.x, beacon.y, beacon.r, 0, Math.PI * 2);
  ctx.fillStyle = online ? '#16382f' : '#221a20';
  ctx.fill();
  ctx.strokeStyle = online ? '#62ffc5' : '#80505b';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(beacon.x, beacon.y, beacon.r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.strokeStyle = online ? '#92ffd8' : '#ff8f9f';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#e8f2f7';
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui';
  ctx.fillText(`R${index + 1}`, beacon.x, beacon.y - 2);
  ctx.font = '11px system-ui';
  ctx.fillText(`${displayedEnergy}%`, beacon.x, beacon.y + 13);
}

function drawTransferFeedback() {
  const target = getTransferTarget();
  if (!target) return;
  const p = state.player;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(target.x, target.y);
  ctx.strokeStyle = 'rgba(255, 228, 122, .7)';
  ctx.lineWidth = 4;
  ctx.stroke();

  const midpointX = (p.x + target.x) / 2;
  const midpointY = (p.y + target.y) / 2;
  ctx.beginPath();
  ctx.arc(midpointX, midpointY, 4 + motionPulse(1.5, 12), 0, Math.PI * 2);
  ctx.fillStyle = '#fff1ae';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(target.x, target.y, target.r + 14 + motionPulse(2, 10), 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 228, 122, .65)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPlayer() {
  const p = state.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
  ctx.strokeStyle = p.charge > PLAYER_LOW_CHARGE_THRESHOLD ? '#ffe47a' : '#ff6e73';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff1ae';
  ctx.fill();
}

function drawOverlay() {
  if (state.mode === 'RUNNING') return;
  ctx.fillStyle = 'rgba(2, 4, 7, .78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = state.mode === 'WON' ? '#8dffd4' : '#ff858d';
  ctx.font = 'bold 42px system-ui';
  ctx.fillText(state.mode === 'WON' ? 'NETWORK STABLE' : 'BLACKOUT', W / 2, H / 2 - 10);
  ctx.fillStyle = '#d4e0e8';
  ctx.font = '18px system-ui';
  ctx.fillText('Press R, Restart, or gamepad Start to run the chamber again', W / 2, H / 2 + 34);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#090d12';
  ctx.fillRect(0, 0, W, H);
  drawGrid();
  drawBulkheads();
  drawCore();
  state.beacons.forEach(drawBeacon);
  drawTransferFeedback();
  drawPlayer();
  drawOverlay();
}

function advanceFocusedSimulation(dt) {
  let remaining = Math.max(0, dt);
  while (remaining > 1e-9) {
    const step = Math.min(remaining, MAX_SIMULATION_STEP);
    if (!update(step)) break;
    remaining -= step;
    if (state.mode !== 'RUNNING') break;
  }
}

function frame(now) {
  const dt = Math.max(0, (now - previousTime) / 1000);
  previousTime = now;
  if (hasActiveGameplayFocus()) advanceFocusedSimulation(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', event => {
  if (!hasActiveGameplayFocus()) return;
  const key = event.key.toLowerCase();
  const movementKey = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key);
  if (movementKey) {
    event.preventDefault();
    if (event.repeat && !keys.has(key)) return;
  }
  if (key === 'r' && !event.repeat) resetForCurrentMovementIntent();
  keys.add(key);
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => {
  keys.clear();
  inputFocused = false;
  syncSimulationClock();
  updateHud();
});
window.addEventListener('focus', () => {
  inputFocused = true;
  syncSimulationClock();
  if (hasActiveGameplayFocus()) guardFocusedGamepadCarryover();
  updateHud();
});
if (typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', () => {
    pageVisible = document.visibilityState !== 'hidden';
    keys.clear();
    syncSimulationClock();
    if (hasActiveGameplayFocus()) guardFocusedGamepadCarryover();
    updateHud();
  });
}
restartButton.addEventListener('click', () => {
  if (hasActiveGameplayFocus()) resetForCurrentMovementIntent();
});

resetGame();
if (hasActiveGameplayFocus()) guardFocusedGamepadCarryover();
requestAnimationFrame(frame);