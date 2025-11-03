"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

interface Aluno {
  id: string;
  nome: string;
}

export default function MedidasPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAlunos() {
      try {
        setLoading(true);
        const res = await fetch("/api/alunos");
        if (!res.ok) throw new Error("Falha ao buscar alunos");
        const data = await res.json();
        setAlunos(data);
      } catch {
        setError("Erro ao carregar alunos");
      } finally {
        setLoading(false);
      }
    }
    fetchAlunos();
  }, []);

  if (loading) return <p>Carregando alunos...</p>;
  if (error) return <p>{error}</p>;
  if (alunos.length === 0) return <p>Nenhum aluno encontrado.</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione um Aluno para ver as Medidas</h1>
      <ul className={styles.alunoList}>
        {alunos.map((aluno) => (
          <li key={aluno.id} className={styles.alunoItem}>
            <Link
              href={`/dashboard/medidas/${aluno.id}`}
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
