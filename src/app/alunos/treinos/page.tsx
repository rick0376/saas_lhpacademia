"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import { ArrowLeft } from "lucide-react";
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
      setTreinos(data);
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
          <h1>Meus Treinos</h1>
        </div>

        {treinos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aguarde seu treinador atribuir treinos ativos.</p>
            <p className={styles.emptySubtext}>
              Entre em contato se precisar de atualizações.
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Nome</th>
                  <th className={styles.th}>Descrição</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Iniciado em</th>
                  <th className={styles.thActions}>Ações</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {treinos.map((treino) => (
                  <tr key={treino.id} className={styles.tr}>
                    <td className={styles.name}>{treino.nome}</td>
                    <td className={styles.description} title={treino.descricao}>
                      {treino.descricao || "Sem descrição"}
                    </td>
                    <td className={styles.status}>
                      <span
                        className={
                          treino.ativo
                            ? styles.statusAtivo
                            : styles.statusInativo
                        }
                      >
                        {treino.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className={styles.date}>
                      {new Date(treino.dataInicio).toLocaleDateString("pt-BR")}
                    </td>
                    <td className={styles.actions}>
                      <Link
                        href={`/alunos/treinos/${treino.id}`}
                        className={styles.viewButton}
                      >
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {treinos.length > 0 && (
          <div className={styles.footer}>
            Mostrando {treinos.length} treino(s) ativo(s).
          </div>
        )}
      </div>
    </AlunoLayout>
  );
}
