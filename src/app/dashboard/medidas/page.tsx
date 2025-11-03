import React, { Suspense } from "react";
//import MedidasClient from "./MedidasClient";
import MedidasClient from "@/components/listas/medidas/index";

export default function MedidasPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <MedidasClient />
    </Suspense>
  );
}
