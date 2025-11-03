import React, { Suspense } from "react";
import MedidasClient from "./MedidasClient";

export default function MedidasPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <MedidasClient />
    </Suspense>
  );
}
