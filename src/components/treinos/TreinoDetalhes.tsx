"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./detalhesStyles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { CronogramaSection } from "./CronogramaSection";
import { ExecucaoSection } from "./ExecucaoSection";
import { Toast } from "../ui/Toast/Toast";
import { ConfirmModal } from "../ui/ConfirmModal/ConfirmModal";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: string;
}

interface TreinoExercicio {
  id: string;
  ordem: number;
  series: number;
  repeticoes: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
  exercicio: Exercicio;
}

interface TreinoDetalhesProps {
  treino: any;
}

export const TreinoDetalhes: React.FC<TreinoDetalhesProps> = ({ treino }) => {
  const router = useRouter();

  // Hook de auto-refresh
  const { refresh, isRefreshing } = useAutoRefresh({
    interval: 30000,
    enabled: true,
  });

  // States
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [modalAddExercicio, setModalAddExercicio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState("");

  const [novoExercicio, setNovoExercicio] = useState({
    exercicioId: "",
    series: 3,
    repeticoes: "10-12",
    carga: "",
    descanso: "60s",
    observacoes: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    exercicioId: string;
    exercicioNome: string;
    loading: boolean;
  }>({
    isOpen: false,
    exercicioId: "",
    exercicioNome: "",
    loading: false,
  });

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Effects
  useEffect(() => {
    fetchExercicios();
  }, []);

  // Funções
  const fetchExercicios = async () => {
    try {
      const response = await fetch("/api/exercicios");
      const data = await response.json();
      setExercicios(data);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    }
  };

  const handleAddExercicio = async () => {
    if (!novoExercicio.exercicioId) {
      setToast({
        show: true,
        message: "Selecione um exercício",
        type: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/treinos/${treino.id}/exercicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novoExercicio,
          ordem: treino.exercicios.length + 1,
        }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar exercício");

      await refresh();

      setModalAddExercicio(false);
      setNovoExercicio({
        exercicioId: "",
        series: 3,
        repeticoes: "10-12",
        carga: "",
        descanso: "60s",
        observacoes: "",
      });

      setToast({
        show: true,
        message: "Exercício adicionado com sucesso!",
        type: "success",
      });
    } catch (error) {
      setToast({
        show: true,
        message: "Erro ao adicionar exercício",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExercicio = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(
        `/api/treinos/${treino.id}/exercicios?exercicioId=${confirmModal.exercicioId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover exercício");
      }

      setConfirmModal({
        isOpen: false,
        exercicioId: "",
        exercicioNome: "",
        loading: false,
      });

      setToast({
        show: true,
        message: "Exercício removido com sucesso!",
        type: "success",
      });

      await refresh();
    } catch (error: any) {
      setConfirmModal((prev) => ({ ...prev, loading: false }));

      setToast({
        show: true,
        message: error.message || "Erro ao remover exercício",
        type: "error",
      });
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

  const exerciciosFiltrados = filtroGrupo
    ? exercicios.filter((e) => e.grupoMuscular === filtroGrupo)
    : exercicios;

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <Link href="/dashboard/treinos" className={styles.backButton}>
            ← Voltar
          </Link>
          <h1 className={styles.title}>{treino.nome}</h1>
          <div className={styles.meta}>
            <span className={styles.metaItem}>👤 {treino.aluno.nome}</span>
            {treino.objetivo && (
              <span className={styles.metaItem}>🎯 {treino.objetivo}</span>
            )}
            <span
              className={`${styles.statusBadge} ${
                treino.ativo ? styles.ativo : styles.inativo
              }`}
            >
              {treino.ativo ? "Ativo" : "Inativo"}
            </span>
            {isRefreshing && (
              <span className={styles.refreshingBadge}>🔄 Atualizando...</span>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => setModalAddExercicio(true)}>
            + Adicionar Exercício
          </Button>
          <Link href={`/dashboard/treinos/${treino.id}/editar`}>
            <Button variant="outline">✏️ Editar Treino</Button>
          </Link>
          <Button
            variant="outline"
            onClick={refresh}
            disabled={isRefreshing}
            size="medium"
          >
            {isRefreshing ? "🔄" : "↻"} Atualizar
          </Button>
        </div>
      </div>

      {/* Lista de Exercícios */}
      <div className={styles.exerciciosList}>
        <h2 className={styles.sectionTitle}>
          Exercícios ({treino.exercicios.length})
        </h2>

        {treino.exercicios.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💪</div>
            <h3>Nenhum exercício adicionado</h3>
            <p>Clique em "Adicionar Exercício" para montar a ficha</p>
          </div>
        ) : (
          <div className={styles.exerciciosGrid}>
            {treino.exercicios.map((te: TreinoExercicio, index: number) => (
              <div key={te.id} className={styles.exercicioCard}>
                <div className={styles.exercicioHeader}>
                  <span className={styles.ordem}>{index + 1}</span>
                  <div className={styles.exercicioInfo}>
                    <h3 className={styles.exercicioNome}>
                      {te.exercicio.nome}
                    </h3>
                    <span className={styles.grupoMuscular}>
                      {getGrupoMuscularLabel(te.exercicio.grupoMuscular)}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        exercicioId: te.id,
                        exercicioNome: te.exercicio.nome,
                        loading: false,
                      })
                    }
                    className={styles.removeButton}
                    title="Remover"
                    disabled={confirmModal.loading}
                  >
                    🗑️
                  </button>
                </div>

                <div className={styles.exercicioDetails}>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Séries:</span>
                    <span className={styles.detailValue}>{te.series}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Repetições:</span>
                    <span className={styles.detailValue}>{te.repeticoes}</span>
                  </div>
                  {te.carga && (
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Carga:</span>
                      <span className={styles.detailValue}>{te.carga}</span>
                    </div>
                  )}
                  {te.descanso && (
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Descanso:</span>
                      <span className={styles.detailValue}>{te.descanso}</span>
                    </div>
                  )}
                </div>

                {te.observacoes && (
                  <div className={styles.observacoes}>
                    <strong>Obs:</strong> {te.observacoes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cronograma */}
      <CronogramaSection
        treinoId={treino.id}
        cronogramas={treino.cronogramas}
      />

      {/* Execuções */}
      <ExecucaoSection
        treinoId={treino.id}
        treinoExercicios={treino.exercicios}
      />

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            exercicioId: "",
            exercicioNome: "",
            loading: false,
          })
        }
        onConfirm={handleRemoveExercicio}
        title="Remover Exercício"
        message={`Tem certeza que deseja remover "${confirmModal.exercicioNome}" do treino?`}
        confirmText="Sim, remover"
        cancelText="Cancelar"
        type="danger"
        loading={confirmModal.loading}
      />

      {/* Toast de Notificação */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Modal Adicionar Exercício */}
      <Modal
        isOpen={modalAddExercicio}
        onClose={() => setModalAddExercicio(false)}
        title="Adicionar Exercício"
        size="large"
      >
        <div className={styles.modalContent}>
          <div className={styles.modalGrid}>
            <div className={styles.modalField}>
              <label>Filtrar por grupo</label>
              <select
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                className={styles.select}
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
              </select>
            </div>

            <div className={styles.modalField}>
              <label>Exercício *</label>
              <select
                value={novoExercicio.exercicioId}
                onChange={(e) =>
                  setNovoExercicio({
                    ...novoExercicio,
                    exercicioId: e.target.value,
                  })
                }
                className={styles.select}
                required
              >
                <option value="">Selecione...</option>
                {exerciciosFiltrados.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nome} - {getGrupoMuscularLabel(ex.grupoMuscular)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalField}>
              <label>Séries *</label>
              <input
                type="number"
                min="1"
                value={novoExercicio.series}
                onChange={(e) =>
                  setNovoExercicio({
                    ...novoExercicio,
                    series: parseInt(e.target.value),
                  })
                }
                className={styles.input}
                required
              />
            </div>

            <div className={styles.modalField}>
              <label>Repetições *</label>
              <input
                type="text"
                placeholder="Ex: 10-12, 15, até a falha"
                value={novoExercicio.repeticoes}
                onChange={(e) =>
                  setNovoExercicio({
                    ...novoExercicio,
                    repeticoes: e.target.value,
                  })
                }
                className={styles.input}
                required
              />
            </div>

            <div className={styles.modalField}>
              <label>Carga</label>
              <input
                type="text"
                placeholder="Ex: 20kg, peso corporal"
                value={novoExercicio.carga}
                onChange={(e) =>
                  setNovoExercicio({ ...novoExercicio, carga: e.target.value })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.modalField}>
              <label>Descanso</label>
              <input
                type="text"
                placeholder="Ex: 60s, 90s"
                value={novoExercicio.descanso}
                onChange={(e) =>
                  setNovoExercicio({
                    ...novoExercicio,
                    descanso: e.target.value,
                  })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.modalFieldFull}>
              <label>Observações</label>
              <textarea
                placeholder="Informações adicionais sobre a execução..."
                value={novoExercicio.observacoes}
                onChange={(e) =>
                  setNovoExercicio({
                    ...novoExercicio,
                    observacoes: e.target.value,
                  })
                }
                className={styles.textarea}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => setModalAddExercicio(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddExercicio} disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
