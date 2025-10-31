// app/alunos/calendario/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import { ArrowLeft, RefreshCw } from "lucide-react";
import styles from "./styles.module.scss";

interface Treino {
  id: string;
  nome: string;
  objetivo: string | null;
  descricao: string | null;
  ativo: boolean;
  dataInicio: string;
  dataFim: string | null;
}

interface CronogramaItem {
  id: string;
  diaSemana: string;
  horaInicio: string | null;
  horaFim: string | null;
  treino: Treino;
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
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
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

const diaEmoji: Record<DiaSemana, string> = {
  SEGUNDA: "📅",
  TERCA: "📅",
  QUARTA: "📅",
  QUINTA: "📅",
  SEXTA: "📅",
  SABADO: "⚽",
  DOMINGO: "☀️",
};

export default function CalendarioPage() {
  const { data: session } = useSession();
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const fetchCronograma = async (alunoId: string) => {
    try {
      console.log("🔍 Buscando cronograma para alunoId:", alunoId);

      const res = await fetch(`/api/alunos/calendario?alunoId=${alunoId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Erro HTTP: ${res.status}`);
      }

      const data = await res.json();
      setCronograma(data);
      setError(null);
      console.log("✅ Cronograma carregado:", data.length, "itens");
    } catch (err: any) {
      console.error("❌ Erro ao buscar cronograma:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    if (!session?.user) return;

    const alunoId = (session.user as any).aluno?.id;
    if (!alunoId) {
      setError("ID do aluno não encontrado na sessão.");
      setLoading(false);
      return;
    }

    fetchCronograma(alunoId);
  }, [session]);

  const recarregarCronograma = async () => {
    if (!session?.user) return;
    setReloading(true);
    const alunoId = (session.user as any).aluno?.id;
    if (alunoId) await fetchCronograma(alunoId);
  };

  // Agrupa cronogramas por dia da semana
  const treinosPorDia = diasOrdem.reduce((acc, dia) => {
    acc[dia] = cronograma.filter((item) => item.diaSemana === dia);
    return acc;
  }, {} as Record<DiaSemana, CronogramaItem[]>);

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando calendário de treinos...</p>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <p>❌ Erro ao carregar: {error}</p>
            <button
              onClick={recarregarCronograma}
              className={styles.retryButton}
            >
              Tentar Novamente
            </button>
          </div>
          <Link href="/alunos/dashboard" className={styles.backLink}>
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Link>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>📅 Calendário de Treinos</h1>
            <p className={styles.subtitle}>
              Veja seu cronograma semanal organizado
            </p>
          </div>
          <button
            onClick={recarregarCronograma}
            disabled={reloading}
            className={styles.refreshBtn}
            title="Atualizar calendário"
          >
            <RefreshCw size={20} className={reloading ? styles.spinning : ""} />
            {reloading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {/* Conteúdo */}
        {cronograma.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>📋</div>
            <h2>Nenhum Treino Agendado</h2>
            <p>Aguarde seu treinador configurar seu cronograma de treinos!</p>
            <button
              onClick={recarregarCronograma}
              className={styles.emptyButton}
            >
              Verificar Novamente
            </button>
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
                  {/* Header do dia */}
                  <div className={styles.diaHeader}>
                    <div className={styles.diaInfo}>
                      <span className={styles.diaEmoji}>
                        {diaEmoji[dia as DiaSemana]}
                      </span>
                      <h3>{diasSemanaMap[dia as DiaSemana]}</h3>
                    </div>
                    {temTreino && (
                      <span className={styles.badge}>
                        {treinosDoDia.length}
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  {temTreino ? (
                    <div className={styles.treinosLista}>
                      {treinosDoDia.map((item, idx) => (
                        <Link
                          key={item.id}
                          href={`/alunos/treinos/${item.treino.id}?from=calendario`}
                          className={styles.treinoItem}
                        >
                          {/* Separador entre treinos */}
                          {idx > 0 && <div className={styles.divisor} />}

                          <div className={styles.treinoContent}>
                            <div className={styles.treinoHeader}>
                              <div className={styles.treinoNome}>
                                💪 {item.treino.nome}
                              </div>
                              {item.horaInicio && (
                                <div className={styles.treinoHorario}>
                                  🕐 {item.horaInicio}
                                  {item.horaFim && ` - ${item.horaFim}`}
                                </div>
                              )}
                            </div>
                            {item.treino.objetivo && (
                              <div className={styles.treinoObjetivo}>
                                🎯 {item.treino.objetivo}
                              </div>
                            )}
                            {item.treino.descricao && (
                              <div className={styles.treinoDescricao}>
                                {item.treino.descricao}
                              </div>
                            )}
                          </div>

                          <div className={styles.arrow}>→</div>
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

        {/* Footer - Voltar */}
        <Link href="/alunos/dashboard" className={styles.backLink}>
          <ArrowLeft size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </AlunoLayout>
  );
}
