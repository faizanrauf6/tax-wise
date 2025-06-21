"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TaxCalculationOutput } from "@/types/tax";

const formSchema = z.object({
  salary: z.coerce.number().positive({ message: "Salary must be a positive number." }),
  bonus: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : Number(val)),
    z.number().positive({ message: "Bonus must be a positive number." }).optional()
  ),
  includeBonusInTaxableIncome: z.enum(["yes", "no"]).default("yes"),
});

export type TaxFormValues = z.infer<typeof formSchema>;

interface TaxFormProps {
  onCalculationResult: (result: TaxCalculationOutput, values: TaxFormValues) => void;
  onCalculationStart: () => void;
  onCalculationEnd: () => void;
  defaultValues?: Partial<TaxFormValues>;
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

  const currentSlab = taxSlabs.find(
    (slab) => annualIncomeToTax >= slab.min && annualIncomeToTax <= slab.max
  );

  if (!currentSlab) {
    return {
      totalAnnualIncome: annualIncomeToTax,
      taxPayableAnnually: 0,
      taxPayableMonthly: 0,
      takeHomeSalaryAnnually: annualIncomeToTax,
      takeHomeSalaryMonthly: annualIncomeToTax / 12,
      taxSlabSummary: `❌ Error: Could not determine tax slab.`,
      taxSlabList: "",
    };
  }

  const incomeTaxableAtCurrentRate =
    annualIncomeToTax - (currentSlab.min === 0 ? 0 : currentSlab.min - 1);
  const taxAtCurrentRate = incomeTaxableAtCurrentRate * currentSlab.rate;
  taxPayableAnnually = currentSlab.base + taxAtCurrentRate;

  const taxPayableMonthly = taxPayableAnnually / 12;
  const takeHomeSalaryAnnually = annualIncomeToTax - taxPayableAnnually;
  const takeHomeSalaryMonthly = takeHomeSalaryAnnually / 12;

  const formatNum = (num: number) =>
    num.toLocaleString("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const taxSlabSummary = `Applicable Tax Slab: PKR ${formatNum(
    currentSlab.min
  )} – ${
    currentSlab.max === Infinity ? "∞" : `PKR ${formatNum(currentSlab.max)}`
  } (${(currentSlab.rate * 100).toFixed(0)}%${
    currentSlab.base > 0 ? ` + PKR ${formatNum(currentSlab.base)}` : ""
  })`;

  const taxSlabList =
    `Current Tax Slabs (FY 2025–26):\n` +
    taxSlabs
      .map((slab, i) => {
        const min = `PKR ${formatNum(slab.min)}`;
        const max = slab.max === Infinity ? "∞" : `PKR ${formatNum(slab.max)}`;
        const rate = `${(slab.rate * 100).toFixed(0)}%`;
        const base = slab.base > 0 ? ` + PKR ${formatNum(slab.base)}` : "";
        return `${i + 1}. ${min} – ${max}: ${rate}${base}`;
      })
      .join("\n");

  return {
    totalAnnualIncome: annualIncomeToTax,
    taxPayableAnnually,
    taxPayableMonthly,
    takeHomeSalaryAnnually,
    takeHomeSalaryMonthly,
    taxSlabSummary,
    taxSlabList,
  };
}

export function TaxForm({
  onCalculationResult,
  onCalculationStart,
  onCalculationEnd,
  defaultValues = {},
}: TaxFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salaryValue, setSalaryValue] = useState(defaultValues.salary?.toString() ?? "");
  const { toast } = useToast();

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salary: defaultValues.salary ?? ("" as unknown as number),
      bonus: defaultValues.bonus ?? ("" as unknown as number),
      includeBonusInTaxableIncome: defaultValues.includeBonusInTaxableIncome ?? "yes",
    },
  });

  const salaryNumber = Number(salaryValue);
  const showPercentages = salaryValue.length > 0 && !isNaN(salaryNumber) && salaryNumber > 0;

  const ninePointOnePercent = showPercentages ? Math.round(salaryNumber * 0.091) : 0;
  const fivePercent = showPercentages ? Math.round(salaryNumber * 0.05) : 0;

  async function onSubmit(values: TaxFormValues) {
    onCalculationStart();
    setIsSubmitting(true);
    try {
      const monthlySalary = values.salary;
      const monthlyBonus = values.bonus || 0;
      const includeBonusInTaxable = values.includeBonusInTaxableIncome === "yes";

      const medicalAllowance = Math.round(monthlySalary * 0.091);
      const providentFund = Math.round(monthlySalary * 0.05);
      const taxableSalary = monthlySalary - medicalAllowance;

      const annualTaxableIncome = includeBonusInTaxable
        ? Math.round((taxableSalary + monthlyBonus) * 12)
        : Math.round(taxableSalary * 12);

      const taxDetails = calculateLocalTax(annualTaxableIncome);
      const taxPayableAnnually = Math.round(taxDetails.taxPayableAnnually);
      const taxPayableMonthly = Math.round(taxPayableAnnually / 12);

      const takeHomeAnnual = includeBonusInTaxable
        ? Math.round((monthlySalary + monthlyBonus) * 12 - taxPayableAnnually - providentFund * 12)
        : Math.round(monthlySalary * 12 - taxPayableAnnually - providentFund * 12 + monthlyBonus * 12);

      const takeHomeMonthly = Math.round(takeHomeAnnual / 12);

      onCalculationResult(
        {
          totalAnnualIncome: Math.round((monthlySalary + monthlyBonus) * 12),
          taxPayableAnnually,
          taxPayableMonthly,
          taxSlabSummary: taxDetails.taxSlabSummary,
          taxSlabList: taxDetails.taxSlabList,
          takeHomeSalaryAnnually: takeHomeAnnual,
          takeHomeSalaryMonthly: takeHomeMonthly,
        },
        values
      );
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
        <CardTitle className="text-2xl font-headline text-primary">
          Enter Monthly Salary Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Salary Field */}
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Salary (PKR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 100000"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value));
                        setSalaryValue(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Readonly calculated fields */}
            {showPercentages && (
              <div className="flex space-x-4">
                <FormItem className="flex-1">
                  <FormLabel>9.1% (Medical Allowance)</FormLabel>
                  <Input value={ninePointOnePercent.toLocaleString("en-PK")} readOnly />
                </FormItem>
                <FormItem className="flex-1">
                  <FormLabel>5% (Provident Fund)</FormLabel>
                  <Input value={fivePercent.toLocaleString("en-PK")} readOnly />
                </FormItem>
              </div>
            )}

            {/* Bonus Field */}
            <FormField
              control={form.control}
              name="bonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Bonus (PKR, Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 10000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bonus Inclusion */}
            <FormField
              control={form.control}
              name="includeBonusInTaxableIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Include bonus in taxable income?</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col sm:flex-row sm:space-x-4"
                  >
                    <label htmlFor="bonus-yes" className="flex items-center space-x-2 cursor-pointer">
                      <RadioGroupItem value="yes" id="bonus-yes" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label htmlFor="bonus-no" className="flex items-center space-x-2 cursor-pointer">
                      <RadioGroupItem value="no" id="bonus-no" />
                      <span className="text-sm">No (add to take-home only)</span>
                    </label>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSubmitting}
            >
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

