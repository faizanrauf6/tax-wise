// src/components/tax-results.tsx
import type * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Banknote, ClipboardList, Percent, Sigma, Wallet } from 'lucide-react';
import type { TaxCalculationOutput } from '@/types/tax'; 

interface TaxResultsProps {
  results: TaxCalculationOutput;
}

export function TaxResults({ results }: TaxResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <Card className="w-full max-w-2xl shadow-xl mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Percent className="mr-2 h-7 w-7 text-accent" /> Tax Calculation Summary
        </CardTitle>
        <CardDescription>
          Here's your income tax summary based on Pakistan tax slabs for 2025-2026.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary flex items-center">
            <Sigma className="mr-2 h-5 w-5 text-accent" />
            Total Income
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-secondary/50 p-4">
              <CardContent className="p-0">
                <p className="text-sm text-secondary-foreground mb-1">Annually</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(results.totalAnnualIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 p-4">
              <CardContent className="p-0">
                <p className="text-sm text-secondary-foreground mb-1">Monthly</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(results.totalAnnualIncome / 12)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary flex items-center">
            <Banknote className="mr-2 h-5 w-5 text-accent" />
            Tax Payable
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-secondary/50 p-4">
              <CardContent className="p-0">
                <p className="text-sm text-secondary-foreground mb-1">Annually</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(results.taxPayableAnnually)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 p-4">
              <CardContent className="p-0">
                <p className="text-sm text-secondary-foreground mb-1">Monthly</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(results.taxPayableMonthly)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-accent" />
            Take-Home Salary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-secondary/50 p-4">
              <CardContent className="p-0">
                <p className="text-sm text-secondary-foreground mb-1">Annually</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(results.takeHomeSalaryAnnually)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 p-4">
              <CardContent className="p-0">
                <p className="text-sm text-secondary-foreground mb-1">Monthly</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(results.takeHomeSalaryMonthly)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-lg font-semibold text-primary flex items-center mb-2">
            <ClipboardList className="mr-2 h-5 w-5 text-accent" />
            Tax Slab Breakdown
          </h3>
          <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-muted-foreground">
            {results.taxSlabBreakdown}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Disclaimer: This calculation is for estimation purposes only based on the provided tax slabs. Consult a tax professional for precise financial advice.
        </p>
      </CardFooter>
    </Card>
  );
}
