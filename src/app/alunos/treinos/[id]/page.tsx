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
  carga?: string; // ✅ ADICIONADO
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

    try {
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro: ${response.status} - ${errText}`);
      }

      const data: TreinoDetalhes = await response.json();
      setDetalhes(data);
    } catch (err: any) {
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
          <>
            {/* ✅ TABELA DESKTOP */}
            <div className={styles.tableWrapper}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.th}>Exercício</th>
                      <th className={styles.th}>Séries</th>
                      <th className={styles.th}>Repetições</th>
                      <th className={styles.th}>Carga</th>
                      <th className={styles.th}>Descanso</th>
                      <th className={styles.th}>Observações</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {detalhes.exercicios.map((ex, index) => (
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
                          <span className={styles.exNumber}>{index + 1}.</span>
                          {ex.nome}
                        </td>
                        <td className={styles.series}>{ex.series}x</td>
                        <td className={styles.reps}>{ex.reps}</td>
                        <td className={styles.carga}>{ex.carga || "Livre"}</td>
                        <td className={styles.descanso}>{ex.descanso}</td>
                        <td className={styles.exDesc}>
                          <div className={styles.descScrollable}>
                            {ex.descricao || "—"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ CARDS MOBILE */}
            <div className={styles.cardsContainer}>
              {detalhes.exercicios.map((ex, index) => (
                <div key={ex.id} className={styles.exercicioCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardNumber}>{index + 1}</span>
                    <h3
                      className={`${styles.cardTitle} ${
                        ex.fotoExecucao ? styles.clickable : ""
                      }`}
                      onClick={() => openModal(ex)}
                    >
                      {ex.nome}
                      {ex.fotoExecucao && (
                        <span className={styles.photoIcon}>📷</span>
                      )}
                    </h3>
                  </div>

                  <div className={styles.cardGrid}>
                    <div className={styles.cardItem}>
                      <span className={styles.cardLabel}>Séries</span>
                      <span className={styles.cardValue}>{ex.series}x</span>
                    </div>
                    <div className={styles.cardItem}>
                      <span className={styles.cardLabel}>Repetições</span>
                      <span className={styles.cardValue}>{ex.reps}</span>
                    </div>
                    <div className={styles.cardItem}>
                      <span className={styles.cardLabel}>Carga</span>
                      <span className={styles.cardValue}>
                        {ex.carga || "Livre"}
                      </span>
                    </div>
                    <div className={styles.cardItem}>
                      <span className={styles.cardLabel}>Descanso</span>
                      <span className={styles.cardValue}>{ex.descanso}</span>
                    </div>
                  </div>

                  {ex.descricao && (
                    <div className={styles.cardObs}>
                      <span className={styles.obsLabel}>Observações:</span>
                      <p className={styles.obsText}>{ex.descricao}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {detalhes.exercicios.length > 0 && (
          <div className={styles.footer}>
            <strong>{detalhes.exercicios.length}</strong> exercício(s) • Bom
            treino! 💪
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
