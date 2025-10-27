"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./statsStyles.module.scss";

interface Stats {
  totais: {
    alunos: number;
    alunosAtivos: number;
    treinos: number;
    treinosAtivos: number;
    exercicios: number;
  };
  atividade: {
    execucoesUltimos7Dias: number;
  };
  recentes: {
    medidas: any[];
    execucoes: any[];
  };
}

export const DashboardStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando estatísticas...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className={styles.error}>Erro ao carregar estatísticas</div>;
  }

  return (
    <div className={styles.container}>
      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            }}
          >
            👤
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.totais.alunos}</span>
            <span className={styles.statLabel}>Total de Alunos</span>
            <span className={styles.statSubtext}>
              {stats.totais.alunosAtivos} ativos
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            }}
          >
            📋
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.totais.treinos}</span>
            <span className={styles.statLabel}>Treinos Criados</span>
            <span className={styles.statSubtext}>
              {stats.totais.treinosAtivos} ativos
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            }}
          >
            💪
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.totais.exercicios}</span>
            <span className={styles.statLabel}>Exercícios</span>
            <span className={styles.statSubtext}>na biblioteca</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
            }}
          >
            ✅
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {stats.atividade.execucoesUltimos7Dias}
            </span>
            <span className={styles.statLabel}>Treinos Realizados</span>
            <span className={styles.statSubtext}>últimos 7 dias</span>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className={styles.recentesGrid}>
        {/* Últimas Medidas */}
        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <h3 className={styles.recentTitle}>📏 Últimas Medidas</h3>
            <Link href="/dashboard/alunos" className={styles.viewAll}>
              Ver todos →
            </Link>
          </div>

          {stats.recentes.medidas.length === 0 ? (
            <div className={styles.emptyRecent}>Nenhuma medida registrada</div>
          ) : (
            <div className={styles.recentList}>
              {stats.recentes.medidas.map((medida) => (
                <div key={medida.id} className={styles.recentItem}>
                  <div className={styles.recentInfo}>
                    <span className={styles.recentName}>
                      {medida.aluno.nome}
                    </span>
                    <span className={styles.recentDate}>
                      {formatDate(medida.data)}
                    </span>
                  </div>
                  <div className={styles.recentStats}>
                    <span>{medida.peso} kg</span>
                    <span>•</span>
                    <span>{medida.altura} m</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas Execuções */}
        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <h3 className={styles.recentTitle}>✅ Treinos Recentes</h3>
            <Link href="/dashboard/treinos" className={styles.viewAll}>
              Ver todos →
            </Link>
          </div>

          {stats.recentes.execucoes.length === 0 ? (
            <div className={styles.emptyRecent}>
              Nenhuma execução registrada
            </div>
          ) : (
            <div className={styles.recentList}>
              {stats.recentes.execucoes.map((execucao) => (
                <div key={execucao.id} className={styles.recentItem}>
                  <div className={styles.recentInfo}>
                    <span className={styles.recentName}>
                      {execucao.treino.aluno.nome}
                    </span>
                    <span className={styles.recentSubtext}>
                      {execucao.treino.nome}
                    </span>
                  </div>
                  <div className={styles.recentDate}>
                    {formatDate(execucao.data)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
