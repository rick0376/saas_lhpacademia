"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./execucaoStyles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { Toast } from "../ui/Toast/Toast";

interface ExecucaoExercicio {
  exercicioNome: string;
  series: number;
  repeticoes: string;
  carga?: string;
  observacoes?: string;
}

interface Execucao {
  id: string;
  data: string;
  observacoes?: string;
  completo: boolean;
  intensidade?: string;
  exercicios: ExecucaoExercicio[];
}

interface ExecucaoSectionProps {
  treinoId: string;
  treinoExercicios: any[];
}

export const ExecucaoSection: React.FC<ExecucaoSectionProps> = ({
  treinoId,
  treinoExercicios,
}) => {
  const router = useRouter();
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [modalVerExecucao, setModalVerExecucao] = useState<{
    isOpen: boolean;
    execucao?: Execucao;
  }>({ isOpen: false });
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // ✅ ESTADO DO TOAST
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const [novaExecucao, setNovaExecucao] = useState({
    observacoes: "",
    completo: true,
    intensidade: "",
    exercicios: treinoExercicios.map((te) => ({
      exercicioNome: te.exercicio.nome,
      series: te.series,
      repeticoes: te.repeticoes,
      carga: te.carga || "",
      observacoes: "",
    })),
  });

  useEffect(() => {
    fetchExecucoes();
  }, []);

  const fetchExecucoes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/treinos/${treinoId}/execucoes`);
      const data = await response.json();
      setExecucoes(data);
    } catch (error) {
      console.error("Erro ao carregar execuções:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrar = async () => {
    // Validação
    if (!novaExecucao.intensidade) {
      setToast({
        show: true,
        message: "⚠️ Selecione a intensidade do treino!",
        type: "warning",
      });
      return;
    }

    setLoadingSubmit(true);

    try {
      // Buscar aluno ID do treino
      const treinoResponse = await fetch(`/api/treinos/${treinoId}`);
      if (!treinoResponse.ok) throw new Error("Erro ao buscar dados do treino");
      const treinoData = await treinoResponse.json();

      const response = await fetch(`/api/treinos/${treinoId}/execucoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaExecucao,
          alunoId: treinoData.alunoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao registrar execução");
      }

      fetchExecucoes();
      router.refresh();

      setModalRegistrar(false);

      // Reset do formulário
      setNovaExecucao({
        observacoes: "",
        completo: true,
        intensidade: "",
        exercicios: treinoExercicios.map((te) => ({
          exercicioNome: te.exercicio.nome,
          series: te.series,
          repeticoes: te.repeticoes,
          carga: te.carga || "",
          observacoes: "",
        })),
      });

      // ✅ TOAST DE SUCESSO
      setToast({
        show: true,
        message: "✅ Execução registrada com sucesso!",
        type: "success",
      });
    } catch (error: any) {
      // ✅ TOAST DE ERRO
      setToast({
        show: true,
        message: "❌ " + error.message,
        type: "error",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteExecucao = async (execucaoId: string) => {
    if (!confirm("Deseja excluir este registro?")) return;

    try {
      const response = await fetch(`/api/execucoes/${execucaoId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir execução");

      fetchExecucoes();
      router.refresh();

      // ✅ TOAST DE SUCESSO
      setToast({
        show: true,
        message: "🗑️ Execução excluída com sucesso!",
        type: "success",
      });
    } catch (error) {
      // ✅ TOAST DE ERRO
      setToast({
        show: true,
        message: "❌ Erro ao excluir execução",
        type: "error",
      });
    }
  };

  const handleChangeExercicio = (index: number, field: string, value: any) => {
    const novosExercicios = [...novaExecucao.exercicios];
    novosExercicios[index] = { ...novosExercicios[index], [field]: value };
    setNovaExecucao({ ...novaExecucao, exercicios: novosExercicios });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIntensidadeLabel = (intensidade: string) => {
    const labels: Record<string, { emoji: string; text: string }> = {
      LEVE: { emoji: "🟢", text: "Leve" },
      MODERADO: { emoji: "🟡", text: "Moderado" },
      PESADO: { emoji: "🟠", text: "Pesado" },
      MUITO_PESADO: { emoji: "🔴", text: "Muito Pesado" },
    };
    return labels[intensidade] || { emoji: "", text: intensidade };
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Histórico de Execuções</h2>
          <p className={styles.subtitle}>
            {execucoes.length}{" "}
            {execucoes.length === 1 ? "treino realizado" : "treinos realizados"}
          </p>
        </div>
        <Button onClick={() => setModalRegistrar(true)}>
          ✅ Registrar Treino
        </Button>
      </div>

      {execucoes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>Nenhuma execução registrada</h3>
          <p>Registre quando este treino for realizado</p>
        </div>
      ) : (
        <div className={styles.execucoesGrid}>
          {execucoes.map((execucao) => {
            const intensidadeInfo = execucao.intensidade
              ? getIntensidadeLabel(execucao.intensidade)
              : null;

            return (
              <div key={execucao.id} className={styles.execucaoCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.data}>
                      📅 {formatDate(execucao.data)}
                    </span>
                    {execucao.completo && (
                      <span className={styles.completoBadge}>✓ Completo</span>
                    )}
                    {intensidadeInfo && (
                      <span className={styles.intensidadeBadge}>
                        {intensidadeInfo.emoji} {intensidadeInfo.text}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteExecucao(execucao.id)}
                    className={styles.deleteButton}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>

                <div className={styles.exerciciosCount}>
                  {execucao.exercicios.length} exercícios realizados
                </div>

                <button
                  onClick={() =>
                    setModalVerExecucao({ isOpen: true, execucao })
                  }
                  className={styles.viewButton}
                >
                  Ver detalhes →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar */}
      <Modal
        isOpen={modalRegistrar}
        onClose={() => setModalRegistrar(false)}
        title="Registrar Execução do Treino"
        size="large"
      >
        <div className={styles.modalContent}>
          {/* ✅ CAMPO DE INTENSIDADE */}
          <div className={styles.intensidadeField}>
            <label className={styles.fieldLabel}>
              Como foi a intensidade do treino? *
            </label>
            <div className={styles.intensidadeButtons}>
              <button
                type="button"
                className={`${styles.intensidadeBtn} ${
                  novaExecucao.intensidade === "LEVE" ? styles.selected : ""
                }`}
                onClick={() =>
                  setNovaExecucao({ ...novaExecucao, intensidade: "LEVE" })
                }
              >
                🟢 Leve
              </button>
              <button
                type="button"
                className={`${styles.intensidadeBtn} ${
                  novaExecucao.intensidade === "MODERADO" ? styles.selected : ""
                }`}
                onClick={() =>
                  setNovaExecucao({ ...novaExecucao, intensidade: "MODERADO" })
                }
              >
                🟡 Moderado
              </button>
              <button
                type="button"
                className={`${styles.intensidadeBtn} ${
                  novaExecucao.intensidade === "PESADO" ? styles.selected : ""
                }`}
                onClick={() =>
                  setNovaExecucao({ ...novaExecucao, intensidade: "PESADO" })
                }
              >
                🟠 Pesado
              </button>
              <button
                type="button"
                className={`${styles.intensidadeBtn} ${
                  novaExecucao.intensidade === "MUITO_PESADO"
                    ? styles.selected
                    : ""
                }`}
                onClick={() =>
                  setNovaExecucao({
                    ...novaExecucao,
                    intensidade: "MUITO_PESADO",
                  })
                }
              >
                🔴 Muito Pesado
              </button>
            </div>
          </div>

          <div className={styles.exerciciosForm}>
            <h3 className={styles.formTitle}>Exercícios Realizados</h3>
            {novaExecucao.exercicios.map((exercicio, index) => (
              <div key={index} className={styles.exercicioItem}>
                <h4 className={styles.exercicioNome}>
                  {exercicio.exercicioNome}
                </h4>
                <div className={styles.exercicioInputs}>
                  <input
                    type="number"
                    placeholder="Séries"
                    value={exercicio.series}
                    onChange={(e) =>
                      handleChangeExercicio(
                        index,
                        "series",
                        parseInt(e.target.value)
                      )
                    }
                    className={styles.inputSmall}
                  />
                  <input
                    type="text"
                    placeholder="Repetições"
                    value={exercicio.repeticoes}
                    onChange={(e) =>
                      handleChangeExercicio(index, "repeticoes", e.target.value)
                    }
                    className={styles.inputSmall}
                  />
                  <input
                    type="text"
                    placeholder="Carga"
                    value={exercicio.carga}
                    onChange={(e) =>
                      handleChangeExercicio(index, "carga", e.target.value)
                    }
                    className={styles.inputSmall}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.observacoesField}>
            <label>Observações Gerais</label>
            <textarea
              placeholder="Como foi o treino? Alguma dificuldade?"
              value={novaExecucao.observacoes}
              onChange={(e) =>
                setNovaExecucao({
                  ...novaExecucao,
                  observacoes: e.target.value,
                })
              }
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.checkboxField}>
            <label>
              <input
                type="checkbox"
                checked={novaExecucao.completo}
                onChange={(e) =>
                  setNovaExecucao({
                    ...novaExecucao,
                    completo: e.target.checked,
                  })
                }
              />
              <span>Treino completo (todos os exercícios realizados)</span>
            </label>
          </div>

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setModalRegistrar(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrar}
              disabled={loadingSubmit || !novaExecucao.intensidade}
            >
              {loadingSubmit ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Execução */}
      <Modal
        isOpen={modalVerExecucao.isOpen}
        onClose={() => setModalVerExecucao({ isOpen: false })}
        title="Detalhes da Execução"
        size="medium"
      >
        {modalVerExecucao.execucao && (
          <div className={styles.detailsContent}>
            <div className={styles.detailsHeader}>
              <span className={styles.detailsDate}>
                📅 {formatDate(modalVerExecucao.execucao.data)}
              </span>
              {modalVerExecucao.execucao.completo && (
                <span className={styles.completoBadge}>✓ Completo</span>
              )}
              {modalVerExecucao.execucao.intensidade && (
                <span className={styles.intensidadeBadge}>
                  {
                    getIntensidadeLabel(modalVerExecucao.execucao.intensidade)
                      .emoji
                  }{" "}
                  {
                    getIntensidadeLabel(modalVerExecucao.execucao.intensidade)
                      .text
                  }
                </span>
              )}
            </div>

            <div className={styles.exerciciosList}>
              <h4>Exercícios:</h4>
              {modalVerExecucao.execucao.exercicios.map((ex, index) => (
                <div key={index} className={styles.exercicioDetail}>
                  <strong>{ex.exercicioNome}</strong>
                  <div className={styles.exercicioInfo}>
                    <span>
                      {ex.series}x{ex.repeticoes}
                    </span>
                    {ex.carga && <span>• {ex.carga}</span>}
                  </div>
                </div>
              ))}
            </div>

            {modalVerExecucao.execucao.observacoes && (
              <div className={styles.observacoesBox}>
                <strong>Observações:</strong>
                <p>{modalVerExecucao.execucao.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ✅ TOAST DE NOTIFICAÇÃO */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};
