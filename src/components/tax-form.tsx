"use client";

import React, { useEffect, useState } from "react";
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
  autoSubmit?: boolean;
  onAutoSubmit?: () => void;
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
  autoSubmit = false,
  onAutoSubmit,
}: TaxFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salaryValue, setSalaryValue] = useState(
    defaultValues.salary !== undefined ? String(defaultValues.salary) : ""
  );
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
  const showPercentages =
    salaryValue.length > 0 && !isNaN(salaryNumber) && salaryNumber > 0;

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
        ? Math.round(
            (monthlySalary + monthlyBonus) * 12 -
              taxPayableAnnually -
              providentFund * 12
          )
        : Math.round(
            monthlySalary * 12 -
              taxPayableAnnually -
              providentFund * 12 +
              monthlyBonus * 12
          );

      const takeHomeMonthly = Math.round(takeHomeAnnual / 12);

      const result: TaxCalculationOutput = {
        totalAnnualIncome: (monthlySalary + monthlyBonus) * 12,
        taxPayableAnnually,
        taxPayableMonthly,
        takeHomeSalaryAnnually: takeHomeAnnual,
        takeHomeSalaryMonthly: takeHomeMonthly,
        taxSlabSummary: taxDetails.taxSlabSummary,
        taxSlabList: taxDetails.taxSlabList,
      };

      onCalculationResult(result, values);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error calculating tax",
        description: (error as Error)?.message || "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
      onCalculationEnd();
    }
  }

  // Inside TaxForm component, after form setup
  useEffect(() => {
    if (autoSubmit && defaultValues?.salary) {
      form.handleSubmit(onSubmit)();
      onAutoSubmit?.();
    }
  }, [autoSubmit]);

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Calculate Your Tax</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Salary (PKR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Enter your monthly salary"
                      {...field}
                      value={salaryValue}
                      onChange={(e) => {
                        setSalaryValue(e.target.value);
                        field.onChange(Number(e.target.value));
                      }}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                  {showPercentages && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Exempt Medical Allowance (9.1%): PKR {ninePointOnePercent.toLocaleString()}
                      , Provident Fund (5%): PKR {fivePercent.toLocaleString()}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Bonus (PKR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Enter your monthly bonus (optional)"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeBonusInTaxableIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Include Bonuses in Taxable Income?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem>
                        <FormLabel className="cursor-pointer flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="include-bonus-yes" />
                          <span>Yes</span>
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <FormLabel className="cursor-pointer flex items-center space-x-2">
                          <RadioGroupItem value="no" id="include-bonus-no" />
                          <span>No</span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={isSubmitting} type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calculate Tax
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}