"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MedidasList } from "@/components/medidas/MedidasList";
import styles from "./styles.module.scss";

interface Aluno {
  id: string;
  nome: string;
}

export default function MedidasPage() {
  const searchParams = useSearchParams();
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [alunoNome, setAlunoNome] = useState<string | null>(null);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAlunoId(searchParams.get("alunoId"));
    setAlunoNome(searchParams.get("alunoNome"));
  }, [searchParams]);

  useEffect(() => {
    if (!alunoId) {
      setLoading(true);
      fetch("/api/alunos")
        .then((res) => {
          if (!res.ok) throw new Error("Erro ao carregar alunos");
          return res.json();
        })
        .then((data: Aluno[]) => {
          setAlunos(data);
          setError("");
        })
        .catch(() => {
          setError("Erro ao carregar alunos");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [alunoId]);

  if (alunoId && alunoNome) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          Medidas do Aluno: {decodeURIComponent(alunoNome)}
        </h1>
        <MedidasList alunoId={alunoId} alunoNome={alunoNome} />
      </div>
    );
  }

  if (loading) return <p>Carregando alunos...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione um Aluno para ver as Medidas</h1>
      <ul className={styles.alunoList}>
        {alunos.map((aluno) => (
          <li key={aluno.id} className={styles.alunoItem}>
            <Link
              href={`/dashboard/medidas?alunoId=${
                aluno.id
              }&alunoNome=${encodeURIComponent(aluno.nome)}`}
              className={styles.alunoLink}
            >
              {aluno.nome}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
