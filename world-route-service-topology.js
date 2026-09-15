// World / Encounter layer for Operational Escalation 02.
// Adds one bounded crossline service location without changing relay rules or inputs.
const worldFaultVarietyServicePads = [
  { relayIndex: 0, x: 240, y: H / 2, r: 20 }
];

for (const pad of worldFaultVarietyServicePads) {
  const alreadyPresent = relayServicePads.some(existing =>
    existing.relayIndex === pad.relayIndex &&
    existing.x === pad.x &&
    existing.y === pad.y &&
    existing.r === pad.r
  );
  if (!alreadyPresent) relayServicePads.push(pad);
}
