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
let state;
let previousTime = performance.now();

function resetGame() {
  state = {
    mode: 'RUNNING',
    player: { x: core.x, y: core.y, r: 13, charge: 100 },
    beacons: beaconSeed.map((b, i) => ({ ...b, r: 29, energy: i === 0 ? 34 : 0 })),
    elapsed: 0
  };
  previousTime = performance.now();
  updateHud();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update(dt) {
  if (state.mode !== 'RUNNING') return;

  state.elapsed += dt;
  const p = state.player;
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;

  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const length = Math.hypot(dx, dy);
    const speed = 235;
    p.x = clamp(p.x + (dx / length) * speed * dt, p.r, W - p.r);
    p.y = clamp(p.y + (dy / length) * speed * dt, p.r, H - p.r);
  }

  const atCore = distance(p, core) <= p.r + core.r;
  if (atCore) {
    p.charge = Math.min(100, p.charge + 58 * dt);
  } else {
    p.charge = Math.max(0, p.charge - (moving ? 4.8 : 3.0) * dt);
  }

  for (const beacon of state.beacons) {
    beacon.energy = Math.max(0, beacon.energy - 5.2 * dt);
    const touching = distance(p, beacon) <= p.r + beacon.r;
    if (touching && p.charge > 0 && beacon.energy < 100) {
      const transfer = Math.min(44 * dt, p.charge, 100 - beacon.energy);
      beacon.energy += transfer;
      p.charge -= transfer;
    }
  }

  const online = state.beacons.filter(b => b.energy >= 35).length;
  if (online === state.beacons.length) state.mode = 'WON';
  if (p.charge <= 0.001 && !atCore) state.mode = 'BLACKOUT';
  updateHud();
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
  const transferTarget = getTransferTarget();
  if (transferTarget) return `TRANSFER R${state.beacons.indexOf(transferTarget) + 1}`;
  const atCore = distance(state.player, core) <= state.player.r + core.r;
  if (atCore && state.player.charge < 99.5) return 'RECHARGING';
  if (state.player.charge <= 25) return 'LOW CHARGE';
  return atCore ? 'CORE FULL' : 'ROUTING';
}

function setTextIfChanged(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function updateHud() {
  const online = state.beacons.filter(b => b.energy >= 35).length;
  setTextIfChanged(chargeText, `${Math.round(state.player.charge)}%`);
  setTextIfChanged(relayText, `${online} / ${state.beacons.length}`);
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
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui';
  ctx.fillText(`R${index + 1}`, beacon.x, beacon.y - 2);
  ctx.font = '11px system-ui';
  ctx.fillText(`${Math.round(beacon.energy)}%`, beacon.x, beacon.y + 13);
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
  ctx.arc(midpointX, midpointY, 4 + Math.sin(state.elapsed * 12) * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff1ae';
  ctx.fill();
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
  drawTransferFeedback();
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
  if (key === 'r') resetGame();
  keys.add(key);
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
restartButton.addEventListener('click', resetGame);

resetGame();
requestAnimationFrame(frame);
