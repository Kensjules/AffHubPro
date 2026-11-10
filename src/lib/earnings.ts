export interface EarningRow { amount: number | string | null; commission?: number | string | null; date: string }

export const rowValue = (r: EarningRow) => Number(r.commission) || Number(r.amount) || 0;

export function sumBetween(rows: EarningRow[], start: Date, end: Date) {
  return rows
    .filter((r) => { const d = new Date(r.date); return d >= start && d < end; })
    .reduce((s, r) => s + rowValue(r), 0);
}

export function goalProgress(earned: number, goal: number | null | undefined) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((earned / goal) * 100));
}
