"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cronogramaStyles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
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
}

export const CronogramaSection: React.FC<CronogramaSectionProps> = ({
  treinoId,
  cronogramas: initialCronogramas,
}) => {
  const router = useRouter();
  const [modalAddDia, setModalAddDia] = useState(false);
  const [loading, setLoading] = useState(false);

  const [novoDia, setNovoDia] = useState({
    diaSemana: "",
    horaInicio: "",
    horaFim: "",
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

  const handleAddDia = async () => {
    if (!novoDia.diaSemana) {
      alert("Selecione um dia da semana");
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
    } catch (error: any) {
      alert(error.message || "Erro ao adicionar dia");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDia = async (cronogramaId: string) => {
    if (!confirm("Deseja remover este dia do cronograma?")) return;

    try {
      const response = await fetch(
        `/api/treinos/${treinoId}/cronograma?cronogramaId=${cronogramaId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Erro ao remover dia");

      router.refresh();
    } catch (error) {
      alert("Erro ao remover dia do cronograma");
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
        <Button onClick={() => setModalAddDia(true)} size="small">
          + Adicionar Dia
        </Button>
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
                <button
                  onClick={() => handleRemoveDia(cronograma.id)}
                  className={styles.removeButton}
                  title="Remover"
                >
                  ✕
                </button>
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
    </div>
  );
};
