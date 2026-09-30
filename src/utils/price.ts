/**
 * A product price as the customer is charged it: whole rupees, each unit rounded half-up.
 *
 * The server prices every bill this way (CartServiceImpl.calculateCheckoutSummary and the Daily
 * Essentials cart round the unit price before multiplying by quantity), so a price shown on a
 * card, a sheet or a cart line must be rounded the same way or it disagrees with the bill: a
 * shop's small discounts leave raw prices like 149.625, which the bill charges as 150.
 *
 * Compare rounded values too (MRP vs price): 149.625 against an MRP of 150 is no discount once
 * both are whole rupees, and showing "₹150 ₹150" struck through would be wrong.
 */
export const wholeRupees = (value: number | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
};
