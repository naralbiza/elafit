export function formatKz(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 Kz';
  return `${Math.round(amount).toLocaleString('pt-AO')} Kz`;
}
