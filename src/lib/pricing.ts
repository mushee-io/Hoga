import Decimal from 'decimal.js';
export function priceQuote(base: string, minimum: string, maxDiscount: number, negotiation: boolean, offer?: string) {
  const standard = new Decimal(base), min = new Decimal(minimum);
  if (!standard.isPositive() || min.isNegative() || min.gt(standard) || !Number.isInteger(maxDiscount) || maxDiscount < 0 || maxDiscount > 100) throw new Error('Invalid pricing rules');
  const floor = Decimal.max(min, standard.mul(new Decimal(100).minus(maxDiscount)).div(100)).toDecimalPlaces(6, Decimal.ROUND_CEIL);
  const amount = !negotiation || !offer ? standard : Decimal.max(floor, Decimal.min(standard, new Decimal(offer)));
  if (!amount.isFinite() || amount.isNegative()) throw new Error('Invalid amount');
  return {amount:amount.toFixed(6),floor:floor.toFixed(6)};
}
