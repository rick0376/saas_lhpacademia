"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MedidasList } from "@/components/medidas/MedidasList";
import styles from "./styles.module.scss";

interface Aluno {
  id: string;
  nome: string;
}

export default function MedidasPage() {
  const searchParams = useSearchParams();
  const alunoId = searchParams.get("alunoId");
  const alunoNomeParam = searchParams.get("alunoNome");

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Busca alunos só se não tiver aluno selecionado
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
        .catch(() => setError("Erro ao carregar alunos"))
        .finally(() => setLoading(false));
    }
  }, [alunoId]);

  // Se tem aluno selecionado, mostra medidas
  if (alunoId && alunoNomeParam) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          Medidas do Aluno: {decodeURIComponent(alunoNomeParam)}
        </h1>
        <MedidasList alunoId={alunoId} alunoNome={alunoNomeParam} />
      </div>
    );
  }

  // Se está carregando a lista de alunos
  if (loading) return <p>Carregando alunos...</p>;
  if (error) return <p>{error}</p>;
  if (alunos.length === 0) return <p>Nenhum aluno encontrado.</p>;

  // Renderiza lista de alunos para selecionar
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione um aluno para ver as medidas</h1>
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
