/**
 * Formats a numeric order ID into a branded order reference.
 * e.g. id=9, date=2026-07-06 → "SS-2026-0009"
 * @param {number|string} id
 * @param {string|Date} date
 * @returns {string}
 */
function fmtOrderId(id, date) {
  const year = new Date(date).getFullYear();
  return `SS-${year}-${String(id).padStart(4, '0')}`;
}

module.exports = { fmtOrderId };
