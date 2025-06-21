"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { TaxForm } from "@/components/tax-form";
import { TaxResults } from "@/components/tax-results";
import type { TaxCalculationOutput } from "@/types/tax";
import { Waves } from "lucide-react";

export default function Home() {
  const searchParams = useSearchParams();
  const [taxResult, setTaxResult] = useState<TaxCalculationOutput | null>(null);
  const [submittedValues, setSubmittedValues] = useState<{
    salary: number;
    bonus?: number;
    includeBonusInTaxableIncome: "yes" | "no";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = React.useRef<HTMLDivElement | null>(null);

  const salaryParam = searchParams.get("salary");
  const bonusParam = searchParams.get("bonus");
  const includeBonusParam = searchParams.get("includeBonusInTaxableIncome");

  const defaultParams = {
    salary: salaryParam ? Number(salaryParam) : undefined,
    bonus: bonusParam ? Number(bonusParam) : undefined,
    includeBonusInTaxableIncome:
      includeBonusParam === "yes" || includeBonusParam === "no"
        ? includeBonusParam
        : "yes",
  } satisfies {
    salary?: number;
    bonus?: number;
    includeBonusInTaxableIncome?: "yes" | "no";
  };

  const handleCalculationResult = (
    result: TaxCalculationOutput,
    values: {
      salary: number;
      bonus?: number;
      includeBonusInTaxableIncome: "yes" | "no";
    }
  ) => {
    setTaxResult(result);
    setSubmittedValues(values);
  };

  const handleCalculationStart = () => {
    setIsLoading(true);
    setTaxResult(null);
  };

  const handleCalculationEnd = () => {
    setIsLoading(false);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 sm:p-12 md:p-24 bg-background font-body">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-2">
          <Waves className="h-12 w-12 text-primary" />
          <h1 className="ml-3 text-5xl font-bold font-headline text-primary">TaxWise</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Your simple guide to Pakistan's income tax.
        </p>
      </header>

      <TaxForm
        onCalculationResult={handleCalculationResult}
        onCalculationStart={handleCalculationStart}
        onCalculationEnd={handleCalculationEnd}
        defaultValues={defaultParams}
      />

      {taxResult && submittedValues && !isLoading && (
        <section className="mt-8 w-full max-w-2xl animate-in fade-in duration-500">
          <div ref={resultsRef} className="mt-6">
            <TaxResults
              results={taxResult}
              submittedValues={submittedValues}
            />
          </div>
        </section>
      )}
    </main>
  );
}
