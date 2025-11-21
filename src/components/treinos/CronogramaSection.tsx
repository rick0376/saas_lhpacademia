"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cronogramaStyles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { Toast } from "../ui/Toast/Toast";
import { ConfirmModal } from "../ui/ConfirmModal/ConfirmModal";
import { DiaSemana } from "@/types";

interface Cronograma {
  id: string;
  diaSemana: DiaSemana;
  horaInicio?: string;
  horaFim?: string;
}

interface CronogramaSectionProps {
  treinoId: string;
  cronogramas: Cronograma[];
  permissoesEditar?: boolean;
}

export const CronogramaSection: React.FC<CronogramaSectionProps> = ({
  treinoId,
  cronogramas: initialCronogramas,
  permissoesEditar = true,
}) => {
  const router = useRouter();
  const [modalAddDia, setModalAddDia] = useState(false);
  const [loading, setLoading] = useState(false);

  const [novoDia, setNovoDia] = useState({
    diaSemana: "",
    horaInicio: "",
    horaFim: "",
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

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    cronogramaId: string;
    diaNome: string;
    loading: boolean;
  }>({
    isOpen: false,
    cronogramaId: "",
    diaNome: "",
    loading: false,
  });

  const diasSemana = [
    { value: "SEGUNDA", label: "Segunda-feira", emoji: "📅" },
    { value: "TERCA", label: "Terça-feira", emoji: "📅" },
    { value: "QUARTA", label: "Quarta-feira", emoji: "📅" },
    { value: "QUINTA", label: "Quinta-feira", emoji: "📅" },
    { value: "SEXTA", label: "Sexta-feira", emoji: "📅" },
    { value: "SABADO", label: "Sábado", emoji: "📅" },
    { value: "DOMINGO", label: "Domingo", emoji: "📅" },
  ];

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleAddDia = async () => {
    if (!permissoesEditar) {
      showToast("⛔ Você não tem permissão para alterar o cronograma", "error");
      return;
    }

    if (!novoDia.diaSemana) {
      showToast("Selecione um dia da semana", "warning");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/treinos/${treinoId}/cronograma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoDia),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      router.refresh();
      setModalAddDia(false);
      setNovoDia({ diaSemana: "", horaInicio: "", horaFim: "" });
      showToast("✅ Dia adicionado ao cronograma com sucesso!", "success");
    } catch (error: any) {
      showToast(error.message || "❌ Erro ao adicionar dia", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDia = async (cronogramaId: string, diaNome: string) => {
    if (!permissoesEditar) {
      showToast("⛔ Você não tem permissão para alterar o cronograma", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      cronogramaId,
      diaNome,
      loading: false,
    });
  };

  const confirmRemoveDia = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(
        `/api/treinos/${treinoId}/cronograma?cronogramaId=${confirmModal.cronogramaId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Erro ao remover dia");

      setConfirmModal({
        isOpen: false,
        cronogramaId: "",
        diaNome: "",
        loading: false,
      });
      showToast("✅ Dia removido do cronograma com sucesso!", "success");
      router.refresh();
    } catch (error) {
      setConfirmModal((prev) => ({ ...prev, loading: false }));
      showToast("❌ Erro ao remover dia do cronograma", "error");
    }
  };

  const getDiaLabel = (dia: string) => {
    return diasSemana.find((d) => d.value === dia)?.label || dia;
  };

  const getDiaEmoji = (dia: string) => {
    return diasSemana.find((d) => d.value === dia)?.emoji || "📅";
  };

  const diasDisponiveis = diasSemana.filter(
    (dia) => !initialCronogramas.some((c) => c.diaSemana === dia.value)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cronograma Semanal</h2>
        {permissoesEditar && (
          <Button onClick={() => setModalAddDia(true)} size="small">
            + Adicionar Dia
          </Button>
        )}
      </div>

      {initialCronogramas.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <h3>Nenhum dia configurado</h3>
          <p>Adicione os dias da semana em que este treino será realizado</p>
        </div>
      ) : (
        <div className={styles.diasGrid}>
          {initialCronogramas.map((cronograma) => (
            <div key={cronograma.id} className={styles.diaCard}>
              <div className={styles.diaHeader}>
                <div className={styles.diaInfo}>
                  <span className={styles.diaEmoji}>
                    {getDiaEmoji(cronograma.diaSemana)}
                  </span>
                  <span className={styles.diaNome}>
                    {getDiaLabel(cronograma.diaSemana)}
                  </span>
                </div>
                {permissoesEditar && (
                  <button
                    onClick={() =>
                      handleRemoveDia(
                        cronograma.id,
                        getDiaLabel(cronograma.diaSemana)
                      )
                    }
                    className={styles.removeButton}
                    title="Remover"
                  >
                    ✕
                  </button>
                )}
              </div>

              {(cronograma.horaInicio || cronograma.horaFim) && (
                <div className={styles.horarios}>
                  {cronograma.horaInicio && (
                    <span className={styles.horario}>
                      🕐 {cronograma.horaInicio}
                    </span>
                  )}
                  {cronograma.horaFim && (
                    <span className={styles.horario}>
                      até {cronograma.horaFim}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Dia */}
      {permissoesEditar && (
        <Modal
          isOpen={modalAddDia}
          onClose={() => setModalAddDia(false)}
          title="Adicionar Dia ao Cronograma"
          size="small"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalField}>
              <label>Dia da Semana *</label>
              <select
                value={novoDia.diaSemana}
                onChange={(e) =>
                  setNovoDia({ ...novoDia, diaSemana: e.target.value })
                }
                className={styles.select}
                required
              >
                <option value="">Selecione...</option>
                {diasDisponiveis.map((dia) => (
                  <option key={dia.value} value={dia.value}>
                    {dia.emoji} {dia.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalRow}>
              <div className={styles.modalField}>
                <label>Horário Início (opcional)</label>
                <input
                  type="time"
                  value={novoDia.horaInicio}
                  onChange={(e) =>
                    setNovoDia({ ...novoDia, horaInicio: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.modalField}>
                <label>Horário Fim (opcional)</label>
                <input
                  type="time"
                  value={novoDia.horaFim}
                  onChange={(e) =>
                    setNovoDia({ ...novoDia, horaFim: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setModalAddDia(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddDia} disabled={loading}>
                {loading ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ConfirmModal para remover dia */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            cronogramaId: "",
            diaNome: "",
            loading: false,
          })
        }
        onConfirm={confirmRemoveDia}
        title="Remover Dia"
        message={`Tem certeza que deseja remover "${confirmModal.diaNome}" do cronograma?`}
        confirmText="Sim, remover"
        cancelText="Cancelar"
        type="danger"
        loading={confirmModal.loading}
      />

      {/* Toast para mensagens */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={3000}
        />
      )}
    </div>
  );
};
