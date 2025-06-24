// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { useSearchParams, useRouter, usePathname } from "next/navigation";
// import { TaxForm } from "@/components/tax-form";
// import { TaxResults } from "@/components/tax-results";
// import type { TaxCalculationOutput } from "@/types/tax";
// import { Waves } from "lucide-react";

// export default function ClientPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const pathname = usePathname();

//   const [taxResult, setTaxResult] = useState<TaxCalculationOutput | null>(null);
//   const [submittedValues, setSubmittedValues] = useState<{
//     salary: number;
//     bonus?: number;
//     includeBonusInTaxableIncome: "yes" | "no";
//   } | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const resultsRef = useRef<HTMLDivElement>(null);

//   const salaryParam = searchParams.get("salary");
//   const bonusParam = searchParams.get("bonus");
//   const includeBonusParamRaw = searchParams.get("includeBonusInTaxableIncome");

//   const includeBonusParam: "yes" | "no" | undefined =
//     includeBonusParamRaw === "yes"
//       ? "yes"
//       : includeBonusParamRaw === "no"
//       ? "no"
//       : undefined;

//   const defaultParams = {
//     salary: salaryParam ? Number(salaryParam) : undefined,
//     bonus: bonusParam ? Number(bonusParam) : undefined,
//     includeBonusInTaxableIncome: includeBonusParam ?? "yes",
//   };

//   const handleCalculationResult = (
//     result: TaxCalculationOutput,
//     values: {
//       salary: number;
//       bonus?: number;
//       includeBonusInTaxableIncome: "yes" | "no";
//     }
//   ) => {
//     setTaxResult(result);
//     setSubmittedValues(values);

//     const newParams = new URLSearchParams();
//     newParams.set("salary", String(values.salary));
//     if (values.bonus !== undefined && !isNaN(values.bonus)) {
//       newParams.set("bonus", String(values.bonus));
//     } else {
//       newParams.delete("bonus");
//     }
//     newParams.set("includeBonusInTaxableIncome", values.includeBonusInTaxableIncome);
//     router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
//   };

//   const handleCalculationStart = () => {
//     setIsLoading(true);
//     setTaxResult(null);
//   };

//   const handleCalculationEnd = () => {
//     setIsLoading(false);
//   };

//     // Scroll to results when taxResult and submittedValues are ready, and not loading
//   useEffect(() => {
//     if (taxResult && submittedValues && !isLoading && resultsRef.current) {
//       setTimeout(() => {
//           resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//       }, 100); // small delay
//     }
//   }, [taxResult, submittedValues, isLoading]);

//   return (
//     <main className="flex min-h-screen flex-col items-center justify-start pt-4 sm:pt-6 md:pt-20 px-6 sm:px-12 md:px-24 bg-background font-body">
//       <header className="mb-10 text-center">
//         <div className="flex items-center justify-center mb-2">
//           <Waves className="h-12 w-12 text-primary" />
//           <h1 className="ml-3 text-5xl font-bold font-headline text-primary">TaxWise</h1>
//         </div>
//         <p className="text-lg text-muted-foreground">
//           Your simple guide to Pakistan&apos;s income tax.
//         </p>
//       </header>

//       <TaxForm
//         onCalculationResult={handleCalculationResult}
//         onCalculationStart={handleCalculationStart}
//         onCalculationEnd={handleCalculationEnd}
//         defaultValues={defaultParams}
//       />

//       {taxResult && submittedValues && !isLoading && (
//         <section
//           ref={resultsRef}
//           className="mt-8 w-full max-w-2xl animate-in fade-in duration-500"
//         >
//           <div className="mt-6">
//             <TaxResults results={taxResult} submittedValues={submittedValues} />
//           </div>
//         </section>
//       )}
//     </main>
//   );
// }
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { TaxForm, TaxFormValues } from "@/components/tax-form";
import { TaxResults } from "@/components/tax-results";
import type { TaxCalculationOutput } from "@/types/tax";
import { Waves } from "lucide-react";

export default function ClientPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [taxResult, setTaxResult] = useState<TaxCalculationOutput | null>(null);
  const [submittedValues, setSubmittedValues] = useState<TaxFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  const salaryParam = searchParams.get("salary");
  const bonusParam = searchParams.get("bonus");
  const includeBonusParamRaw = searchParams.get("includeBonusInTaxableIncome");

  const includeBonusParam: "yes" | "no" | undefined =
    includeBonusParamRaw === "yes"
      ? "yes"
      : includeBonusParamRaw === "no"
      ? "no"
      : undefined;

  const defaultParams: TaxFormValues | undefined =
    salaryParam && !isNaN(Number(salaryParam))
      ? {
          salary: Number(salaryParam),
          bonus: bonusParam && !isNaN(Number(bonusParam)) ? Number(bonusParam) : undefined,
          includeBonusInTaxableIncome: includeBonusParam ?? "yes",
        }
      : undefined;

  const handleCalculationResult = (
    result: TaxCalculationOutput,
    values: TaxFormValues
  ) => {
    setTaxResult(result);
    setSubmittedValues(values);

    const newParams = new URLSearchParams();
    newParams.set("salary", String(values.salary));
    if (values.bonus !== undefined && !isNaN(values.bonus)) {
      newParams.set("bonus", String(values.bonus));
    }
    newParams.set("includeBonusInTaxableIncome", values.includeBonusInTaxableIncome);

    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  const handleCalculationStart = () => {
    setIsLoading(true);
    setTaxResult(null);
  };

  const handleCalculationEnd = () => {
    setIsLoading(false);
  };

  // Scroll to results when ready
  useEffect(() => {
    if (taxResult && submittedValues && !isLoading && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [taxResult, submittedValues, isLoading]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start pt-4 sm:pt-6 md:pt-20 px-6 sm:px-12 md:px-24 bg-background font-body">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-2">
          <Waves className="h-12 w-12 text-primary" />
          <h1 className="ml-3 text-5xl font-bold font-headline text-primary">TaxWise</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Your simple guide to Pakistan&apos;s income tax.
        </p>
      </header>

      <TaxForm
        onCalculationResult={handleCalculationResult}
        onCalculationStart={handleCalculationStart}
        onCalculationEnd={handleCalculationEnd}
        defaultValues={defaultParams}
        autoSubmit={!hasAutoSubmitted}
        onAutoSubmit={() => setHasAutoSubmitted(true)}
      />

      {taxResult && submittedValues && !isLoading && (
        <section
          ref={resultsRef}
          className="mt-8 w-full max-w-2xl animate-in fade-in duration-500"
        >
          <div className="mt-6">
            <TaxResults results={taxResult} submittedValues={submittedValues} />
          </div>
        </section>
      )}
    </main>
  );
}