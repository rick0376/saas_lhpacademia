"use client";

import { useSearchParams } from "next/navigation";
import { MedidasList } from "@/components/medidas/MedidasList";
import styles from "./styles.module.scss";

export default function MedidasPage() {
  const searchParams = useSearchParams();
  const alunoId = searchParams.get("alunoId") || "";
  const alunoNome = searchParams.get("alunoNome") || "";

  if (!alunoId) {
    return <p className={styles.alert}>Aluno não informado.</p>;
  }

  return <MedidasList alunoId={alunoId} alunoNome={alunoNome} />;
}
