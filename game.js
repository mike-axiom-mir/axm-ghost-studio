const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const chargeText = document.getElementById('chargeText');
const relayText = document.getElementById('relayText');
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

const keys = new Set();
const GAMEPAD_DEADZONE = 0.2;
let gamepadRestartHeld = false;
let movementArmed = true;
let state;
let previousTime = performance.now();

function resetGame(requireNeutralMovement = false) {
  state = {
    mode: 'RUNNING',
    player: { x: core.x, y: core.y, r: 13, charge: 100 },
    beacons: beaconSeed.map((b, i) => ({ ...b, r: 29, energy: i === 0 ? 34 : 0 })),
    elapsed: 0
  };
  movementArmed = !requireNeutralMovement;
  previousTime = performance.now();
  updateHud();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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

function readGamepadIntent() {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
    gamepadRestartHeld = false;
    return { dx: 0, dy: 0 };
  }

  const pad = Array.from(navigator.getGamepads() || []).find(candidate => candidate?.connected && candidate.mapping === 'standard');
  if (!pad) {
    gamepadRestartHeld = false;
    return { dx: 0, dy: 0 };
  }

  const restartPressed = Boolean(pad.buttons?.[9]?.pressed);
  if (restartPressed && !gamepadRestartHeld) resetGame(true);
  gamepadRestartHeld = restartPressed;

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

function update(dt) {
  const gamepad = readGamepadIntent();
  if (state.mode !== 'RUNNING') return;

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

  const hasMovementIntent = dx !== 0 || dy !== 0;
  if (!movementArmed) {
    if (hasMovementIntent) {
      updateHud();
      return;
    }
    movementArmed = true;
  }

  state.elapsed += dt;
  const movementMagnitude = Math.hypot(dx, dy);
  const moving = movementMagnitude > 0;
  if (moving) {
    const speed = 235;
    p.x = clamp(p.x + dx * speed * dt, p.r, W - p.r);
    p.y = clamp(p.y + dy * speed * dt, p.r, H - p.r);
  }

  const atCore = distance(p, core) <= p.r + core.r;
  if (atCore) {
    p.charge = Math.min(100, p.charge + 58 * dt);
  } else {
    const drainRate = 3.0 + (4.8 - 3.0) * movementMagnitude;
    p.charge = Math.max(0, p.charge - drainRate * dt);
  }

  for (const beacon of state.beacons) {
    beacon.energy = Math.max(0, beacon.energy - 4.2 * dt);
    const touching = distance(p, beacon) <= p.r + beacon.r;
    if (touching && p.charge > 0 && beacon.energy < 100) {
      const transfer = Math.min(44 * dt, p.charge, 100 - beacon.energy);
      beacon.energy += transfer;
      p.charge -= transfer;
    }
  }

  const online = state.beacons.filter(b => b.energy >= 35).length;
  if (online === state.beacons.length) state.mode = 'WON';
  else if (p.charge <= 0.001 && !atCore) state.mode = 'BLACKOUT';
  updateHud();
}

function updateHud() {
  const online = state.beacons.filter(b => b.energy >= 35).length;
  chargeText.textContent = `${Math.round(state.player.charge)}%`;
  relayText.textContent = `${online} / ${state.beacons.length}`;
  stateText.textContent = state.mode;
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

function drawCore() {
  const pulse = 4 + Math.sin(state.elapsed * 4) * 2;
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
  ctx.font = '13px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`R${index + 1}`, beacon.x, beacon.y + 5);
}

function drawPlayer() {
  const p = state.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
  ctx.strokeStyle = p.charge > 25 ? '#ffe47a' : '#ff6e73';
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
  ctx.fillText('Press R or Restart to run the chamber again', W / 2, H / 2 + 34);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#090d12';
  ctx.fillRect(0, 0, W, H);
  drawGrid();
  drawCore();
  state.beacons.forEach(drawBeacon);
  drawPlayer();
  drawOverlay();
}

function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) event.preventDefault();
  if (key === 'r') resetGame(true);
  keys.add(key);
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
restartButton.addEventListener('click', () => resetGame(true));

resetGame();
requestAnimationFrame(frame);
