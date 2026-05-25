// frontend/src/utils/authBlock.js
export function parseBlockSeconds(msg) {
  if (!msg) return null;
  const m = String(msg).match(/(\d+)\s*seconds?/i);
  if (!m) return null;
  const v = parseInt(m[1], 10);
  return Number.isFinite(v) ? v : null;
}

export default parseBlockSeconds;
