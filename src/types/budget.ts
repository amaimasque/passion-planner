export interface BudgetItem {
  id: string;
  name: string;
  estimated: number;
  actual: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  note?: string;
  items: BudgetItem[];
}
