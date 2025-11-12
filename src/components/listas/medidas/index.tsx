"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MedidasList } from "@/components/medidas/MedidasList";
import styles from "./styles.module.scss";

import { FiSearch } from "react-icons/fi";

interface Aluno {
  id: string;
  nome: string;
}

export default function MedidasClient() {
  const searchParams = useSearchParams();
  const alunoId = searchParams.get("alunoId");
  const alunoNomeParam = searchParams.get("alunoNome");

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");

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

  if (loading) return <p>Carregando alunos...</p>;
  if (error) return <p>{error}</p>;

  // Filtro incremental, busca por início e insensível a maiúscula/minúscula
  const buscaNormalizada = busca.trim().toLowerCase();
  const alunosFiltrados =
    buscaNormalizada === ""
      ? alunos
      : alunos.filter((a) =>
          a.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .startsWith(
              buscaNormalizada.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            )
        );

  if (alunosFiltrados.length === 0) return <p>Nenhum aluno encontrado.</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione um aluno para ver as medidas</h1>
      <div className={styles.searchWrapper}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Digite o nome do aluno..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          autoFocus
        />
        <FiSearch className={styles.searchIcon} />
      </div>
      <ul className={styles.alunoList}>
        {alunosFiltrados.map((aluno) => (
          <li key={aluno.id} className={styles.alunoItem}>
            <Link
              href={`/dashboard/medidas?alunoId=${
                aluno.id
              }&alunoNome=${encodeURIComponent(aluno.nome)}`}
              className={styles.alunoLink} // Opcional, pode criar uma classe para link total
            >
              {aluno.nome}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
