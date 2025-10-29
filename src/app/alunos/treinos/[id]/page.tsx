"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import Image from "next/image";
import {
  ArrowLeft,
  X,
  CheckCircle,
  Timer,
  Check,
  Edit,
  Trash2,
  AlertTriangle,
  Play,
  Square,
} from "lucide-react";
import styles from "./styles.module.scss";

interface Exercício {
  id: string;
  nome: string;
  series: number;
  reps: string;
  carga?: string;
  descanso: string;
  descricao?: string;
  fotoExecucao?: string;
}

interface TreinoDetalhes {
  nome: string;
  descricao: string;
  exercicios: Exercício[];
}

interface ExercicioExecutado {
  id: string;
  treinoExercicioId?: string;
  exercicioNome: string;
  series: number;
  repeticoes: string;
  carga: string | null;
  observacoes: string | null;
}

interface Execucao {
  id: string;
  intensidade: string;
  observacoes: string | null;
  data: string;
  completo: boolean;
  totalExerciciosRealizados?: number;
  exercicios?: ExercicioExecutado[];
}

export default function TreinoDetalhesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [detalhes, setDetalhes] = useState<TreinoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEx, setSelectedEx] = useState<Exercício | null>(null);

  const id = params.id as string;
  const alunoId = (session?.user as any)?.aluno?.id;
  const from = searchParams.get("from");

  const [exerciciosConcluidos, setExerciciosConcluidos] = useState<Set<string>>(
    () => {
      if (typeof window !== "undefined" && id) {
        const saved = localStorage.getItem(`treino_${id}_concluidos`);
        return saved ? new Set(JSON.parse(saved)) : new Set();
      }
      return new Set();
    }
  );

  // ✅ NOVO - Controle de séries restantes por exercício
  const [seriesRestantes, setSeriesRestantes] = useState<
    Record<string, number>
  >(() => {
    if (typeof window !== "undefined" && id) {
      const saved = localStorage.getItem(`treino_${id}_series`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // ✅ NOVO - Cronômetro de execução de série
  const [cronometroExecucao, setCronometroExecucao] = useState<{
    exercicioId: string | null;
    tempo: number;
  }>({ exercicioId: null, tempo: 0 });

  const [cronometroAtivo, setCronometroAtivo] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState<number>(0);

  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [intensidade, setIntensidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataExecucao, setDataExecucao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [execucaoEditando, setExecucaoEditando] = useState<Execucao | null>(
    null
  );
  const [editIntensidade, setEditIntensidade] = useState("");
  const [editObservacoes, setEditObservacoes] = useState("");
  const [editData, setEditData] = useState("");
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [editExerciciosSelecionados, setEditExerciciosSelecionados] = useState<
    Set<string>
  >(new Set());

  const [showVerDetalhesModal, setShowVerDetalhesModal] = useState(false);
  const [execucaoDetalhes, setExecucaoDetalhes] = useState<Execucao | null>(
    null
  );

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const [execucoes, setExecucoes] = useState<Execucao[]>([]);

  // ✅ Inicializa séries restantes quando carrega detalhes
  useEffect(() => {
    if (detalhes && Object.keys(seriesRestantes).length === 0) {
      const initialSeries: Record<string, number> = {};
      detalhes.exercicios.forEach((ex) => {
        initialSeries[ex.id] = ex.series;
      });
      setSeriesRestantes(initialSeries);
    }
  }, [detalhes]);

  // ✅ Salva séries restantes no localStorage
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      id &&
      Object.keys(seriesRestantes).length > 0
    ) {
      localStorage.setItem(
        `treino_${id}_series`,
        JSON.stringify(seriesRestantes)
      );
    }
  }, [seriesRestantes, id]);

  // ✅ Cronômetro de execução
  useEffect(() => {
    if (!cronometroExecucao.exercicioId) return;

    const timer = setInterval(() => {
      setCronometroExecucao((prev) => ({
        ...prev,
        tempo: prev.tempo + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [cronometroExecucao.exercicioId]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !alunoId || !id) {
      router.push("/alunos/treinos");
      return;
    }

    fetchDetalhes(id, alunoId);
    fetchExecucoes(id);
  }, [status, session, id, alunoId, router]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedEx(null);
        setShowRegistroModal(false);
        setShowEditModal(false);
        setShowVerDetalhesModal(false);
        setShowConfirmModal(false);
      }
    };
    if (
      selectedEx ||
      showRegistroModal ||
      showEditModal ||
      showVerDetalhesModal ||
      showConfirmModal
    ) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [
    selectedEx,
    showRegistroModal,
    showEditModal,
    showVerDetalhesModal,
    showConfirmModal,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      localStorage.setItem(
        `treino_${id}_concluidos`,
        JSON.stringify(Array.from(exerciciosConcluidos))
      );
    }
  }, [exerciciosConcluidos, id]);

  useEffect(() => {
    if (tempoRestante <= 0) {
      setCronometroAtivo(null);
      return;
    }

    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          playNotificationSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tempoRestante]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchDetalhes = async (treinoId: string, alunoId: string) => {
    setLoading(true);
    setError("");

    const url = `/api/alunos/treinos/${treinoId}/exercicios?alunoId=${alunoId}`;

    try {
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro: ${response.status} - ${errText}`);
      }

      const data: TreinoDetalhes = await response.json();
      setDetalhes(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  const fetchExecucoes = async (treinoId: string) => {
    try {
      const response = await fetch(`/api/alunos/treinos/${treinoId}/execucao`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExecucoes(data);
      }
    } catch (err) {
      console.error("Erro ao buscar execuções:", err);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "success"
  ) => {
    setToast({ show: true, message, type });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const toggleExercicioConcluido = (exercicioId: string) => {
    setExerciciosConcluidos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exercicioId)) {
        newSet.delete(exercicioId);
      } else {
        newSet.add(exercicioId);
      }
      return newSet;
    });
  };

  const toggleEditExercicio = (exercicioId: string) => {
    setEditExerciciosSelecionados((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exercicioId)) {
        newSet.delete(exercicioId);
      } else {
        newSet.add(exercicioId);
      }
      return newSet;
    });
  };

  // ✅ NOVO - Iniciar cronômetro de execução
  const iniciarCronometroExecucao = (exercicioId: string) => {
    setCronometroExecucao({
      exercicioId,
      tempo: 0,
    });
  };

  // ✅ NOVO - Cancelar execução
  const cancelarExecucao = () => {
    setCronometroExecucao({
      exercicioId: null,
      tempo: 0,
    });
  };

  // ✅ NOVO - Concluir série
  const concluirSerie = (exercicioId: string, exercicio: Exercício) => {
    const restantes = seriesRestantes[exercicioId];

    if (restantes > 1) {
      // Diminui série
      setSeriesRestantes((prev) => ({
        ...prev,
        [exercicioId]: restantes - 1,
      }));

      // Para cronômetro de execução
      setCronometroExecucao({
        exercicioId: null,
        tempo: 0,
      });

      // Inicia descanso automaticamente
      const segundos = parseTempoDescanso(exercicio.descanso);
      if (segundos > 0) {
        setCronometroAtivo(exercicioId);
        setTempoRestante(segundos);
      }

      showToast(`✅ Série concluída! ${restantes - 1}x restantes`, "success");
    } else {
      // Última série - marca como concluído
      setSeriesRestantes((prev) => ({
        ...prev,
        [exercicioId]: 0,
      }));

      setCronometroExecucao({
        exercicioId: null,
        tempo: 0,
      });

      toggleExercicioConcluido(exercicioId);
      showToast(`🎉 Exercício ${exercicio.nome} completo!`, "success");
    }
  };

  // ✅ NOVO - Resetar séries de um exercício
  const resetarSeries = (exercicioId: string, seriesOriginais: number) => {
    setSeriesRestantes((prev) => ({
      ...prev,
      [exercicioId]: seriesOriginais,
    }));
    showToast("🔄 Séries resetadas!", "info");
  };

  const iniciarCronometro = (exercicioId: string, tempoDescanso: string) => {
    if (cronometroAtivo) {
      setCronometroAtivo(null);
      setTempoRestante(0);
      return;
    }

    const segundos = parseTempoDescanso(tempoDescanso);
    if (segundos > 0) {
      setCronometroAtivo(exercicioId);
      setTempoRestante(segundos);
    }
  };

  const parseTempoDescanso = (tempo: string): number => {
    const match = tempo.match(
      /(\d+)\s*(s|seg|segundo|segundos|m|min|minuto|minutos)?/i
    );
    if (!match) return 0;

    const valor = parseInt(match[1]);
    const unidade = match[2]?.toLowerCase();

    if (!unidade || unidade.startsWith("s")) {
      return valor;
    } else if (unidade.startsWith("m")) {
      return valor * 60;
    }

    return valor;
  };

  const formatarTempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Não foi possível reproduzir som");
    }
  };

  const getDataTimeLocalFormat = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openRegistroModal = () => {
    setIntensidade("");
    setObservacoes("");
    setDataExecucao(getDataTimeLocalFormat());
    setShowRegistroModal(true);
  };

  const closeRegistroModal = () => {
    setShowRegistroModal(false);
    setIntensidade("");
    setObservacoes("");
    setDataExecucao("");
  };

  const handleRegistrarExecucao = async () => {
    if (!intensidade) {
      showToast("⚠️ Selecione a intensidade do treino!", "warning");
      return;
    }

    setSalvando(true);

    try {
      const response = await fetch(`/api/alunos/treinos/${id}/execucao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          intensidade,
          observacoes: observacoes || null,
          data: dataExecucao || undefined,
          exerciciosRealizadosIds: Array.from(exerciciosConcluidos),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao registrar execução");
      }

      await fetchExecucoes(id);
      closeRegistroModal();

      setExerciciosConcluidos(new Set());
      setSeriesRestantes({});
      if (typeof window !== "undefined") {
        localStorage.removeItem(`treino_${id}_concluidos`);
        localStorage.removeItem(`treino_${id}_series`);
      }

      showToast("✅ Treino registrado com sucesso!", "success");
    } catch (err: any) {
      showToast("❌ Erro ao registrar treino: " + err.message, "error");
    } finally {
      setSalvando(false);
    }
  };

  const openEditModal = async (execucao: Execucao) => {
    setEditExerciciosSelecionados(new Set());
    setExecucaoEditando(null);
    setEditIntensidade("");
    setEditObservacoes("");
    setEditData("");

    await new Promise((resolve) => setTimeout(resolve, 100));

    setExecucaoEditando(execucao);
    setEditIntensidade(execucao.intensidade);
    setEditObservacoes(execucao.observacoes || "");

    const dataObj = new Date(execucao.data);
    const year = dataObj.getFullYear();
    const month = String(dataObj.getMonth() + 1).padStart(2, "0");
    const day = String(dataObj.getDate()).padStart(2, "0");
    const hours = String(dataObj.getHours()).padStart(2, "0");
    const minutes = String(dataObj.getMinutes()).padStart(2, "0");
    setEditData(`${year}-${month}-${day}T${hours}:${minutes}`);

    try {
      const timestamp = Date.now();
      const response = await fetch(
        `/api/alunos/treinos/${id}/execucao?t=${timestamp}`,
        {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (response.ok) {
        const todasExecucoes = await response.json();
        const execucaoAtualizada = todasExecucoes.find(
          (e: Execucao) => e.id === execucao.id
        );

        if (
          execucaoAtualizada?.exercicios &&
          execucaoAtualizada.exercicios.length > 0
        ) {
          const idsExecutados = execucaoAtualizada.exercicios
            .map((e: ExercicioExecutado) => e.treinoExercicioId)
            .filter((id): id is string => !!id);

          setEditExerciciosSelecionados(new Set(idsExecutados));
        } else {
          setEditExerciciosSelecionados(new Set());
        }
      }
    } catch (error) {
      console.error("❌ Erro ao buscar dados:", error);
      setEditExerciciosSelecionados(new Set());
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);

    setTimeout(() => {
      setExecucaoEditando(null);
      setEditIntensidade("");
      setEditObservacoes("");
      setEditData("");
      setEditExerciciosSelecionados(new Set());
    }, 300);
  };

  const handleEditarExecucao = async () => {
    if (!editIntensidade) {
      showToast("⚠️ Selecione a intensidade do treino!", "warning");
      return;
    }

    if (!execucaoEditando) return;

    setSalvandoEdit(true);

    try {
      const response = await fetch(`/api/alunos/treinos/${id}/execucao`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          execucaoId: execucaoEditando.id,
          intensidade: editIntensidade,
          observacoes: editObservacoes || null,
          data: editData,
          exerciciosRealizadosIds: Array.from(editExerciciosSelecionados),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao editar execução");
      }

      await fetchExecucoes(id);
      await new Promise((resolve) => setTimeout(resolve, 200));

      closeEditModal();
      showToast("✅ Execução editada com sucesso!", "success");
    } catch (err: any) {
      showToast("❌ Erro ao editar: " + err.message, "error");
    } finally {
      setSalvandoEdit(false);
    }
  };

  const handleDeletarExecucao = async (execucaoId: string) => {
    showConfirm(
      "Tem certeza que deseja excluir esta execução? Esta ação não pode ser desfeita.",
      async () => {
        try {
          const response = await fetch(
            `/api/alunos/treinos/${id}/execucao?execucaoId=${execucaoId}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error("Erro ao deletar execução");
          }

          await fetchExecucoes(id);
          showToast("🗑️ Execução excluída com sucesso!", "success");
        } catch (err: any) {
          showToast("❌ Erro ao deletar: " + err.message, "error");
        }
      }
    );
  };

  const openVerDetalhesModal = (execucao: Execucao) => {
    setExecucaoDetalhes(execucao);
    setShowVerDetalhesModal(true);
  };

  const closeVerDetalhesModal = () => {
    setShowVerDetalhesModal(false);
    setExecucaoDetalhes(null);
  };

  const openModal = (ex: Exercício) => {
    if (ex.fotoExecucao) setSelectedEx(ex);
  };

  const closeModal = () => setSelectedEx(null);

  const getIntensidadeLabel = (intensidade: string) => {
    const labels: Record<string, { emoji: string; text: string }> = {
      LEVE: { emoji: "🟢", text: "Leve" },
      MODERADO: { emoji: "🟡", text: "Moderado" },
      PESADO: { emoji: "🟠", text: "Pesado" },
      MUITO_PESADO: { emoji: "🔴", text: "Muito Pesado" },
    };
    return labels[intensidade] || { emoji: "", text: intensidade };
  };

  const totalExercicios = detalhes?.exercicios.length || 0;
  const exerciciosRealizados = exerciciosConcluidos.size;
  const progressoPercentual =
    totalExercicios > 0 ? (exerciciosRealizados / totalExercicios) * 100 : 0;

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes do treino...</p>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.error}>
          <p className={styles.errorText}>{error}</p>
          <button
            onClick={() => fetchDetalhes(id, alunoId || "")}
            className={styles.retryButton}
          >
            Tentar novamente
          </button>
        </div>
      </AlunoLayout>
    );
  }

  if (!detalhes) {
    router.push("/alunos/treinos");
    return null;
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link
            href={
              from === "calendario" ? "/alunos/calendario" : "/alunos/treinos"
            }
            className={styles.backLink}
          >
            <ArrowLeft size={20} />
            {from === "calendario"
              ? "Voltar ao Calendário"
              : "Voltar à Lista de Treinos"}
          </Link>
          <h1>{detalhes.nome}</h1>
        </div>

        <div className={styles.treinoInfo}>
          <p className={styles.treinoDesc}>
            {detalhes.descricao || "Sem descrição adicional."}
          </p>
        </div>

        {detalhes.exercicios.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Este treino ainda não tem exercícios atribuídos.</p>
            <p className={styles.emptySubtext}>
              Seu treinador adicionará em breve.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span className={styles.progressText}>
                  {exerciciosRealizados} de {totalExercicios} exercícios
                </span>
                <span className={styles.progressPercent}>
                  {Math.round(progressoPercentual)}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressoPercentual}%` }}
                />
              </div>
            </div>

            <div className={styles.cardsContainer}>
              {detalhes.exercicios.map((ex, index) => {
                const isConcluido = exerciciosConcluidos.has(ex.id);
                const isCronometroAtivo = cronometroAtivo === ex.id;
                const isExecutando = cronometroExecucao.exercicioId === ex.id;
                const restantes = seriesRestantes[ex.id] ?? ex.series;

                return (
                  <div
                    key={ex.id}
                    className={`${styles.exercicioCard} ${
                      isConcluido ? styles.concluido : ""
                    }`}
                  >
                    <button
                      className={styles.checkboxBtn}
                      onClick={() => toggleExercicioConcluido(ex.id)}
                      title={
                        isConcluido
                          ? "Marcar como não concluído"
                          : "Marcar como concluído"
                      }
                    >
                      {isConcluido ? (
                        <Check size={20} className={styles.checkIcon} />
                      ) : (
                        <div className={styles.checkboxEmpty} />
                      )}
                    </button>

                    <div className={styles.cardHeader}>
                      <span className={styles.cardNumber}>{index + 1}</span>
                      <h3
                        className={`${styles.cardTitle} ${
                          ex.fotoExecucao ? styles.clickable : ""
                        }`}
                        onClick={() => openModal(ex)}
                      >
                        {ex.nome}
                        {ex.fotoExecucao && (
                          <span className={styles.photoIcon}>📷</span>
                        )}
                      </h3>
                    </div>

                    <div className={styles.cardGrid}>
                      {/* ✅ NOVO - Card de Séries com Cronômetro */}
                      <div
                        className={`${styles.cardItem} ${styles.cardItemSeries}`}
                      >
                        <span className={styles.cardLabel}>Séries</span>
                        {isExecutando ? (
                          <div className={styles.serieExecutando}>
                            <span className={styles.tempoExecucao}>
                              ⏱️ {formatarTempo(cronometroExecucao.tempo)}
                            </span>
                            <div className={styles.botoesExecucao}>
                              <button
                                className={styles.btnConcluir}
                                onClick={() => concluirSerie(ex.id, ex)}
                                title="Concluir série"
                              >
                                ✓
                              </button>
                              <button
                                className={styles.btnCancelar}
                                onClick={cancelarExecucao}
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : restantes > 0 ? (
                          <div className={styles.serieControle}>
                            <span className={styles.serieRestante}>
                              {restantes}x
                            </span>
                            <button
                              className={styles.btnIniciarSerie}
                              onClick={() => iniciarCronometroExecucao(ex.id)}
                              title="Iniciar série"
                            >
                              <Play size={14} />
                            </button>
                            {restantes < ex.series && (
                              <button
                                className={styles.btnResetSerie}
                                onClick={() => resetarSeries(ex.id, ex.series)}
                                title="Resetar séries"
                              >
                                🔄
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className={styles.serieCompleta}>
                            ✓ Completo
                          </span>
                        )}
                      </div>

                      <div className={styles.cardItem}>
                        <span className={styles.cardLabel}>Repetições</span>
                        <span className={styles.cardValue}>{ex.reps}</span>
                      </div>
                      <div className={styles.cardItem}>
                        <span className={styles.cardLabel}>Carga</span>
                        <span className={styles.cardValue}>
                          {ex.carga || "Livre"}
                        </span>
                      </div>

                      <div
                        className={`${styles.cardItem} ${styles.cardItemDescanso}`}
                        onClick={() => iniciarCronometro(ex.id, ex.descanso)}
                      >
                        <span className={styles.cardLabel}>
                          <Timer size={14} /> Descanso
                        </span>
                        <span
                          className={`${styles.cardValue} ${
                            isCronometroAtivo ? styles.cronometroAtivo : ""
                          }`}
                        >
                          {isCronometroAtivo
                            ? formatarTempo(tempoRestante)
                            : ex.descanso}
                        </span>
                      </div>
                    </div>

                    {ex.descricao && (
                      <div className={styles.cardObs}>
                        <span className={styles.obsLabel}>Observações:</span>
                        <p className={styles.obsText}>{ex.descricao}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className={styles.fabButton}
              onClick={openRegistroModal}
              title="Registrar execução do treino"
            >
              <CheckCircle size={28} />
            </button>
          </>
        )}

        {/* RESTO DOS MODAIS E HISTÓRICO CONTINUAM IGUAIS... */}
        {execucoes.length > 0 && (
          <div className={styles.historicoContainer}>
            <h2 className={styles.historicoTitle}>📊 Histórico de Execuções</h2>
            <div className={styles.historicoGrid}>
              {execucoes.map((exec) => {
                const { emoji, text } = getIntensidadeLabel(exec.intensidade);
                return (
                  <div key={exec.id} className={styles.historicoCard}>
                    <div className={styles.cardHeaderTop}>
                      <span className={styles.cardDate}>
                        📅{" "}
                        {new Date(exec.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className={styles.cardActions}>
                        <button
                          onClick={() => openEditModal(exec)}
                          className={styles.cardEditBtn}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletarExecucao(exec.id)}
                          className={styles.cardDeleteBtn}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.cardBadges}>
                      {exec.completo && (
                        <span className={styles.completoBadge}>✓ Completo</span>
                      )}
                      <span className={styles.intensidadeBadge}>
                        {emoji} {text}
                      </span>
                    </div>

                    <div className={styles.cardCount}>
                      {exec.totalExerciciosRealizados || 0} exercícios
                      realizados
                    </div>

                    {exec.observacoes && (
                      <div className={styles.cardObs}>{exec.observacoes}</div>
                    )}

                    <button
                      onClick={() => openVerDetalhesModal(exec)}
                      className={styles.cardViewBtn}
                    >
                      Ver detalhes →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {detalhes.exercicios.length > 0 && (
          <div className={styles.footer}>
            <strong>{detalhes.exercicios.length}</strong> exercício(s) • Bom
            treino! 💪
          </div>
        )}

        {/* TODOS OS MODAIS (foto, registro, editar, detalhes, confirmar, toast) continuam iguais */}
        {/* ... (código dos modais omitido para brevidade) */}

        {toast.show && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            <span>{toast.message}</span>
            <button
              className={styles.toastClose}
              onClick={() => setToast({ ...toast, show: false })}
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </AlunoLayout>
  );
}
