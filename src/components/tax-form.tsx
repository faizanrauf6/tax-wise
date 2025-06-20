// src/components/tax-form.tsx
"use client";

import type * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TaxCalculationOutput } from '@/types/tax'; // Adjust the import path as necessary

const formSchema = z.object({
  salary: z.coerce.number().positive({ message: "Salary must be a positive number." }),
  bonus: z.preprocess(
    (val) => (String(val).trim() === '' ? undefined : Number(val)),
    z.number().positive({ message: "Bonus must be a positive number." }).optional()
  ),
  includeBonusInTaxableIncome: z.enum(["yes", "no"]).default("yes"),
});

type TaxFormValues = z.infer<typeof formSchema>;

interface TaxFormProps {
  onCalculationResult: (result: TaxCalculationOutput) => void;
  onCalculationStart: () => void;
  onCalculationEnd: () => void;
}

const taxSlabs = [
  { min: 0, max: 600_000, rate: 0, base: 0 },
  { min: 600_001, max: 1_200_000, rate: 0.01, base: 0 },
  { min: 1_200_001, max: 2_200_000, rate: 0.11, base: 6000 },
  { min: 2_200_001, max: 3_200_000, rate: 0.23, base: 116000 },
  { min: 3_200_001, max: 4_100_000, rate: 0.30, base: 346000 },
  { min: 4_100_001, max: Infinity, rate: 0.35, base: 616000 },
];

function calculateLocalTax(annualIncomeToTax: number): TaxCalculationOutput {
  let taxPayableAnnually = 0;
  let taxSlabBreakdown = "";

  const currentSlab = taxSlabs.find(slab => annualIncomeToTax >= slab.min && annualIncomeToTax <= slab.max);

  if (!currentSlab) {
     return {
        totalAnnualIncome: annualIncomeToTax,
        taxPayableAnnually: 0,
        taxPayableMonthly: 0,
        taxSlabBreakdown: `Error: Could not determine tax slab for the given income of PKR ${annualIncomeToTax.toLocaleString('en-PK')}. Please ensure the income is a positive number.`,
        takeHomeSalaryAnnually: annualIncomeToTax,
        takeHomeSalaryMonthly: annualIncomeToTax / 12,
     };
  }

  const incomeTaxableAtCurrentRate = annualIncomeToTax - (currentSlab.min === 0 ? 0 : currentSlab.min - 1);
  const taxAtCurrentRate = incomeTaxableAtCurrentRate * currentSlab.rate;
  taxPayableAnnually = currentSlab.base + taxAtCurrentRate;

  const taxPayableMonthly = taxPayableAnnually / 12;
  const takeHomeSalaryAnnuallyFromThisCalc = annualIncomeToTax - taxPayableAnnually;
  const takeHomeSalaryMonthlyFromThisCalc = takeHomeSalaryAnnuallyFromThisCalc / 12;

  const formatNum = (num: number) => num.toLocaleString('en-PK', {minimumFractionDigits: 0, maximumFractionDigits: 2});
  
  if (currentSlab.min === 0 && currentSlab.rate === 0) { 
    if (annualIncomeToTax === 0) {
        taxSlabBreakdown = `Taxable Income: PKR ${formatNum(annualIncomeToTax)}\nNo tax is applicable.`;
    } else {
        taxSlabBreakdown = `Taxable Income: PKR ${formatNum(annualIncomeToTax)}\n` +
                           `Applicable Tax Rate: ${(currentSlab.rate * 100).toFixed(0)}%\n` +
                           `Tax Calculation: PKR ${formatNum(annualIncomeToTax)} × ${(currentSlab.rate * 100).toFixed(0)}% = PKR ${formatNum(taxPayableAnnually)}`;
    }
  } else {
    taxSlabBreakdown = `Tax calculation based on taxable annual income of PKR ${formatNum(annualIncomeToTax)}:\n\n` +
                       `1. Tax on income up to PKR ${formatNum(currentSlab.min === 0 ? 0 : currentSlab.min - 1)} (Fixed Amount from previous slabs): PKR ${formatNum(currentSlab.base)}\n\n` +
                       `2. Income falling in the current slab:\n` +
                       `   PKR ${formatNum(annualIncomeToTax)} - PKR ${formatNum(currentSlab.min === 0 ? 0 : currentSlab.min - 1)} = PKR ${formatNum(incomeTaxableAtCurrentRate)}\n\n` +
                       `3. Tax on this portion (PKR ${formatNum(incomeTaxableAtCurrentRate)} @ ${(currentSlab.rate * 100).toFixed(0)}%):\n` +
                       `   PKR ${formatNum(incomeTaxableAtCurrentRate)} × ${(currentSlab.rate * 100).toFixed(0)}% = PKR ${formatNum(taxAtCurrentRate)}\n\n` +
                       `4. Total Annual Tax Payable (on PKR ${formatNum(annualIncomeToTax)}):\n` +
                       `   PKR ${formatNum(currentSlab.base)} (Fixed Amount) + PKR ${formatNum(taxAtCurrentRate)} (Tax on current slab portion) = PKR ${formatNum(taxPayableAnnually)}`;
  }

  return {
    totalAnnualIncome: annualIncomeToTax, 
    taxPayableAnnually,
    taxPayableMonthly,
    taxSlabBreakdown,
    takeHomeSalaryAnnually: takeHomeSalaryAnnuallyFromThisCalc,
    takeHomeSalaryMonthly: takeHomeSalaryMonthlyFromThisCalc,
  };
}

export function TaxForm({ onCalculationResult, onCalculationStart, onCalculationEnd }: TaxFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salary: '' as unknown as number, 
      bonus: '' as unknown as number,
      includeBonusInTaxableIncome: "yes",
    },
  });

  async function onSubmit(values: TaxFormValues) {
    onCalculationStart();
    setIsSubmitting(true);
    try {
      const monthlySalary = values.salary;
      const monthlyBonus = values.bonus || 0;
      const includeBonusInTaxable = values.includeBonusInTaxableIncome === "yes";

      const actualTotalAnnualIncome = (monthlySalary + monthlyBonus) * 12; 

      let annualTaxableIncome: number;
      let calculatedTaxDetails: TaxCalculationOutput;
      let finalTakeHomeAnnually: number;
      let finalTaxSlabBreakdown: string;
      let finalTaxPayableAnnually: number;
      let finalTaxPayableMonthly: number;

      if (includeBonusInTaxable) {
        annualTaxableIncome = (monthlySalary + monthlyBonus) * 12;
        calculatedTaxDetails = calculateLocalTax(annualTaxableIncome);
        finalTaxPayableAnnually = calculatedTaxDetails.taxPayableAnnually;
        finalTaxPayableMonthly = calculatedTaxDetails.taxPayableMonthly;
        finalTakeHomeAnnually = calculatedTaxDetails.takeHomeSalaryAnnually;
        finalTaxSlabBreakdown = calculatedTaxDetails.taxSlabBreakdown;
      } else {
        annualTaxableIncome = monthlySalary * 12; 
        const annualBonusAmount = monthlyBonus * 12;
        
        calculatedTaxDetails = calculateLocalTax(annualTaxableIncome); 
        finalTaxPayableAnnually = calculatedTaxDetails.taxPayableAnnually;
        finalTaxPayableMonthly = calculatedTaxDetails.taxPayableMonthly;
        
        finalTakeHomeAnnually = calculatedTaxDetails.takeHomeSalaryAnnually + annualBonusAmount;
        finalTaxSlabBreakdown = calculatedTaxDetails.taxSlabBreakdown;
        if (monthlyBonus > 0) {
          finalTaxSlabBreakdown += `\n\nNote: Monthly bonus of PKR ${monthlyBonus.toLocaleString('en-PK')} (Annual: PKR ${annualBonusAmount.toLocaleString('en-PK')}) was not included in the above tax calculation and is added directly to the take-home salary.`;
        }
      }
      
      const finalTakeHomeMonthly = finalTakeHomeAnnually / 12;

      onCalculationResult({
        totalAnnualIncome: actualTotalAnnualIncome, 
        taxPayableAnnually: finalTaxPayableAnnually,
        taxPayableMonthly: finalTaxPayableMonthly,
        taxSlabBreakdown: finalTaxSlabBreakdown,
        takeHomeSalaryAnnually: finalTakeHomeAnnually,
        takeHomeSalaryMonthly: finalTakeHomeMonthly,
      });

    } catch (error) {
      console.error("Tax calculation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to calculate tax. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      onCalculationEnd();
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Enter Monthly Salary Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Salary (PKR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} aria-describedby="salary-error" />
                  </FormControl>
                  <FormMessage id="salary-error" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Bonus (PKR, Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} aria-describedby="bonus-error" />
                  </FormControl>
                  <FormMessage id="bonus-error" />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="includeBonusInTaxableIncome"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Include monthly bonus in taxable income calculation?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 pt-1"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" id="bonus-yes" />
                        </FormControl>
                        <FormLabel htmlFor="bonus-yes" className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" id="bonus-no" />
                        </FormControl>
                        <FormLabel htmlFor="bonus-no" className="font-normal">No (add to take-home after tax)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full !mb-4 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                "Calculate Tax"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
