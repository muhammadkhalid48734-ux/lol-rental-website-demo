// SAMPLE DATA ONLY. Deterministic pseudo-bookings from a fixed seed so the demo
// looks the same every visit. This is NOT real availability.
export const SEED = 'lol-demo-sample-1';
const BY_DAY = [0.3, 0.08, 0.07, 0.08, 0.1, 0.32, 0.52]; // Sun..Sat chance of "booked"

function rand(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  x ^= x >>> 15; x = Math.imul(x, 2246822509); x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

/** iso = "YYYY-MM-DD". Same inputs always give the same answer. */
export function isBooked(id, iso) {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return rand(`${SEED}|${id}|${iso}`) < BY_DAY[day] * (0.75 + rand(SEED + id) / 2);
}
