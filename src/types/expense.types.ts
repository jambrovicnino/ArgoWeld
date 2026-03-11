export type ExpenseCategory = 'transport' | 'gorivo' | 'nastanitev' | 'dnevnice' | 'orodje' | 'dovoljenja' | 'drugo';

export interface Expense {
  id: number;
  projekt_id: number | null;
  projekt_naziv?: string;
  kategorija: ExpenseCategory;
  znesek: number;
  datum: string;
  opis: string;
  vozilo?: string;
  kilometri?: number;
}
