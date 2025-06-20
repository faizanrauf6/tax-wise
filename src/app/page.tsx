// src/app/page.tsx
"use client";

// import type * as React from 'react';
import React, { useState } from 'react';
import { TaxForm } from '@/components/tax-form';
import { TaxResults } from '@/components/tax-results';
import type { TaxCalculationOutput } from '@/types/tax'; // Corrected import path
import { Waves } from 'lucide-react';

export default function Home() {
  const [taxResult, setTaxResult] = useState<TaxCalculationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = React.useRef<HTMLDivElement | null>(null);

  const handleCalculationResult = (result: TaxCalculationOutput) => {
    setTaxResult(result);
  };

  const handleCalculationStart = () => {
    setIsLoading(true);
    setTaxResult(null); // Clear previous results
  };
  
  const handleCalculationEnd = () => {
    setIsLoading(false);
    // 🔹 Scroll to TaxResults smoothly after delay (optional for better experience)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 sm:p-12 md:p-24 bg-background font-body">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-2">
          <Waves className="h-12 w-12 text-primary" />
          <h1 className="ml-3 text-5xl font-bold font-headline text-primary">
            TaxWise
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Your simple guide to Pakistan's income tax.
        </p>
      </header>

      <TaxForm 
        onCalculationResult={handleCalculationResult}
        onCalculationStart={handleCalculationStart}
        onCalculationEnd={handleCalculationEnd}
      />

      {taxResult && !isLoading && (
        <div
          ref={resultsRef}
          className="mt-8 w-full max-w-2xl animate-in fade-in duration-500"
        >
          <TaxResults results={taxResult} />
        </div>
      )}
    </main>
  );
}
