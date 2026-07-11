export interface PaymentInstallment {
  amount: number;
  date: string;
}

export interface PaymentEntry {
  down: PaymentInstallment;
  second: PaymentInstallment;
  final: PaymentInstallment;
  additional: PaymentInstallment;
  notes: string;
  rating: number; // 0 = unrated, 1–5
}

/** Keyed by BudgetItem.id */
export type PaymentMap = Record<string, PaymentEntry>;
