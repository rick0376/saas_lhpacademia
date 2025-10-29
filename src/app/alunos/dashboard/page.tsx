"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Aluno } from "@/types";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import styles from "./styles.module.scss";
import {
  User,
  Heart,
  Ruler,
  Dumbbell,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

interface ExecucaoTreino {
  id: string;
  data: Date;
  duracao: number | null;
  observacoes: string | null;
  treino: {
    id: string;
    nome: string;
    objetivo: string | null;
  };
  exerciciosCompletados: number;
  exercicios: Array<{
    nome: string;
    grupoMuscular: string;
    series: number;
    repeticoes: string;
    carga: string | null;
  }>;
}

interface AlunoData {
  id: string;
  nome: string;
  foto?: string | null;
  objetivo?: string | null;
  treinosAtivos: number;
  ultimaMedida?: {
    peso?: number | null;
  } | null;
  avaliacoes: number;
  proximoTreino?: {
    data: string;
  } | null;
  ultimasExecucoes?: ExecucaoTreino[]; // ✅ NOVO
  name?: string;
}

interface CustomUser {
  id: string;
  role: string;
  clienteId: string;
  cliente: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  aluno?: Aluno | null;
}

export default function AlunoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alunoData, setAlunoData] = useState<AlunoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("useEffect mount/trigger:", { status, hasSession: !!session });

    if (status === "loading") {
      console.log("Session loading - show loading");
      setLoading(true);
      return;
    }

    if (!session) {
      console.log("No session - redirect to login");
      router.push("/alunos/login");
      return;
    }

    const user = session?.user as CustomUser;
    const alunoId = user?.aluno?.id;
    console.log("Session user/alunoId:", { userId: user?.id, alunoId });

    if (!alunoId) {
      console.log("No alunoId - set error state");
      setError("Usuário sem dados de aluno");
      setLoading(false);
      return;
    }

    console.log("Starting fetch for alunoId:", alunoId);
    fetchAlunoData(alunoId);
  }, [status, session?.user?.id]);

  const fetchAlunoData = async (alunoId: string) => {
    console.log("fetchAlunoData called with:", alunoId);
    setLoading(true);
    setError("");

    try {
      const url = `/api/alunos/dashboard?alunoId=${alunoId}`;
      console.log("Fetching URL:", url);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      console.log("API Response:", {
        ok: response.ok,
        status: response.status,
      });

      if (!response.ok) {
        console.error(
          "API Error details:",
          response.status,
          response.statusText
        );
        throw new Error(`Erro ao carregar dados: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Data received (raw):", data);

      if (!data) {
        throw new Error("Resposta vazia da API");
      }

      const adjustedData: AlunoData = {
        id: data.id || "",
        nome: data.nome || data.name || "Anônimo",
        foto: data.foto || null,
        objetivo: data.objetivo || null,
        treinosAtivos: data.treinosAtivos || 0,
        ultimaMedida: data.ultimaMedida || null,
        avaliacoes: data.avaliacoes || 0,
        proximoTreino: data.proximoTreino || null,
        ultimasExecucoes: data.ultimasExecucoes || [], // ✅ NOVO
      };

      console.log("Adjusted data for set:", adjustedData);

      setAlunoData(adjustedData);
      console.log("setAlunoData called with:", adjustedData.nome);
    } catch (err: any) {
      const msg = err.message || "Erro ao carregar seus dados";
      setError(msg);
      console.error("Fetch error full:", err);
    } finally {
      setLoading(false);
      console.log(
        "fetch finally: loading=false, error=",
        !!error,
        "alunoData=",
        !!alunoData
      );
    }
  };

  // ✅ NOVO - Formatadores de data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getRelativeDate = (date: Date) => {
    const now = new Date();
    const execDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - execDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return formatDate(execDate);
  };

  const formatDuracao = (minutos: number | null) => {
    if (!minutos) return "Não registrado";
    if (minutos < 60) return `${minutos}min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h${mins > 0 ? ` ${mins}min` : ""}`;
  };

  console.log("Render cycle:", {
    status,
    loading,
    error,
    hasAlunoData: !!alunoData,
    dataNome: alunoData?.nome,
  });

  if (status === "loading" || loading) {
    console.log("Rendering LOADING (session or fetch)");
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className="mt-2 text-gray-600">Carregando seus dados...</p>
      </div>
    );
  }

  if (error) {
    console.log("Rendering ERROR:", error);
    return (
      <div className={styles.errorContainer}>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            const user = session?.user as CustomUser;
            const id = user?.aluno?.id;
            if (id) fetchAlunoData(id);
          }}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!alunoData) {
    console.log("Rendering EMPTY");
    return (
      <AlunoLayout>
        <div className={styles.emptyContainer}>
          <User size={64} className={styles.emptyIcon} />
          <h2 className="text-2xl font-bold mb-2">Olá! Seja bem-vindo(a)</h2>
          <p className="text-gray-600 max-w-md">
            Estamos preparando seu dashboard. Em breve você verá seus treinos
            aqui.
          </p>
        </div>
      </AlunoLayout>
    );
  }

  console.log("Rendering FULL DASHBOARD");
  return (
    <AlunoLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <img
              src={alunoData.foto || "/default-avatar.png"}
              alt={alunoData.nome}
              className={styles.avatar}
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=👤";
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Olá, {alunoData.nome}!
              </h1>
              <p className="text-gray-600">
                Seu objetivo: {alunoData.objetivo || "Em forma! 💪"}
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {/* Treinos */}
          <div className={styles.card}>
            <Dumbbell size={32} className={styles.cardIcon} />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Treinos Ativos
              </h3>
              <p className={styles.cardNumber}>
                {alunoData.treinosAtivos || 0}
              </p>
            </div>
            <button
              className={styles.cardButton}
              onClick={() => router.push("/alunos/treinos")}
            >
              Ver Treinos
            </button>
          </div>

          {/* Medidas */}
          <div className={styles.card}>
            <Ruler size={32} className={styles.cardIcon} />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Última Medida
              </h3>
              <p className={styles.cardNumber}>
                {alunoData.ultimaMedida?.peso || 0} kg
              </p>
            </div>
            <button
              className={styles.cardButton}
              onClick={() => router.push("/alunos/medidas")}
            >
              Ver Evolução
            </button>
          </div>

          {/* Avaliações */}
          <div className={styles.card}>
            <Heart size={32} className={styles.cardIcon} />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Avaliações</h3>
              <p className={styles.cardNumber}>{alunoData.avaliacoes || 0}</p>
            </div>
            <button
              className={styles.cardButton}
              onClick={() => router.push("/alunos/avaliacoes")}
            >
              Ver Avaliações
            </button>
          </div>

          {/* Próximo Treino */}
          <div className={styles.card}>
            <Calendar size={32} className={styles.cardIcon} />
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Próximo Treino
              </h3>
              <p className={styles.cardNumber}>
                {alunoData.proximoTreino?.data || "Sem agendamento"}
              </p>
            </div>
            <button
              className={styles.cardButton}
              onClick={() => router.push("/alunos/calendario")}
            >
              Ver Cronograma
            </button>
          </div>
        </div>

        {/* ✅ NOVO - Seção de Histórico de Treinos */}
        {alunoData.ultimasExecucoes &&
          alunoData.ultimasExecucoes.length > 0 && (
            <div className={styles.historicoSection}>
              <div className={styles.historicoHeader}>
                <h2 className={styles.historicoTitle}>
                  <CheckCircle size={24} />
                  Últimos Treinos Realizados
                </h2>
                <span className={styles.historicoBadge}>
                  {alunoData.ultimasExecucoes.length} treinos
                </span>
              </div>

              <div className={styles.historicoGrid}>
                {alunoData.ultimasExecucoes.map((execucao) => (
                  <div key={execucao.id} className={styles.historicoCard}>
                    <div className={styles.historicoCardHeader}>
                      <div className={styles.historicoCardTitle}>
                        <TrendingUp size={18} />
                        <h3>{execucao.treino.nome}</h3>
                      </div>
                      <span className={styles.historicoCardDate}>
                        {getRelativeDate(execucao.data)}
                      </span>
                    </div>

                    <div className={styles.historicoCardBody}>
                      <div className={styles.historicoCardInfo}>
                        <Clock size={16} />
                        <span>{formatDuracao(execucao.duracao)}</span>
                      </div>
                      <div className={styles.historicoCardInfo}>
                        <Dumbbell size={16} />
                        <span>{execucao.exerciciosCompletados} exercícios</span>
                      </div>
                    </div>

                    {execucao.observacoes && (
                      <div className={styles.historicoCardObs}>
                        💭 {execucao.observacoes}
                      </div>
                    )}

                    <div className={styles.historicoCardFooter}>
                      <span className={styles.historicoCardTime}>
                        {formatDateTime(execucao.data)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Footer */}
        <div className={styles.footer}>
          <p className="text-gray-600">
            💪 Continue evoluindo! Seu personal está com você.
          </p>
        </div>
      </div>
    </AlunoLayout>
  );
}
