"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react"; // ← Novo
import styles from "./styles.module.scss";

interface Avaliacao {
  id: string;
  tipo: string | null;
  resultado: string | null;
  observacoes: string | null;
  arquivo: string | null;
  data: string;
}

export default function ListaAvaliacoes({
  params,
}: {
  params: Promise<{ alunoId: string }>;
}) {
  // ← Promise
  const resolvedParams = use(params); // ← Await
  const alunoId = resolvedParams.alunoId;
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvaliacoes = async () => {
      try {
        const res = await fetch(`/api/alunos/avaliacoes?alunoId=${alunoId}`); // ← Usa resolved
        if (!res.ok) throw new Error("Erro ao buscar");
        const data = await res.json();
        setAvaliacoes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAvaliacoes();
  }, [alunoId]); // ← Depende de resolved

  if (loading)
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  if (error)
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Avaliações do Aluno</h1>
        <Link
          href={`/admin/alunos/${alunoId}/avaliacoes/nova`}
          className={styles.newButton}
        >
          {" "}
          // ← Usa resolved Nova Avaliação
        </Link>
      </div>
      {avaliacoes.length === 0 ? (
        <div className={styles.empty}>Nenhuma avaliação cadastrada.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data</th>
                <th>Resultado</th>
                <th>Observações</th>
                <th>Arquivo</th>
              </tr>
            </thead>
            <tbody>
              {avaliacoes.map((av) => (
                <tr key={av.id}>
                  <td className={styles.cell}>{av.tipo || "N/A"}</td>
                  <td className={styles.cell}>
                    {new Date(av.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={styles.cell}>{av.resultado || "N/A"}</td>
                  <td
                    className={styles.cellObservacoes}
                    title={av.observacoes || "N/A"}
                  >
                    {av.observacoes || "N/A"}
                  </td>
                  <td className={styles.cell}>
                    {av.arquivo ? (
                      <a
                        href={av.arquivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        Ver PDF
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href={`/admin/alunos/${alunoId}`} className={styles.backLink}>
        {" "}
        // ← Usa resolved ← Voltar ao Aluno
      </Link>
    </div>
  );
}
