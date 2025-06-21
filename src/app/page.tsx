import React, { Suspense } from "react";
export const dynamic = "force-dynamic";
import ClientPage from "./client-page";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage />
    </Suspense>
  );
}
