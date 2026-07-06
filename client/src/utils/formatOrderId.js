/** SS-2026-0009 */
export const fmtOrderId = (id, date) => {
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  return `SS-${year}-${String(id).padStart(4, '0')}`;
};
