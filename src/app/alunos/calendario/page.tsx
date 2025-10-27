"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import styles from "./styles.module.scss";

interface CronogramaItem {
  id: string;
  treinoId: string;
  treinoNome: string;
  treinoObjetivo: string | null;
  diaSemana: string;
  horaInicio: string | null;
  horaFim: string | null;
}

type DiaSemana =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

const diasSemanaMap: Record<DiaSemana, string> = {
  SEGUNDA: "Segunda",
  TERCA: "Terça",
  QUARTA: "Quarta",
  QUINTA: "Quinta",
  SEXTA: "Sexta",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const diasOrdem: DiaSemana[] = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
];

export default function CalendarioPage() {
  const [calendario, setCalendario] = useState<CronogramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendario = async () => {
      try {
        const alunoId =
          localStorage.getItem("alunoId") || "cmh3lm26h00030gfcuq1chm08";
        console.log("🔍 Buscando calendário para alunoId:", alunoId);

        const res = await fetch(`/api/alunos/calendario?alunoId=${alunoId}`);
        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status}`);
        }

        const data = await res.json();
        setCalendario(data);
        console.log("✅ Calendário carregado:", data.length, "itens");
      } catch (err: any) {
        console.error("❌ Erro ao buscar calendário:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendario();
  }, []);

  // Agrupa treinos por dia da semana
  const treinosPorDia = diasOrdem.reduce((acc, dia) => {
    acc[dia] = calendario.filter((item) => item.diaSemana === dia);
    return acc;
  }, {} as Record<DiaSemana, CronogramaItem[]>);

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Carregando calendário...</div>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.error}>Erro ao carregar: {error}</div>
          <Link href="/alunosdashboard" className={styles.backLink}>
            ← Voltar ao Dashboard
          </Link>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <h1>Calendário de Treinos</h1>
        <p className={styles.subtitle}>
          Veja seu cronograma semanal de treinos
        </p>

        {calendario.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <p>Nenhum treino agendado ainda.</p>
            <p>Aguarde seu treinador configurar seu cronograma!</p>
          </div>
        ) : (
          <div className={styles.calendarioGrid}>
            {diasOrdem.map((dia) => {
              const treinosDoDia = treinosPorDia[dia];
              const temTreino = treinosDoDia.length > 0;

              return (
                <div
                  key={dia}
                  className={`${styles.diaCard} ${
                    temTreino ? styles.comTreino : styles.semTreino
                  }`}
                >
                  <div className={styles.diaHeader}>
                    <h3>{diasSemanaMap[dia]}</h3>
                    {temTreino && (
                      <span className={styles.badge}>
                        {treinosDoDia.length}
                      </span>
                    )}
                  </div>

                  {temTreino ? (
                    <div className={styles.treinosLista}>
                      {treinosDoDia.map((item) => (
                        <Link
                          key={item.id}
                          href={`/alunos/treinos/${item.treinoId}?from=calendario`} // ✅ TEM que ter ?from=calendario
                          className={styles.treinoItem}
                        >
                          <div className={styles.treinoNome}>
                            {item.treinoNome}
                          </div>
                          {item.treinoObjetivo && (
                            <div className={styles.treinoObjetivo}>
                              {item.treinoObjetivo}
                            </div>
                          )}
                          {(item.horaInicio || item.horaFim) && (
                            <div className={styles.treinoHorario}>
                              🕐{" "}
                              {item.horaInicio && item.horaFim
                                ? `${item.horaInicio} - ${item.horaFim}`
                                : item.horaInicio || item.horaFim}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.descanso}>
                      <span className={styles.descansoIcon}>💤</span>
                      <span className={styles.descansoTexto}>Descanso</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Link href="/alunos/dashboard" className={styles.backLink}>
          ← Voltar ao Dashboard
        </Link>
      </div>
    </AlunoLayout>
  );
}
