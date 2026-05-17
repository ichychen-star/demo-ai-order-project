const NTD_FORMATTER = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatNtd(amount: number): string {
  return NTD_FORMATTER.format(amount);
}
