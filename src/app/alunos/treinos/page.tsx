"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import styles from "./styles.module.scss";

interface Treino {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  dataInicio: string;
}

export default function TreinosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !(session.user as any)?.aluno?.id) {
      router.push("/alunos/login");
      return;
    }

    const alunoId = (session.user as any).aluno.id;
    fetchTreinos(alunoId);
  }, [status, session, router]);

  const fetchTreinos = async (alunoId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/alunos/treinos?alunoId=${alunoId}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`Erro: ${response.status}`);

      const data: Treino[] = await response.json();

      // ✅ NOVO - Ordena em ordem alfabética pelo nome
      const treinosOrdenados = data.sort((a, b) => {
        return a.nome.localeCompare(b.nome, "pt-BR");
      });

      /*
      // ✅ NOVO - Ordena em ordem crescente pela data de início
      const treinosOrdenados = data.sort((a, b) => {
        return (
          new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
        );
      });
      */

      setTreinos(treinosOrdenados);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar treinos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando seus treinos...</p>
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
            onClick={() =>
              fetchTreinos((session?.user as any)?.aluno?.id || "")
            }
            className={styles.retryButton}
          >
            Tentar novamente
          </button>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/alunos/dashboard" className={styles.backLink}>
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Link>
          <div className={styles.headerContent}>
            <h1>💪 Meus Treinos</h1>
            <p className={styles.subtitle}>
              {treinos.length > 0
                ? `${treinos.length} treino${
                    treinos.length > 1 ? "s" : ""
                  } ativo${treinos.length > 1 ? "s" : ""}`
                : "Nenhum treino ativo"}
            </p>
          </div>
        </div>

        {treinos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Dumbbell size={64} />
            </div>
            <h2>Nenhum treino disponível</h2>
            <p>Aguarde seu treinador atribuir treinos ativos.</p>
            <p className={styles.emptySubtext}>
              Entre em contato se precisar de atualizações.
            </p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {treinos.map((treino) => (
              <div key={treino.id} className={styles.treinoCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <TrendingUp size={24} />
                  </div>
                  <div className={styles.cardStatus}>
                    {treino.ativo ? (
                      <span className={styles.statusAtivo}>
                        <CheckCircle size={16} />
                        Ativo
                      </span>
                    ) : (
                      <span className={styles.statusInativo}>
                        <XCircle size={16} />
                        Inativo
                      </span>
                    )}
                  </div>
                </div>

                <h3 className={styles.cardTitle}>{treino.nome}</h3>

                <p className={styles.cardDescription}>
                  {treino.descricao || "Sem descrição disponível"}
                </p>

                <div className={styles.cardFooter}>
                  <div className={styles.cardDate}>
                    <Calendar size={16} />
                    <span>
                      Início:{" "}
                      {new Date(treino.dataInicio).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <Link
                    href={`/alunos/treinos/${treino.id}`}
                    className={styles.cardButton}
                  >
                    Ver Treino
                    <ArrowLeft
                      size={16}
                      style={{ transform: "rotate(180deg)" }}
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AlunoLayout>
  );
}
