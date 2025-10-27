"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import styles from "./styles.module.scss";

interface Avaliacao {
  id: string;
  tipo: string | null;
  resultado: string | null;
  observacoes: string | null;
  arquivo: string | null;
  data: string;
}

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvaliacoes = async () => {
      try {
        const alunoId =
          localStorage.getItem("alunoId") || "cmh3lm26h00030gfcuq1chm08"; // Original: localStorage ou hardcoded
        console.log("🔍 Page: Buscando avaliações para alunoId:", alunoId);
        const res = await fetch(`/api/alunos/avaliacoes?alunoId=${alunoId}`);
        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status} - ${res.statusText}`);
        }
        const data = await res.json();
        setAvaliacoes(data); // Array real (ou [])
        console.log("✅ Page: Avaliações carregadas:", data.length);
      } catch (err: any) {
        console.error("❌ Page Erro fetch:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAvaliacoes(); // Roda imediatamente no mount
  }, []); // Dependência vazia: roda só uma vez

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Carregando avaliações...</div>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.error}>Erro ao carregar: {error}</div>
          <Link href="/alunos/dashboard" className={styles.backLink}>
            ← Voltar ao Dashboard
          </Link>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <h1>Avaliações Físicas</h1>
        {avaliacoes.length === 0 ? (
          <div className={styles.empty}>
            <p>Nenhuma avaliação cadastrada ainda.</p>
            <p>Aguarde o treinador agendar a próxima!</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Resultado</th>
                  <th>Observações</th>
                  <th>Arquivo PDF</th>
                </tr>
              </thead>
              <tbody>
                {avaliacoes.map((av) => (
                  <tr key={av.id}>
                    <td data-label="Tipo">{av.tipo || "N/A"}</td>
                    <td data-label="Data">
                      {new Date(av.data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td data-label="Resultado">{av.resultado || "N/A"}</td>
                    <td
                      className={styles.observacoes}
                      data-label="Observações"
                      title={av.observacoes || "N/A"}
                    >
                      {av.observacoes || "N/A"}
                    </td>
                    <td data-label="Arquivo PDF">
                      {av.arquivo ? (
                        <a
                          href={av.arquivo}
                          target="_blank"
                          rel="noopener noreferrer"
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
        <Link href="/alunos/dashboard" className={styles.backLink}>
          ← Voltar ao Dashboard
        </Link>
      </div>
    </AlunoLayout>
  );
}
