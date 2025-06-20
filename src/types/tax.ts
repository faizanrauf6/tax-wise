// src/types/tax.ts
export interface TaxCalculationOutput {
  totalAnnualIncome: number;
  taxPayableAnnually: number;
  taxPayableMonthly: number;
  taxSlabBreakdown: string;
  takeHomeSalaryAnnually: number;
  takeHomeSalaryMonthly: number;
}
