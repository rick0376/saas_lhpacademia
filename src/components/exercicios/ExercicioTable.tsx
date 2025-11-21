"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { GrupoMuscular } from "@/types";

interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: GrupoMuscular;
  descricao?: string;
  equipamento?: string;
  createdAt: string;
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

export const ExercicioTable = () => {
  const { data: session, status } = useSession();
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    exercicio?: Exercicio;
  }>({ isOpen: false });
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "exercicios",
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
          recurso: "exercicios",
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

      const permissaoExercicios = data.find(
        (p: Permissao) => p.recurso === "exercicios"
      );
      if (permissaoExercicios) {
        setPermissoes(permissaoExercicios);
      } else {
        setPermissoes({
          recurso: "exercicios",
          criar: false,
          ler: false,
          editar: false,
          deletar: false,
        });
      }
      setPermissoesCarregadas(true);
    } catch (error) {
      console.error("❌ Erro ao carregar permissões:", error);
      setPermissoes({
        recurso: "exercicios",
        criar: false,
        ler: false,
        editar: false,
        deletar: false,
      });
      setPermissoesCarregadas(true);
    }
  };

  const fetchExercicios = async (grupo = "", search = "") => {
    try {
      setLoading(true);
      if (!permissoesCarregadas || !permissoes.ler) return;

      let url = "/api/exercicios?";
      if (grupo) url += `grupoMuscular=${grupo}&`;
      if (search) url += `search=${encodeURIComponent(search)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar exercícios");
      const data = await response.json();
      setExercicios(data);
      setError("");
    } catch (err) {
      setError("Erro ao carregar exercícios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (permissoesCarregadas && permissoes.ler) {
        fetchExercicios(filtroGrupo, searchTerm);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [filtroGrupo, searchTerm, permissoesCarregadas, permissoes.ler]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
    }
  }, [status, session]);

  const handleFilter = () => {
    fetchExercicios(filtroGrupo, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!permissoes.deletar) {
      alert("⛔ Você não tem permissão para excluir exercícios");
      return;
    }

    try {
      const response = await fetch(`/api/exercicios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir exercício");
      setExercicios(exercicios.filter((e) => e.id !== id));
      setDeleteModal({ isOpen: false });
    } catch (err) {
      alert(
        "Erro ao excluir exercício. Verifique se não há treinos usando este exercício."
      );
      console.error(err);
    }
  };

  const getGrupoMuscularLabel = (grupo: string) => {
    const labels: Record<string, string> = {
      PEITO: "Peito",
      COSTAS: "Costas",
      OMBROS: "Ombros",
      BICEPS: "Bíceps",
      TRICEPS: "Tríceps",
      PERNAS: "Pernas",
      GLUTEOS: "Glúteos",
      ABDOMEN: "Abdômen",
      PANTURRILHA: "Panturrilha",
      ANTEBRACO: "Antebraço",
      CARDIO: "Cardio",
      FUNCIONAL: "Funcional",
    };
    return labels[grupo] || grupo;
  };

  const getGrupoMuscularColor = (grupo: string) => {
    const colors: Record<string, string> = {
      PEITO: "#ef4444",
      COSTAS: "#10b981",
      OMBROS: "#f59e0b",
      BICEPS: "#6366f1",
      TRICEPS: "#8b5cf6",
      PERNAS: "#ec4899",
      GLUTEOS: "#f472b6",
      ABDOMEN: "#14b8a6",
      PANTURRILHA: "#84cc16",
      ANTEBRACO: "#06b6d4",
      CARDIO: "#ef4444",
      FUNCIONAL: "#a855f7",
    };
    return colors[grupo] || "#6b7280";
  };

  if (!permissoesCarregadas || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando exercícios...</p>
      </div>
    );
  }

  if (!permissoes.ler && session?.user?.role !== "SUPERADMIN") {
    return (
      <div className={styles.error}>
        <p>⛔ Você não tem permissão para visualizar exercícios</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button
          onClick={() => fetchExercicios()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Botão Novo Exercício - Só aparece se tiver permissão */}
      {permissoes.criar && (
        <div className={styles.topActions}>
          <Link href="/dashboard/exercicios/novo" className={styles.addButton}>
            <span className={styles.icon}>+</span>
            Novo Exercício
          </Link>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos os grupos</option>
          <option value="PEITO">Peito</option>
          <option value="COSTAS">Costas</option>
          <option value="OMBROS">Ombros</option>
          <option value="BICEPS">Bíceps</option>
          <option value="TRICEPS">Tríceps</option>
          <option value="PERNAS">Pernas</option>
          <option value="GLUTEOS">Glúteos</option>
          <option value="ABDOMEN">Abdômen</option>
          <option value="PANTURRILHA">Panturrilha</option>
          <option value="ANTEBRACO">Antebraço</option>
          <option value="CARDIO">Cardio</option>
          <option value="FUNCIONAL">Funcional</option>
        </select>

        <button onClick={handleFilter} className={styles.filterButton}>
          🔍 Filtrar
        </button>

        <button
          onClick={() => {
            setFiltroGrupo("");
            setSearchTerm("");
            fetchExercicios();
          }}
          className={styles.clearButton}
        >
          ✕ Limpar
        </button>
      </div>

      {exercicios.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💪</div>
          <h3>Nenhum exercício encontrado</h3>
          <p>Comece adicionando exercícios à biblioteca</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {exercicios.map((exercicio) => (
            <div key={exercicio.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span
                  className={styles.grupoBadge}
                  style={{
                    backgroundColor: getGrupoMuscularColor(
                      exercicio.grupoMuscular
                    ),
                  }}
                >
                  {getGrupoMuscularLabel(exercicio.grupoMuscular)}
                </span>
                {exercicio.equipamento && (
                  <span className={styles.equipamentoBadge}>
                    {exercicio.equipamento}
                  </span>
                )}
              </div>

              <h3 className={styles.cardTitle}>{exercicio.nome}</h3>

              {exercicio.descricao && (
                <p className={styles.cardDescription}>
                  {exercicio.descricao.length > 100
                    ? `${exercicio.descricao.substring(0, 100)}...`
                    : exercicio.descricao}
                </p>
              )}

              <div className={styles.cardActions}>
                {permissoes.editar && (
                  <Link
                    href={`/dashboard/exercicios/${exercicio.id}/editar`}
                    className={styles.editButton}
                  >
                    ✏️ Editar
                  </Link>
                )}
                {permissoes.deletar && (
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, exercicio })}
                    className={styles.deleteButton}
                  >
                    🗑️ Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        title="Confirmar Exclusão"
        size="small"
      >
        <div className={styles.modalContent}>
          <p>
            Tem certeza que deseja excluir o exercício{" "}
            <strong>{deleteModal.exercicio?.nome}</strong>?
          </p>
          <p className={styles.warning}>
            ⚠️ Este exercício será removido de todos os treinos!
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
                deleteModal.exercicio && handleDelete(deleteModal.exercicio.id)
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
