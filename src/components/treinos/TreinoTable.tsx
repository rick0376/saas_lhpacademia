"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";

interface Treino {
  id: string;
  nome: string;
  objetivo?: string;
  ativo: boolean;
  dataInicio: string;
  aluno: {
    nome: string;
  };
  _count: {
    exercicios: number;
    cronogramas: number;
  };
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

interface TreinoTableProps {
  alunoId?: string;
}

export const TreinoTable: React.FC<TreinoTableProps> = ({ alunoId }) => {
  const { data: session, status } = useSession();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    treino?: Treino;
  }>({ isOpen: false });
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "treinos",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  });
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);

  const fetchPermissoes = async () => {
    try {
      if (session?.user?.role === "SUPERADMIN") {
        setPermissoes({
          recurso: "treinos",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        });
        setPermissoesCarregadas(true);
        return;
      }

      const response = await fetch("/api/permissoes/usuario");
      if (!response.ok) throw new Error("Erro ao buscar permissões");
      const data = await response.json();

      const permissaoTreinos = data.find(
        (p: Permissao) => p.recurso === "treinos"
      );

      if (permissaoTreinos) {
        setPermissoes(permissaoTreinos);
      } else {
        setPermissoes({
          recurso: "treinos",
          criar: false,
          ler: false,
          editar: false,
          deletar: false,
        });
      }
      setPermissoesCarregadas(true);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setPermissoes({
        recurso: "treinos",
        criar: false,
        ler: false,
        editar: false,
        deletar: false,
      });
      setPermissoesCarregadas(true);
    }
  };

  const fetchTreinos = async () => {
    try {
      setLoading(true);
      if (!permissoesCarregadas || !permissoes.ler) return;

      const url = alunoId ? `/api/treinos?alunoId=${alunoId}` : "/api/treinos";
      const response = await fetch(url);

      if (!response.ok) throw new Error("Erro ao buscar treinos");
      const data = await response.json();
      setTreinos(data);
      setError("");
    } catch (err) {
      setError("Erro ao carregar treinos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissoesCarregadas && permissoes.ler) {
      fetchTreinos();
    }
  }, [alunoId, permissoesCarregadas, permissoes.ler]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
    }
  }, [status, session]);

  const handleDelete = async (id: string) => {
    if (!permissoes.deletar) {
      alert("⛔ Você não tem permissão para excluir treinos");
      return;
    }

    try {
      const response = await fetch(`/api/treinos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir treino");
      setTreinos(treinos.filter((t) => t.id !== id));
      setDeleteModal({ isOpen: false });
    } catch (err) {
      alert("Erro ao excluir treino");
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  if (!permissoesCarregadas || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando treinos...</p>
      </div>
    );
  }

  if (!permissoes.ler && session?.user?.role !== "SUPERADMIN") {
    return (
      <div className={styles.error}>
        <p>⛔ Você não tem permissão para visualizar treinos</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (treinos.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📋</div>
        <h3>Nenhum treino cadastrado</h3>
        <p>Comece criando o primeiro treino</p>
      </div>
    );
  }

  return (
    <>
      {/* Botão Novo Treino - Só aparece se tiver permissão */}
      {permissoes.criar && !alunoId && (
        <div className={styles.topActions}>
          <Link href="/dashboard/treinos/novo" className={styles.addButton}>
            <span className={styles.icon}>+</span>
            Novo Treino
          </Link>
        </div>
      )}

      <div className={styles.grid}>
        {treinos.map((treino) => (
          <div key={treino.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{treino.nome}</h3>
              <span
                className={`${styles.statusBadge} ${
                  treino.ativo ? styles.ativo : styles.inativo
                }`}
              >
                {treino.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Aluno:</span>
                <span className={styles.value}>{treino.aluno.nome}</span>
              </div>

              {treino.objetivo && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Objetivo:</span>
                  <span className={styles.value}>{treino.objetivo}</span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.label}>Início:</span>
                <span className={styles.value}>
                  {formatDate(treino.dataInicio)}
                </span>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {treino._count.exercicios}
                  </span>
                  <span className={styles.statLabel}>Exercícios</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {treino._count.cronogramas}
                  </span>
                  <span className={styles.statLabel}>Dias</span>
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link
                href={`/dashboard/treinos/${treino.id}`}
                className={styles.viewButton}
              >
                👁️ Ver Detalhes
              </Link>
              {permissoes.editar && (
                <Link
                  href={`/dashboard/treinos/${treino.id}/editar`}
                  className={styles.editButton}
                >
                  ✏️ Editar
                </Link>
              )}
              {permissoes.deletar && (
                <button
                  onClick={() => setDeleteModal({ isOpen: true, treino })}
                  className={styles.deleteButton}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        title="Confirmar Exclusão"
        size="small"
      >
        <div className={styles.modalContent}>
          <p>
            Tem certeza que deseja excluir o treino{" "}
            <strong>{deleteModal.treino?.nome}</strong>?
          </p>
          <p className={styles.warning}>
            ⚠️ Todos os exercícios e cronogramas serão excluídos!
          </p>

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deleteModal.treino && handleDelete(deleteModal.treino.id)
              }
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
