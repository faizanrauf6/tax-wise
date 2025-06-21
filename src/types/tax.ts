// src/types/tax.ts
export interface TaxCalculationOutput {
  totalAnnualIncome: number;
  taxPayableAnnually: number;
  taxPayableMonthly: number;
  takeHomeSalaryAnnually: number;
  takeHomeSalaryMonthly: number;
  taxSlabSummary: string;
  taxSlabList: string;
}
