"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Aluno } from "@/types";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import styles from "./styles.module.scss";
import { Toast } from "@/components/ui/Toast/Toast";

import {
  User,
  Heart,
  Ruler,
  Dumbbell,
  Calendar,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Edit,
  MessageCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";

// ✅ INTERFACES COMPLETAS
interface ExecucaoTreino {
  id: string;
  data: Date;
  intensidade: string;
  observacoes: string | null;
  completo: boolean;
  treino: {
    id: string;
    nome: string;
    objetivo: string | null;
  };
  exerciciosCompletados: number;
  exercicios: Array<{
    nome: string;
    series: number;
    repeticoes: string;
    carga: string | null;
    observacoes: string | null;
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
  ultimasExecucoes?: ExecucaoTreino[];
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

  // ✅ Estados para expansão e edição
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingExecucao, setEditingExecucao] = useState<ExecucaoTreino | null>(
    null
  );
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [treinoExerciciosDisponiveis, setTreinoExerciciosDisponiveis] =
    useState<any[]>([]);
  const [loadingTreino, setLoadingTreino] = useState(false);

  // ✅ NOVO - Toast
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // ✅ NOVO - Função para mostrar toast
  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "success"
  ) => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (!session) {
      router.push("/alunos/login");
      return;
    }

    const user = session?.user as CustomUser;
    const alunoId = user?.aluno?.id;

    if (!alunoId) {
      setError("Usuário sem dados de aluno");
      setLoading(false);
      return;
    }

    fetchAlunoData(alunoId);
  }, [status, session, router]);

  const fetchAlunoData = async (alunoId: string) => {
    setLoading(true);
    setError("");

    try {
      const url = `/api/alunos/dashboard?alunoId=${alunoId}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar dados: ${response.status}`);
      }

      const data = await response.json();

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
        ultimasExecucoes: data.ultimasExecucoes || [],
      };

      setAlunoData(adjustedData);
    } catch (err: any) {
      const msg = err.message || "Erro ao carregar seus dados";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FORMATADORES
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

  const getIntensidadeLabel = (intensidade: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      LEVE: { label: "Leve", color: "#10b981" },
      MODERADO: { label: "Moderado", color: "#3b82f6" },
      PESADO: { label: "Pesado", color: "#f59e0b" },
      MUITO_PESADO: { label: "Muito Pesado", color: "#ef4444" },
    };
    return labels[intensidade] || { label: intensidade, color: "#6b7280" };
  };

  // ✅ HANDLERS
  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ✅ Abrir modal de edição
  const handleOpenEdit = async (execucao: ExecucaoTreino) => {
    setEditingExecucao(execucao);
    setModalEditOpen(true);

    // Busca os exercícios disponíveis do treino
    setLoadingTreino(true);
    try {
      const response = await fetch(`/api/treinos/${execucao.treino.id}`);
      if (response.ok) {
        const treino = await response.json();
        setTreinoExerciciosDisponiveis(treino.exercicios || []);
      }
    } catch (error) {
      console.error("Erro ao carregar treino:", error);
    } finally {
      setLoadingTreino(false);
    }
  };

  // ✅ Adicionar exercício
  const handleAddExercicio = (exercicio: any) => {
    if (!editingExecucao) return;

    const novoExercicio = {
      nome: exercicio.exercicio.nome,
      series: exercicio.series,
      repeticoes: exercicio.repeticoes,
      carga: exercicio.carga || null,
      observacoes: null,
    };

    setEditingExecucao({
      ...editingExecucao,
      exercicios: [...editingExecucao.exercicios, novoExercicio],
      exerciciosCompletados: editingExecucao.exercicios.length + 1,
    });
  };

  // ✅ Remover exercício
  const handleRemoveExercicio = (index: number) => {
    if (!editingExecucao) return;

    const novosExercicios = editingExecucao.exercicios.filter(
      (_, i) => i !== index
    );

    setEditingExecucao({
      ...editingExecucao,
      exercicios: novosExercicios,
      exerciciosCompletados: novosExercicios.length,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingExecucao) return;

    try {
      const response = await fetch(
        `/api/alunos/execucoes/${editingExecucao.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intensidade: editingExecucao.intensidade,
            observacoes: editingExecucao.observacoes,
            completo: editingExecucao.completo,
            data: editingExecucao.data,
            exercicios: editingExecucao.exercicios,
          }),
        }
      );

      if (response.ok) {
        setModalEditOpen(false);
        setEditingExecucao(null);
        setTreinoExerciciosDisponiveis([]);

        setToast({
          show: true,
          message: "✅ Treino atualizado com sucesso!",
          type: "success",
        });

        const user = session?.user as CustomUser;
        const alunoId = user?.aluno?.id;
        if (alunoId) {
          await fetchAlunoData(alunoId);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      setToast({
        show: true,
        message: `❌ ${error.message || "Erro ao salvar alterações"}`,
        type: "error",
      });
    }
  };

  // ✅ Função para compartilhar no WhatsApp
  const handleShareWhatsApp = (execucao: ExecucaoTreino) => {
    const mensagem = `
🏋️ *TREINO REALIZADO*

*Treino:* ${execucao.treino.nome}
*Data:* ${formatDateTime(execucao.data)}
*Intensidade:* ${getIntensidadeLabel(execucao.intensidade).label}
*Exercícios:* ${execucao.exerciciosCompletados}
*Status:* ${execucao.completo ? "✅ Completo" : "⏳ Incompleto"}

${execucao.exercicios
  .map((ex) => `• ${ex.nome} - ${ex.series}x${ex.repeticoes}`)
  .join("\n")}

${execucao.observacoes ? `*Observações:* ${execucao.observacoes}` : ""}

💪 Treino realizado com sucesso!
  `.trim();

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  // ✅ RENDERS CONDICIONAIS
  if (status === "loading" || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className="mt-2 text-gray-600">Carregando seus dados...</p>
      </div>
    );
  }

  if (error) {
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

  // ✅ RENDER PRINCIPAL
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
        {/* Cards Grid - OS 4 PRINCIPAIS */}
        <div className={styles.cardsGrid}>
          {/* Treinos */}
          <div className={styles.premiumCard}>
            <Dumbbell size={32} className={styles.premiumCardIcon} />
            <div>
              <h3 className={styles.premiumCardTitle}>Treinos Ativos</h3>
              <p className={styles.premiumCardNumber}>
                {alunoData.treinosAtivos || 0}
              </p>
            </div>
            <button
              className={styles.premiumCardButton}
              onClick={() => router.push("/alunos/treinos")}
            >
              Ver Treinos
            </button>
          </div>

          {/* Medidas */}
          <div className={styles.premiumCard}>
            <Ruler size={32} className={styles.premiumCardIcon} />
            <div>
              <h3 className={styles.premiumCardTitle}>Última Medida</h3>
              <p className={styles.premiumCardNumber}>
                {alunoData.ultimaMedida?.peso || 0} kg
              </p>
            </div>
            <button
              className={styles.premiumCardButton}
              onClick={() => router.push("/alunos/medidas")}
            >
              Ver Evolução
            </button>
          </div>

          {/* Avaliações */}
          <div className={styles.premiumCard}>
            <Heart size={32} className={styles.premiumCardIcon} />
            <div>
              <h3 className={styles.premiumCardTitle}>Avaliações</h3>
              <p className={styles.premiumCardNumber}>
                {alunoData.avaliacoes || 0}
              </p>
            </div>
            <button
              className={styles.premiumCardButton}
              onClick={() => router.push("/alunos/avaliacoes")}
            >
              Ver Avaliações
            </button>
          </div>

          {/* Próximo Treino */}
          <div className={styles.premiumCard}>
            <Calendar size={32} className={styles.premiumCardIcon} />
            <div>
              <h3 className={styles.premiumCardTitle}>Próximo Treino</h3>
              <p className={styles.premiumCardNumber}>
                {alunoData.proximoTreino?.data || "Sem agendamento"}
              </p>
            </div>
            <button
              className={styles.premiumCardButton}
              onClick={() => router.push("/alunos/calendario")}
            >
              Ver Cronograma
            </button>
          </div>
        </div>

        {/* ✅ HISTÓRICO COM EXPANSÃO */}
        {alunoData.ultimasExecucoes &&
          alunoData.ultimasExecucoes.length > 0 && (
            <div className={styles.historicoSection}>
              <div className={styles.historicoHeader}>
                <h2 className={styles.historicoTitle}>
                  <CheckCircle size={24} />
                  Histórico de Treinos
                </h2>
                <span className={styles.historicoBadge}>
                  {alunoData.ultimasExecucoes.length} treinos realizados
                </span>
              </div>

              <div className={styles.historicoGrid}>
                {alunoData.ultimasExecucoes.map((execucao) => {
                  const intensidade = getIntensidadeLabel(execucao.intensidade);
                  const isExpanded = expandedCards.has(execucao.id);

                  return (
                    <div key={execucao.id} className={styles.historicoCard}>
                      {/* Header */}
                      <div className={styles.historicoCardHeader}>
                        <div className={styles.historicoCardTitleArea}>
                          <div className={styles.historicoCardTitle}>
                            <TrendingUp size={20} />
                            <h3>{execucao.treino.nome}</h3>
                          </div>
                          {execucao.treino.objetivo && (
                            <span className={styles.treinoObjetivo}>
                              🎯 {execucao.treino.objetivo}
                            </span>
                          )}
                        </div>
                        <span className={styles.historicoCardDate}>
                          {formatDateTime(execucao.data)}
                        </span>
                      </div>

                      {/* Info Badges */}
                      <div className={styles.historicoCardInfo}>
                        <div className={styles.infoBadge}>
                          <TrendingUp size={16} />
                          <span
                            style={{
                              color: intensidade.color,
                              fontWeight: 700,
                            }}
                          >
                            {intensidade.label}
                          </span>
                        </div>
                        <div className={styles.infoBadge}>
                          <Dumbbell size={16} />
                          <span>
                            {execucao.exerciciosCompletados} exercícios
                          </span>
                        </div>
                        {execucao.completo && (
                          <div
                            className={styles.infoBadge}
                            style={{ borderColor: "#10b981" }}
                          >
                            <CheckCircle size={16} color="#10b981" />
                            <span style={{ color: "#10b981", fontWeight: 600 }}>
                              Completo
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ✅ Lista de Exercícios (Colapsável) */}
                      {isExpanded && execucao.exercicios.length > 0 && (
                        <div className={styles.exerciciosLista}>
                          <h4 className={styles.exerciciosListaTitulo}>
                            Exercícios Realizados:
                          </h4>
                          <div className={styles.exerciciosGrid}>
                            {execucao.exercicios.map((ex, index) => (
                              <div key={index} className={styles.exercicioItem}>
                                <div className={styles.exercicioOrdem}>
                                  {index + 1}
                                </div>
                                <div className={styles.exercicioContent}>
                                  <div className={styles.exercicioNome}>
                                    {ex.nome}
                                  </div>
                                  <div className={styles.exercicioDetalhes}>
                                    <span className={styles.detalheItem}>
                                      <strong>Séries:</strong> {ex.series}
                                    </span>
                                    <span className={styles.detalheSeparator}>
                                      •
                                    </span>
                                    <span className={styles.detalheItem}>
                                      <strong>Reps:</strong> {ex.repeticoes}
                                    </span>
                                    {ex.carga && (
                                      <>
                                        <span
                                          className={styles.detalheSeparator}
                                        >
                                          •
                                        </span>
                                        <span className={styles.detalheItem}>
                                          <strong>Carga:</strong> {ex.carga}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {ex.observacoes && (
                                    <div className={styles.exercicioObs}>
                                      💭 {ex.observacoes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações Gerais */}
                      {execucao.observacoes && (
                        <div className={styles.historicoCardObs}>
                          <strong>Observações do treino:</strong>
                          <p>{execucao.observacoes}</p>
                        </div>
                      )}

                      {/* ✅ Botões de Ação */}
                      <div className={styles.historicoCardActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => toggleExpand(execucao.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp size={18} />
                              Ocultar Exercícios
                            </>
                          ) : (
                            <>
                              <ChevronDown size={18} />
                              Ver Exercícios ({execucao.exerciciosCompletados})
                            </>
                          )}
                        </button>

                        <button
                          className={styles.editButtonAction}
                          onClick={() => handleOpenEdit(execucao)}
                        >
                          <Edit size={18} />
                          Editar
                        </button>

                        {/* ✅ NOVO - BOTÃO WHATSAPP */}
                        <button
                          className={styles.whatsappButtonAction}
                          onClick={() => handleShareWhatsApp(execucao)}
                          title="Compartilhar no WhatsApp"
                        >
                          <MessageCircle size={18} />
                          WhatsApp
                        </button>
                      </div>

                      {/* Footer */}
                      <div className={styles.historicoCardFooter}>
                        <span className={styles.historicoCardTime}>
                          {getRelativeDate(execucao.data)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* ✅ Modal de Edição */}
        <Modal
          isOpen={modalEditOpen}
          onClose={() => {
            setModalEditOpen(false);
            setEditingExecucao(null);
            setTreinoExerciciosDisponiveis([]);
          }}
          title="Editar Execução do Treino"
          size="large"
        >
          {editingExecucao && (
            <div className={styles.modalContent}>
              {/* Header da Modal */}
              <div className={styles.modalHeaderEdit}>
                <div className={styles.modalHeaderInfo}>
                  <TrendingUp size={24} className={styles.modalHeaderIcon} />
                  <div>
                    <h3>{editingExecucao.treino.nome}</h3>
                    <p>{formatDateTime(editingExecucao.data)}</p>
                  </div>
                </div>
              </div>

              {/* ✅ NOVO - Campo de Data */}
              <div className={styles.modalFieldEdit}>
                <label className={styles.modalLabel}>
                  <Calendar size={16} />
                  Data e Hora da Execução
                </label>
                <input
                  type="datetime-local"
                  value={new Date(editingExecucao.data)
                    .toISOString()
                    .slice(0, 16)}
                  onChange={(e) =>
                    setEditingExecucao({
                      ...editingExecucao,
                      data: new Date(e.target.value),
                    })
                  }
                  className={styles.inputDateTime}
                />
              </div>

              <div className={styles.modalBodyEdit}>
                {/* ✅ Seletor Visual de Intensidade */}
                <div className={styles.modalFieldEdit}>
                  <label className={styles.modalLabel}>
                    Intensidade do Treino
                  </label>
                  <div className={styles.intensidadeSelector}>
                    {[
                      {
                        value: "LEVE",
                        label: "Leve",
                        icon: "😊",
                        color: "#10b981",
                      },
                      {
                        value: "MODERADO",
                        label: "Moderado",
                        icon: "💪",
                        color: "#3b82f6",
                      },
                      {
                        value: "PESADO",
                        label: "Pesado",
                        icon: "🔥",
                        color: "#f59e0b",
                      },
                      {
                        value: "MUITO_PESADO",
                        label: "Muito Pesado",
                        icon: "⚡",
                        color: "#ef4444",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.intensidadeOption} ${
                          editingExecucao.intensidade === option.value
                            ? styles.intensidadeOptionActive
                            : ""
                        }`}
                        style={{
                          borderColor:
                            editingExecucao.intensidade === option.value
                              ? option.color
                              : "#e2e8f0",
                          backgroundColor:
                            editingExecucao.intensidade === option.value
                              ? `${option.color}15`
                              : "white",
                        }}
                        onClick={() =>
                          setEditingExecucao({
                            ...editingExecucao,
                            intensidade: option.value,
                          })
                        }
                      >
                        <span className={styles.intensidadeIcon}>
                          {option.icon}
                        </span>
                        <span
                          className={styles.intensidadeLabel}
                          style={{
                            color:
                              editingExecucao.intensidade === option.value
                                ? option.color
                                : "#64748b",
                          }}
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div className={styles.modalFieldEdit}>
                  <label className={styles.modalLabel}>Observações</label>
                  <textarea
                    value={editingExecucao.observacoes || ""}
                    onChange={(e) =>
                      setEditingExecucao({
                        ...editingExecucao,
                        observacoes: e.target.value,
                      })
                    }
                    className={styles.textareaEdit}
                    rows={3}
                    placeholder="Como foi o treino? Alguma observação importante..."
                  />
                </div>

                {/* Checkbox Completo */}
                <div className={styles.modalFieldEdit}>
                  <label className={styles.checkboxLabelEdit}>
                    <input
                      type="checkbox"
                      checked={editingExecucao.completo}
                      onChange={(e) =>
                        setEditingExecucao({
                          ...editingExecucao,
                          completo: e.target.checked,
                        })
                      }
                    />
                    <CheckCircle size={20} />
                    <span>Treino completo</span>
                  </label>
                </div>

                {/* ✅ Lista de Exercícios Realizados (Removíveis) */}
                <div className={styles.exerciciosEditSection}>
                  <div className={styles.exerciciosEditHeader}>
                    <h4>
                      <Dumbbell size={20} />
                      Exercícios Realizados ({editingExecucao.exercicios.length}
                      )
                    </h4>
                  </div>

                  {editingExecucao.exercicios.length === 0 ? (
                    <div className={styles.exerciciosEmpty}>
                      <p>Nenhum exercício realizado</p>
                    </div>
                  ) : (
                    <div className={styles.exerciciosEditList}>
                      {editingExecucao.exercicios.map((ex, index) => (
                        <div key={index} className={styles.exercicioEditCard}>
                          <div className={styles.exercicioEditOrdem}>
                            {index + 1}
                          </div>
                          <div className={styles.exercicioEditContent}>
                            <div className={styles.exercicioEditNome}>
                              {ex.nome}
                            </div>
                            <div className={styles.exercicioEditDetalhes}>
                              {ex.series}x{ex.repeticoes}
                              {ex.carga && ` - ${ex.carga}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.exercicioRemoveBtn}
                            onClick={() => handleRemoveExercicio(index)}
                            title="Remover exercício"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ✅ Adicionar Exercícios do Treino */}
                <div className={styles.exerciciosAddSection}>
                  <div className={styles.exerciciosAddHeader}>
                    <h4>➕ Adicionar Exercícios</h4>
                    <p>Exercícios disponíveis no treino original</p>
                  </div>

                  {loadingTreino ? (
                    <div className={styles.exerciciosLoading}>
                      <div className={styles.spinner} />
                      <span>Carregando exercícios...</span>
                    </div>
                  ) : treinoExerciciosDisponiveis.length === 0 ? (
                    <div className={styles.exerciciosEmpty}>
                      <p>Nenhum exercício disponível</p>
                    </div>
                  ) : (
                    <div className={styles.exerciciosAddList}>
                      {treinoExerciciosDisponiveis
                        .filter(
                          (te) =>
                            !editingExecucao.exercicios.some(
                              (e) => e.nome === te.exercicio.nome
                            )
                        )
                        .map((te) => (
                          <button
                            key={te.id}
                            type="button"
                            className={styles.exercicioAddCard}
                            onClick={() => handleAddExercicio(te)}
                          >
                            <div className={styles.exercicioAddIcon}>+</div>
                            <div className={styles.exercicioAddContent}>
                              <div className={styles.exercicioAddNome}>
                                {te.exercicio.nome}
                              </div>
                              <div className={styles.exercicioAddDetalhes}>
                                {te.series}x{te.repeticoes}
                                {te.carga && ` - ${te.carga}`}
                              </div>
                            </div>
                          </button>
                        ))}

                      {treinoExerciciosDisponiveis.every((te) =>
                        editingExecucao.exercicios.some(
                          (e) => e.nome === te.exercicio.nome
                        )
                      ) && (
                        <div className={styles.exerciciosEmpty}>
                          <p>✅ Todos os exercícios já foram adicionados</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.modalActionsEdit}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalEditOpen(false);
                    setEditingExecucao(null);
                    setTreinoExerciciosDisponiveis([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                  <CheckCircle size={18} />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Footer */}
        <div className={styles.footer}>
          <p className="text-gray-600">
            💪 Continue evoluindo! Seu personal está com você.
          </p>
        </div>

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    </AlunoLayout>
  );
}
