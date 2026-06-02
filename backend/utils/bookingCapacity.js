/** Max concurrent appointments per host across all their salons */
const HOST_MAX_CONCURRENT = 10;

/** Salons with 3–4 staff: cap concurrent bookings at this number */
const SALON_MAX_UNDER_FIVE_EMPLOYEES = 7;

/**
 * How many appointments may overlap at the same salon for a given time window.
 * - 1 staff → 1 booking
 * - 2 staff → 2 bookings
 * - 3–4 staff → up to 7 concurrent
 * - 5+ staff → one concurrent booking per employee
 */
function getSalonConcurrentLimit(numberOfEmployees) {
  const n = Math.max(1, Number(numberOfEmployees) || 1);
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n < 5) return SALON_MAX_UNDER_FIVE_EMPLOYEES;
  return n;
}

module.exports = {
  HOST_MAX_CONCURRENT,
  SALON_MAX_UNDER_FIVE_EMPLOYEES,
  getSalonConcurrentLimit,
};
