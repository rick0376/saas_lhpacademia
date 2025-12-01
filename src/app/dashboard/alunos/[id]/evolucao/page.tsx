"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Dumbbell,
  Activity,
  Filter,
  CalendarCheck,
  Trophy, // ✅ Novo ícone para Recorde
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import styles from "./styles.module.scss";

interface HistoricoTreino {
  id: string;
  data: string;
  intensidade: string;
  completo: boolean;
  totalExerciciosRealizados: number;
  exercicios: {
    id: string;
    exercicioNome: string;
    carga: string | null;
    series: number;
    repeticoes: string;
  }[];
}

interface AlunoInfo {
  nome: string;
  objetivo: string;
}

export default function EvolucaoAlunoPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<HistoricoTreino[]>([]);
  const [aluno, setAluno] = useState<AlunoInfo | null>(null);
  const [periodo, setPeriodo] = useState("30");
  const [exercicioFiltro, setExercicioFiltro] = useState("todos");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchDados();
  }, [session, status, id]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const resAluno = await fetch(`/api/alunos/${id}`);
      if (resAluno.ok) {
        const dataAluno = await resAluno.json();
        setAluno({ nome: dataAluno.nome, objetivo: dataAluno.objetivo });
      }

      const resHistorico = await fetch(`/api/alunos/${id}/historico`);
      if (resHistorico.ok) {
        const dataHistorico = await resHistorico.json();
        setHistorico(dataHistorico);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const listaExercicios = useMemo(() => {
    const nomes = new Set<string>();
    historico.forEach((h) =>
      h.exercicios.forEach((ex) => nomes.add(ex.exercicioNome))
    );
    return Array.from(nomes).sort();
  }, [historico]);

  const dadosProcessados = useMemo(() => {
    let dadosFiltrados = historico;

    if (periodo !== "todos") {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
      dadosFiltrados = historico.filter((h) => new Date(h.data) >= dataLimite);
    }

    const dadosOrdenados = [...dadosFiltrados].reverse();

    return dadosOrdenados
      .map((h) => {
        let volumeTotal = 0;
        let cargaExercicoEspecifico = 0;

        h.exercicios.forEach((ex) => {
          const cargaNum = parseFloat(ex.carga?.replace(/[^0-9.]/g, "") || "0");
          const repsNum = parseFloat(
            ex.repeticoes.replace(/[^0-9.]/g, "") || "10"
          );

          if (cargaNum > 0) {
            volumeTotal += ex.series * repsNum * cargaNum;
          }

          if (
            exercicioFiltro !== "todos" &&
            ex.exercicioNome === exercicioFiltro
          ) {
            cargaExercicoEspecifico = cargaNum;
          }
        });

        return {
          data: new Date(h.data).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          dataFull: new Date(h.data).toLocaleDateString("pt-BR"),
          volume: Math.round(volumeTotal),
          cargaEspecifica: cargaExercicoEspecifico,
          exerciciosCount: h.totalExerciciosRealizados,
          intensidade: h.intensidade,
        };
      })
      .filter((d) => {
        if (exercicioFiltro !== "todos") return d.cargaEspecifica > 0;
        return true;
      });
  }, [historico, periodo, exercicioFiltro]);

  // ✅ Cálculo do Recorde Pessoal (PR) para o exercício selecionado
  const recordePessoal = useMemo(() => {
    if (exercicioFiltro === "todos") return null;

    let maiorCarga = 0;
    let dataRecorde = "";

    dadosProcessados.forEach((d) => {
      if (d.cargaEspecifica > maiorCarga) {
        maiorCarga = d.cargaEspecifica;
        dataRecorde = d.dataFull;
      }
    });

    return { carga: maiorCarga, data: dataRecorde };
  }, [dadosProcessados, exercicioFiltro]);

  const consistencia = useMemo(() => {
    if (historico.length === 0) return "Nenhuma";
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    const treinosUltimos30Dias = historico.filter(
      (h) => new Date(h.data) >= trintaDiasAtras
    ).length;
    const mediaSemanal = treinosUltimos30Dias / 4;
    if (mediaSemanal >= 3) return "🔥 Alta";
    if (mediaSemanal >= 1.5) return "✅ Média";
    return "⚠️ Baixa";
  }, [historico]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando evolução...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/alunos" className={styles.backLink}>
          <ArrowLeft size={20} />
          Voltar
        </Link>
        <div className={styles.headerInfo}>
          <h1>Evolução de {aluno?.nome}</h1>
          <span className={styles.objetivoBadge}>
            {aluno?.objetivo || "Sem objetivo"}
          </span>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 3 meses</option>
              <option value="todos">Tudo</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <Dumbbell size={16} />
            <select
              value={exercicioFiltro}
              onChange={(e) => setExercicioFiltro(e.target.value)}
              className={styles.filterSelect}
              style={{ maxWidth: "150px" }}
            >
              <option value="todos">Visão Geral</option>
              {listaExercicios.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Activity size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Total Treinos</h3>
            <p>{historico.length}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <CalendarCheck size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Frequência (30d)</h3>
            <p>{consistencia}</p>
          </div>
        </div>

        {/* ✅ Card Dinâmico: Recorde ou Volume */}
        {exercicioFiltro !== "todos" && recordePessoal ? (
          <div className={`${styles.kpiCard} ${styles.highlightCard}`}>
            <div
              className={styles.kpiIcon}
              style={{ background: "#fffbeb", color: "#f59e0b" }}
            >
              <Trophy size={24} />
            </div>
            <div className={styles.kpiInfo}>
              <h3>Recorde (PR)</h3>
              <p>{recordePessoal.carga} kg</p>
              <span className={styles.smallDate}>em {recordePessoal.data}</span>
            </div>
          </div>
        ) : (
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.kpiInfo}>
              <h3>Maior Volume</h3>
              <p>
                {Math.max(
                  ...dadosProcessados.map((d) => d.volume),
                  0
                ).toLocaleString()}{" "}
                kg
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>
            {exercicioFiltro === "todos"
              ? "🏋️ Volume Total de Treino"
              : `💪 Progresso de Carga: ${exercicioFiltro}`}
          </h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosProcessados}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={
                        exercicioFiltro === "todos" ? "#8b5cf6" : "#f59e0b"
                      }
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        exercicioFiltro === "todos" ? "#8b5cf6" : "#f59e0b"
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={
                    exercicioFiltro === "todos" ? "volume" : "cargaEspecifica"
                  }
                  name={
                    exercicioFiltro === "todos"
                      ? "Volume Total (kg)"
                      : "Carga (kg)"
                  }
                  stroke={exercicioFiltro === "todos" ? "#8b5cf6" : "#f59e0b"}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>📊 Qtd. de Exercícios Realizados</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosProcessados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  cursor={{ fill: "#f3e8ff" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="exerciciosCount"
                  name="Exercícios"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {dadosProcessados.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <p>Nenhum dado encontrado para este filtro.</p>
        </div>
      )}
    </div>
  );
}
