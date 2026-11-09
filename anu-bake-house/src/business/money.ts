/** Parse user-entered rupees without floating-point multiplication or silent rounding. */
export function rupeesToPaise(value: string): number {
  const input = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(input)) {
    throw new Error('Enter a non-negative amount with at most two decimal places.');
  }
  const [whole, fraction = ''] = input.split('.');
  const paise = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (paise > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large.');
  return Number(paise);
}

export function formatINR(paise: number): string {
  if (!Number.isSafeInteger(paise) || paise < 0)
    throw new Error('Expected non-negative integer paise.');
  const whole = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(BigInt(paise) / 100n);
  return `${whole}.${String(paise % 100).padStart(2, '0')}`;
}
