// src/types/tax.ts
export interface TaxCalculationOutput {
  totalAnnualIncome: number;
  taxPayableAnnually: number;
  taxPayableMonthly: number;
  takeHomeSalaryAnnually: number;
  takeHomeSalaryMonthly: number;
  taxSlabSummary: string;       // NEW - applicable slab
  taxSlabList: string;          // NEW - full list
}
