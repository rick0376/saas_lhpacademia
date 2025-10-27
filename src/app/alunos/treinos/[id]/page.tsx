"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import Image from "next/image";
import { ArrowLeft, X } from "lucide-react";
import styles from "./styles.module.scss";

interface Exercício {
  id: string;
  nome: string;
  series: number;
  reps: string;
  descanso: string;
  descricao?: string;
  fotoExecucao?: string;
}

interface TreinoDetalhes {
  nome: string;
  descricao: string;
  exercicios: Exercício[];
}

export default function TreinoDetalhesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [detalhes, setDetalhes] = useState<TreinoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEx, setSelectedEx] = useState<Exercício | null>(null);

  const id = params.id as string;
  const alunoId = (session?.user as any)?.aluno?.id;
  const from = searchParams.get("from");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !alunoId || !id) {
      router.push("/alunos/treinos");
      return;
    }

    fetchDetalhes(id, alunoId);
  }, [status, session, id, alunoId, router]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEx(null);
    };
    if (selectedEx) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [selectedEx]);

  const fetchDetalhes = async (treinoId: string, alunoId: string) => {
    setLoading(true);
    setError("");

    const url = `/api/alunos/treinos/${treinoId}/exercicios?alunoId=${alunoId}`;
    console.log("🔍 Page: Fetching URL:", url);

    try {
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });

      console.log("🔍 Page: Response status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.log("❌ Page: Error body:", errText);
        throw new Error(`Erro: ${response.status} - ${errText}`);
      }

      const data: TreinoDetalhes = await response.json();
      setDetalhes(data);
    } catch (err: any) {
      console.error("❌ Page: Fetch error:", err);
      setError(err.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (ex: Exercício) => {
    if (ex.fotoExecucao) setSelectedEx(ex);
  };

  const closeModal = () => setSelectedEx(null);

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes do treino...</p>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.error}>
          <p className={styles.errorText}>{error}</p>
          <button
            onClick={() => fetchDetalhes(id, alunoId || "")}
            className={styles.retryButton}
          >
            Tentar novamente
          </button>
        </div>
      </AlunoLayout>
    );
  }

  if (!detalhes) {
    router.push("/alunos/treinos");
    return null;
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link
            href={
              from === "calendario" ? "/alunos/calendario" : "/alunos/treinos"
            }
            className={styles.backLink}
          >
            <ArrowLeft size={20} />
            {from === "calendario"
              ? "Voltar ao Calendário"
              : "Voltar à Lista de Treinos"}
          </Link>
          <h1>{detalhes.nome}</h1>
        </div>

        <div className={styles.treinoInfo}>
          <p className={styles.treinoDesc}>
            {detalhes.descricao || "Sem descrição adicional."}
          </p>
        </div>

        {detalhes.exercicios.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Este treino ainda não tem exercícios atribuídos.</p>
            <p className={styles.emptySubtext}>
              Seu treinador adicionará em breve.
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Exercício</th>
                  <th className={styles.th}>Séries</th>
                  <th className={styles.th}>Repetições</th>
                  <th className={styles.th}>Descanso</th>
                  <th className={styles.thDesc}>Descrição</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {detalhes.exercicios.map((ex) => (
                  <tr key={ex.id} className={styles.tr}>
                    <td
                      className={`${styles.exName} ${
                        ex.fotoExecucao ? styles.clickableEx : ""
                      }`}
                      onClick={() => openModal(ex)}
                      title={
                        ex.fotoExecucao
                          ? "Clique para ver foto de execução"
                          : ""
                      }
                    >
                      {ex.nome}
                    </td>
                    <td className={styles.series}>{ex.series}</td>
                    <td className={styles.reps}>{ex.reps}</td>
                    <td className={styles.descanso}>{ex.descanso}</td>
                    <td className={styles.exDesc} title={ex.descricao}>
                      {ex.descricao || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalhes.exercicios.length > 0 && (
          <div className={styles.footer}>
            Este treino contém {detalhes.exercicios.length} exercício(s).
          </div>
        )}

        {selectedEx && selectedEx.fotoExecucao && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={closeModal}>
                <X size={24} />
              </button>
              <div className={styles.modalImageContainer}>
                <Image
                  src={selectedEx.fotoExecucao}
                  alt={`Execução de ${selectedEx.nome}`}
                  fill
                  className={styles.modalImage}
                  sizes="(max-width: 768px) 90vw, 80vw"
                />
              </div>
              <p className={styles.modalTitle}>{selectedEx.nome}</p>
            </div>
          </div>
        )}
      </div>
    </AlunoLayout>
  );
}
