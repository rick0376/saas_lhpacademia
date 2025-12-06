"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { jsPDF } from "jspdf"; // Novo
import { FileText, Share2 } from "lucide-react"; // Novos ícones
import styles from "./detalhesStyles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { CronogramaSection } from "./CronogramaSection";
import { ExecucaoSection } from "./ExecucaoSection";
import { Toast } from "../ui/Toast/Toast";
import { ConfirmModal } from "../ui/ConfirmModal/ConfirmModal";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { FaWhatsapp } from "react-icons/fa";

interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: string;
}

interface TreinoExercicio {
  id: string;
  ordem: number;
  series: number;
  repeticoes: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
  exercicio: Exercicio;
}

interface TreinoDetalhesProps {
  treino: any;
  permissoesEditar: boolean;
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}
type PermissoesMap = Record<string, Permissao>;

const DEFAULT_NOVO_EXERCICIO = {
  exercicioId: "",
  series: 3,
  repeticoes: "12-15",
  carga: "20",
  descanso: 40,
  observacoes: "",
};

export const TreinoDetalhes: React.FC<TreinoDetalhesProps> = ({
  treino,
  permissoesEditar,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const { refresh, isRefreshing } = useAutoRefresh({
    interval: 30000,
    enabled: true,
  });

  const [exercicios, setExercicios] = useState<any[]>([]);
  const [modalAddExercicio, setModalAddExercicio] = useState(false);
  const [modalEditExercicio, setModalEditExercicio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState("");

  const [permissoes, setPermissoes] = useState<PermissoesMap>({});
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);
  const recursosTreinos = ["treinos", "treinos_compartilhar"];

  // carregar permissões do usuário logado
  useEffect(() => {
    const fetchPermissoes = async () => {
      try {
        // SUPERADMIN: tudo liberado
        if (session?.user?.role === "SUPERADMIN") {
          const full: PermissoesMap = {};
          recursosTreinos.forEach((r) => {
            full[r] = {
              recurso: r,
              criar: true,
              ler: true,
              editar: true,
              deletar: true,
            };
          });
          setPermissoes(full);
          setPermissoesCarregadas(true);
          return;
        }

        const resp = await fetch("/api/permissoes/usuario");
        if (!resp.ok) throw new Error("Erro ao buscar permissões");
        const data: Permissao[] = await resp.json();

        const map: PermissoesMap = {};
        recursosTreinos.forEach((recurso) => {
          const p = data.find((perm) => perm.recurso === recurso);
          map[recurso] = p ?? {
            recurso,
            criar: false,
            ler: false,
            editar: false,
            deletar: false,
          };
        });

        setPermissoes(map);
        setPermissoesCarregadas(true);
      } catch {
        setPermissoes({});
        setPermissoesCarregadas(true);
      }
    };

    if (session) fetchPermissoes();
  }, [session]);

  // helpers
  const permTreinos = permissoes["treinos"] ?? {
    recurso: "treinos",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  };

  const canCompartilharFichas = !!permissoes["treinos_compartilhar"]?.ler;
  const canEditarTreino = !!permissoesEditar && !!permTreinos; // mantém o prop como verdade final
  const canAtualizar =
    !!permTreinos.ler || session?.user?.role === "SUPERADMIN";

  const [novoExercicio, setNovoExercicio] = useState(DEFAULT_NOVO_EXERCICIO);

  const [exercicioEditando, setExercicioEditando] = useState<{
    id: string;
    series: number;
    repeticoes: string;
    carga: string;
    descanso: number;
    observacoes: string;
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    exercicioId: string;
    exercicioNome: string;
    loading: boolean;
  }>({
    isOpen: false,
    exercicioId: "",
    exercicioNome: "",
    loading: false,
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

  useEffect(() => {
    fetchExercicios();
  }, []);

  const fetchExercicios = async () => {
    try {
      const response = await fetch("/api/exercicios");
      const data = await response.json();
      setExercicios(data);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    }
  };

  // ============================================================
  // 🚀 GERAR PDF DA FICHA
  // ============================================================
  const gerarPdfFicha = async () => {
    if (!treino) return;

    const nomeCliente = session?.user?.name || "SaaS Academia";
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

    const getLogoBase64 = async () => {
      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const resp = await fetch(`${origin}/imagens/logo.png`, {
          cache: "no-store",
        });
        if (!resp.ok) return "";
        const blob = await resp.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };

    const logoDataUri = await getLogoBase64();

    const printHeader = () => {
      doc.setFillColor(25, 35, 55);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setFillColor(218, 165, 32);
      doc.rect(0, 35, pageWidth, 5, "F");

      if (logoDataUri) {
        try {
          doc.addImage(logoDataUri, "PNG", 10, 7, 18, 18);
        } catch {}
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("FICHA DE TREINO", pageWidth / 2, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(218, 165, 32); // <--- AQUI ELE DEFINE DOURADO
      doc.text(`Aluno: ${treino.aluno.nome}`, margin, 30);
      doc.text(`Treino: ${treino.nome}`, pageWidth - margin, 30, {
        align: "right",
      });
    };

    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - 10;

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(nomeCliente, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    // --- CORREÇÃO AQUI ---
    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 50;
        printHeader();

        // RESETAR A COR PARA PRETO APÓS O CABEÇALHO DA NOVA PÁGINA
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10); // Garante o tamanho da fonte correto
      }
    };

    printHeader();

    // Info do Treino
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Preto na primeira página
    doc.text(`Objetivo: ${treino.objetivo || "-"}`, margin, y);
    doc.text(
      `Status: ${treino.ativo ? "Ativo" : "Inativo"}`,
      pageWidth - margin,
      y,
      { align: "right" }
    );
    y += 10;

    // Tabela de Exercícios (Cabeçalho)
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Garante preto para os títulos
    doc.text("EXERCÍCIO", margin + 2, y + 5);
    doc.text("SÉRIES", 90, y + 5);
    doc.text("REPS", 110, y + 5);
    doc.text("CARGA", 130, y + 5);
    doc.text("DESC.", 150, y + 5);
    doc.text("OBS", 170, y + 5);
    y += 10;

    doc.setFont("helvetica", "normal");

    treino.exercicios.forEach((te: TreinoExercicio) => {
      checkPageBreak(15);

      const nome = doc.splitTextToSize(`${te.ordem}. ${te.exercicio.nome}`, 75);
      const obs = doc.splitTextToSize(te.observacoes || "-", 30);
      const height = Math.max(nome.length * 4, obs.length * 4, 6);

      doc.text(nome, margin + 2, y);
      doc.text(String(te.series), 90, y);
      doc.text(te.repeticoes, 110, y);
      doc.text(te.carga || "-", 130, y);
      doc.text(te.descanso || "-", 150, y);
      doc.text(obs, 170, y);

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y + height + 2, pageWidth - margin, y + height + 2);
      y += height + 6;
    });

    printFooter();
    doc.save(`ficha-${treino.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  // ============================================================
  // 🚀 WHATSAPP DA FICHA
  // ============================================================
  const enviarWhatsAppFicha = () => {
    const nomeCliente = session?.user?.name || "SaaS Academia";

    let texto = `💪 *FICHA DE TREINO*\n`;
    texto += `👤 Aluno: ${treino.aluno.nome}\n`;
    texto += `📄 Treino: ${treino.nome}\n`;
    if (treino.objetivo) texto += `🎯 Objetivo: ${treino.objetivo}\n`;
    texto += `\n`;

    treino.exercicios.forEach((te: TreinoExercicio) => {
      texto += `✅ *${te.ordem}. ${te.exercicio.nome}*\n`;
      texto += `   ${te.series} x ${te.repeticoes}`;
      if (te.carga) texto += ` | ⚖️ ${te.carga}`;
      if (te.descanso) texto += ` | ⏱️ ${te.descanso}`;
      if (te.observacoes) texto += `\n   ⚠️ Obs: ${te.observacoes}`;
      texto += `\n\n`;
    });

    texto += `------------------------------\n`;
    texto += `📌 *${nomeCliente}*`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  // ============================================================

  const handleReordenar = async (
    exercicioId: string,
    direcao: "up" | "down"
  ) => {
    if (!permissoesEditar) {
      setToast({
        show: true,
        message: "⛔ Você não tem permissão para reordenar exercícios",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/treinos/${treino.id}/exercicios/reordenar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercicioId,
            direcao,
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao reordenar");
      await refresh();
      setToast({
        show: true,
        message: "✅ Ordem atualizada com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao reordenar:", error);
      setToast({
        show: true,
        message: "❌ Erro ao reordenar exercício",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercicio = async () => {
    if (!permissoesEditar) {
      setToast({
        show: true,
        message: "⛔ Você não tem permissão para adicionar exercícios",
        type: "error",
      });
      return;
    }

    if (!novoExercicio.exercicioId) {
      setToast({
        show: true,
        message: "Selecione um exercício",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/treinos/${treino.id}/exercicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novoExercicio,
          descanso: `${novoExercicio.descanso}s`,
          ordem: treino.exercicios.length + 1,
        }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar exercício");
      await refresh();
      setModalAddExercicio(false);
      setNovoExercicio(DEFAULT_NOVO_EXERCICIO);
      setToast({
        show: true,
        message: "✅ Exercício adicionado com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      setToast({
        show: true,
        message: "❌ Erro ao adicionar exercício",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (te: TreinoExercicio) => {
    const descansoNumero = te.descanso
      ? parseInt(te.descanso.replace(/\D/g, "")) || 60
      : 60;

    setExercicioEditando({
      id: te.id,
      series: te.series,
      repeticoes: te.repeticoes,
      carga: te.carga || "",
      descanso: descansoNumero,
      observacoes: te.observacoes || "",
    });
    setModalEditExercicio(true);
  };

  const handleEditExercicio = async () => {
    if (!permissoesEditar) {
      setToast({
        show: true,
        message: "⛔ Você não tem permissão para editar exercícios",
        type: "error",
      });
      return;
    }

    if (!exercicioEditando) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/treinos/${treino.id}/exercicios/${exercicioEditando.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            series: exercicioEditando.series,
            repeticoes: exercicioEditando.repeticoes,
            carga: exercicioEditando.carga,
            descanso: `${exercicioEditando.descanso}s`,
            observacoes: exercicioEditando.observacoes,
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao atualizar exercício");
      await refresh();
      setModalEditExercicio(false);
      setExercicioEditando(null);
      setToast({
        show: true,
        message: "✅ Exercício atualizado com sucesso!",
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao editar:", error);
      setToast({
        show: true,
        message: "❌ Erro ao atualizar exercício",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExercicio = async () => {
    if (!permissoesEditar) {
      setToast({
        show: true,
        message: "⛔ Você não tem permissão para remover exercícios",
        type: "error",
      });
      return;
    }

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(
        `/api/treinos/${treino.id}/exercicios?exercicioId=${confirmModal.exercicioId}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover exercício");
      }

      setConfirmModal({
        isOpen: false,
        exercicioId: "",
        exercicioNome: "",
        loading: false,
      });
      setToast({
        show: true,
        message: "✅ Exercício removido com sucesso!",
        type: "success",
      });
      await refresh();
    } catch (error: any) {
      setConfirmModal((prev) => ({ ...prev, loading: false }));
      setToast({
        show: true,
        message: error.message || "❌ Erro ao remover exercício",
        type: "error",
      });
    }
  };

  const getGrupoMuscularLabel = (grupo: string) => {
    const labels: Record<string, string> = {
      PEITO: "Peito",
      COSTAS: "Costas",
      OMBROS: "Ombros",
      BICEPS: "Bíceps",
      TRICEPS: "Tríceps",
      PERNAS: "Pernas",
      GLUTEOS: "Glúteos",
      ABDOMEN: "Abdômen",
      PANTURRILHA: "Panturrilha",
      ANTEBRACO: "Antebraço",
      CARDIO: "Cardio",
      FUNCIONAL: "Funcional",
    };
    return labels[grupo] || grupo;
  };

  const exerciciosFiltrados = filtroGrupo
    ? exercicios.filter((e) => e.grupoMuscular === filtroGrupo)
    : exercicios;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* ESQUERDA: Voltar + Título + Meta */}
        <div className={styles.headerLeft}>
          <Link href="/dashboard/treinos" className={styles.backButton}>
            ← Voltar
          </Link>
          <div>
            <h1 className={styles.title}>{treino.nome}</h1>
            <div className={styles.meta}>
              <span className={styles.metaItem}>👤 {treino.aluno.nome}</span>
              {treino.objetivo && (
                <span className={styles.metaItem}>🎯 {treino.objetivo}</span>
              )}
              <span
                className={`${styles.statusBadge} ${
                  treino.ativo ? styles.ativo : styles.inativo
                }`}
              >
                {treino.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* BOTÃO PRINCIPAL - Full width no mobile */}
          {canEditarTreino && (
            <div className={styles.primaryAction}>
              <Button
                variant="primary"
                onClick={() => setModalAddExercicio(true)}
                disabled={loading}
                size="medium"
                className={`${styles.addBtn} ${styles.addButton}`}
              >
                <span className={styles.icon}>+</span>
                Adicionar Exercício
              </Button>
            </div>
          )}

          {/* AÇÕES SECUNDÁRIAS - Sempre à direita */}
        </div>
      </div>
      <div className={styles.actionsGroup}>
        {canCompartilharFichas && (
          <>
            <button
              className={`${styles.actionBtn} ${styles.btnPdf}`}
              onClick={gerarPdfFicha}
            >
              <FileText className={styles.iconBtn} />
              <span className={styles.hideMobile}>PDF</span>
            </button>
            <button
              className={`${styles.actionBtn} ${styles.btnWhats}`}
              onClick={enviarWhatsAppFicha}
            >
              <FaWhatsapp className={styles.iconBtn} />
              <span className={styles.hideMobile}>Whats</span>
            </button>
          </>
        )}

        {canEditarTreino && (
          <button
            className={`${styles.actionBtn} ${styles.btnEditar}`}
            onClick={() =>
              router.push(`/dashboard/treinos/${treino.id}/editar`)
            }
          >
            <span className={styles.iconBtn}>✏️</span>
            <span className={styles.hideMobile}>Editar</span>
          </button>
        )}
      </div>
      <div className={styles.exerciciosList}>
        <h2 className={styles.sectionTitle}>
          Exercícios ({treino.exercicios.length})
        </h2>

        {treino.exercicios.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💪</div>
            <h3>Nenhum exercício adicionado</h3>
            <p>Clique em "Adicionar Exercício" para montar a ficha</p>
          </div>
        ) : (
          <div className={styles.exerciciosGrid}>
            {treino.exercicios.map((te: TreinoExercicio, index: number) => (
              <div key={te.id} className={styles.exercicioCard}>
                <div className={styles.exercicioHeader}>
                  <span className={styles.ordem}>{index + 1}</span>
                  <div className={styles.exercicioInfo}>
                    <h3 className={styles.exercicioNome}>
                      {te.exercicio.nome}
                    </h3>
                    <span className={styles.grupoMuscular}>
                      {getGrupoMuscularLabel(te.exercicio.grupoMuscular)}
                    </span>
                  </div>

                  <div className={styles.actionButtons}>
                    {/* REORDENAR - Só aparece se tiver permissão de editar */}
                    {permissoesEditar && (
                      <div className={styles.reorderButtons}>
                        <button
                          onClick={() => handleReordenar(te.id, "up")}
                          className={styles.reorderButton}
                          title="Mover para cima"
                          disabled={index === 0 || loading}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReordenar(te.id, "down")}
                          className={styles.reorderButton}
                          title="Mover para baixo"
                          disabled={
                            index === treino.exercicios.length - 1 || loading
                          }
                        >
                          ↓
                        </button>
                      </div>
                    )}

                    <div className={styles.editRemoveButtons}>
                      {permissoesEditar && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(te)}
                            className={styles.editButton}
                            title="Editar"
                            disabled={loading}
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                exercicioId: te.id,
                                exercicioNome: te.exercicio.nome,
                                loading: false,
                              })
                            }
                            className={styles.removeButton}
                            title="Remover"
                            disabled={confirmModal.loading || loading}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.exercicioDetails}>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Séries:</span>
                    <span className={styles.detailValue}>{te.series}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Repetições:</span>
                    <span className={styles.detailValue}>{te.repeticoes}</span>
                  </div>
                  {te.carga && (
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Carga:</span>
                      <span className={styles.detailValue}>{te.carga}</span>
                    </div>
                  )}
                  {te.descanso && (
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Descanso:</span>
                      <span className={styles.detailValue}>{te.descanso}</span>
                    </div>
                  )}
                </div>

                {te.observacoes && (
                  <div className={styles.observacoes}>
                    <strong>Obs:</strong> {te.observacoes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CronogramaSection
        treinoId={treino.id}
        cronogramas={treino.cronogramas}
        permissoesEditar={permissoesEditar}
      />

      <ExecucaoSection
        treinoId={treino.id}
        treinoExercicios={treino.exercicios}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            exercicioId: "",
            exercicioNome: "",
            loading: false,
          })
        }
        onConfirm={handleRemoveExercicio}
        title="Remover Exercício"
        message={`Tem certeza que deseja remover "${confirmModal.exercicioNome}" do treino?`}
        confirmText="Sim, remover"
        cancelText="Cancelar"
        type="danger"
        loading={confirmModal.loading}
      />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Modal Adicionar Exercício */}
      {permissoesEditar && (
        <Modal
          isOpen={modalAddExercicio}
          onClose={() => setModalAddExercicio(false)}
          title="Adicionar Exercício"
          size="large"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalGrid}>
              <div className={styles.modalField}>
                <label>Filtrar por grupo</label>
                <select
                  value={filtroGrupo}
                  onChange={(e) => setFiltroGrupo(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Todos os grupos</option>
                  <option value="PEITO">Peito</option>
                  <option value="COSTAS">Costas</option>
                  <option value="OMBROS">Ombros</option>
                  <option value="BICEPS">Bíceps</option>
                  <option value="TRICEPS">Tríceps</option>
                  <option value="PERNAS">Pernas</option>
                  <option value="GLUTEOS">Glúteos</option>
                  <option value="ABDOMEN">Abdômen</option>
                  <option value="PANTURRILHA">Panturrilha</option>
                </select>
              </div>

              <div className={styles.modalField}>
                <label>Exercício *</label>
                <select
                  value={novoExercicio.exercicioId}
                  onChange={(e) =>
                    setNovoExercicio({
                      ...novoExercicio,
                      exercicioId: e.target.value,
                    })
                  }
                  className={styles.select}
                  required
                >
                  <option value="">Selecione...</option>
                  {exerciciosFiltrados.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nome} - {getGrupoMuscularLabel(ex.grupoMuscular)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalField}>
                <label>Séries *</label>
                <input
                  type="number"
                  min="1"
                  value={novoExercicio.series}
                  onChange={(e) =>
                    setNovoExercicio({
                      ...novoExercicio,
                      series: parseInt(e.target.value),
                    })
                  }
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.modalField}>
                <label>Repetições *</label>
                <input
                  type="text"
                  placeholder="Ex: 10-12, 15, até a falha"
                  value={novoExercicio.repeticoes}
                  onChange={(e) =>
                    setNovoExercicio({
                      ...novoExercicio,
                      repeticoes: e.target.value,
                    })
                  }
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.modalField}>
                <label>Carga</label>
                <input
                  type="text"
                  placeholder="Ex: 20kg, peso corporal"
                  value={novoExercicio.carga}
                  onChange={(e) =>
                    setNovoExercicio({
                      ...novoExercicio,
                      carga: e.target.value,
                    })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.modalField}>
                <label>Descanso (segundos)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="Ex: 60, 90, 120"
                  value={novoExercicio.descanso}
                  onChange={(e) =>
                    setNovoExercicio({
                      ...novoExercicio,
                      descanso: parseInt(e.target.value) || 0,
                    })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.modalFieldFull}>
                <label>Observações</label>
                <textarea
                  placeholder="Informações adicionais sobre a execução..."
                  value={novoExercicio.observacoes}
                  onChange={(e) =>
                    setNovoExercicio({
                      ...novoExercicio,
                      observacoes: e.target.value,
                    })
                  }
                  className={styles.textarea}
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="outline"
                onClick={() => setModalAddExercicio(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddExercicio} disabled={loading}>
                {loading ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Editar Exercício */}
      {permissoesEditar && (
        <Modal
          isOpen={modalEditExercicio}
          onClose={() => {
            setModalEditExercicio(false);
            setExercicioEditando(null);
          }}
          title="Editar Exercício"
          size="large"
        >
          {exercicioEditando && (
            <div className={styles.modalContent}>
              <div className={styles.modalGrid}>
                <div className={styles.modalField}>
                  <label>Séries *</label>
                  <input
                    type="number"
                    min="1"
                    value={exercicioEditando.series}
                    onChange={(e) =>
                      setExercicioEditando({
                        ...exercicioEditando,
                        series: parseInt(e.target.value),
                      })
                    }
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.modalField}>
                  <label>Repetições *</label>
                  <input
                    type="text"
                    placeholder="Ex: 10-12, 15, até a falha"
                    value={exercicioEditando.repeticoes}
                    onChange={(e) =>
                      setExercicioEditando({
                        ...exercicioEditando,
                        repeticoes: e.target.value,
                      })
                    }
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.modalField}>
                  <label>Carga</label>
                  <input
                    type="text"
                    placeholder="Ex: 20kg, peso corporal"
                    value={exercicioEditando.carga}
                    onChange={(e) =>
                      setExercicioEditando({
                        ...exercicioEditando,
                        carga: e.target.value,
                      })
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.modalField}>
                  <label>Descanso (segundos)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="Ex: 60, 90, 120"
                    value={exercicioEditando.descanso}
                    onChange={(e) =>
                      setExercicioEditando({
                        ...exercicioEditando,
                        descanso: parseInt(e.target.value) || 0,
                      })
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.modalFieldFull}>
                  <label>Observações</label>
                  <textarea
                    placeholder="Informações adicionais sobre a execução..."
                    value={exercicioEditando.observacoes}
                    onChange={(e) =>
                      setExercicioEditando({
                        ...exercicioEditando,
                        observacoes: e.target.value,
                      })
                    }
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalEditExercicio(false);
                    setExercicioEditando(null);
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleEditExercicio} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
