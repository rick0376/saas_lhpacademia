"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf"; // Novo
import { FileText, Share2 } from "lucide-react"; // Novos Ícones
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";

interface Treino {
  id: string;
  nome: string;
  objetivo?: string;
  ativo: boolean;
  dataInicio: string;
  aluno: {
    nome: string;
  };
  _count: {
    exercicios: number;
    cronogramas: number;
  };
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

interface TreinoTableProps {
  alunoId?: string;
}

export const TreinoTable: React.FC<TreinoTableProps> = ({ alunoId }) => {
  const { data: session, status } = useSession();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    treino?: Treino;
  }>({ isOpen: false });
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "treinos",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  });
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);

  const fetchPermissoes = async () => {
    try {
      if (session?.user?.role === "SUPERADMIN") {
        setPermissoes({
          recurso: "treinos",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        });
        setPermissoesCarregadas(true);
        return;
      }

      const response = await fetch("/api/permissoes/usuario");
      if (!response.ok) throw new Error("Erro ao buscar permissões");
      const data = await response.json();

      const permissaoTreinos = data.find(
        (p: Permissao) => p.recurso === "treinos"
      );

      if (permissaoTreinos) {
        setPermissoes(permissaoTreinos);
      } else {
        setPermissoes({
          recurso: "treinos",
          criar: false,
          ler: false,
          editar: false,
          deletar: false,
        });
      }
      setPermissoesCarregadas(true);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setPermissoes({
        recurso: "treinos",
        criar: false,
        ler: false,
        editar: false,
        deletar: false,
      });
      setPermissoesCarregadas(true);
    }
  };

  const fetchTreinos = async () => {
    try {
      setLoading(true);
      if (!permissoesCarregadas || !permissoes.ler) return;

      const url = alunoId ? `/api/treinos?alunoId=${alunoId}` : "/api/treinos";
      const response = await fetch(url);

      if (!response.ok) throw new Error("Erro ao buscar treinos");
      const data = await response.json();
      setTreinos(data);
      setError("");
    } catch (err) {
      setError("Erro ao carregar treinos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissoesCarregadas && permissoes.ler) {
      fetchTreinos();
    }
  }, [alunoId, permissoesCarregadas, permissoes.ler]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
    }
  }, [status, session]);

  const handleDelete = async (id: string) => {
    if (!permissoes.deletar) {
      alert("⛔ Você não tem permissão para excluir treinos");
      return;
    }

    try {
      const response = await fetch(`/api/treinos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir treino");
      setTreinos(treinos.filter((t) => t.id !== id));
      setDeleteModal({ isOpen: false });
    } catch (err) {
      alert("Erro ao excluir treino");
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // ============================================================
  // 🚀 ORDENAÇÃO ALFABÉTICA
  // ============================================================
  const treinosOrdenados = [...treinos].sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );

  // ============================================================
  // 🚀 PDF DE LISTA DE TREINOS
  // ============================================================

  // ============================================================
  // 🚀 PDF DE LISTA DE TREINOS (AJUSTADO)
  // ============================================================
  const gerarPdfLista = async () => {
    if (treinosOrdenados.length === 0) return;

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
      doc.text("RELATÓRIO DE FICHAS", pageWidth / 2, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Total de Fichas: ${treinosOrdenados.length}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );
    };

    // --- CABEÇALHO DA TABELA ATUALIZADO ---
    const printTableHeader = () => {
      doc.setFontSize(8); // Diminuí um pouco a fonte para caber mais colunas
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");

      doc.text("NOME DA FICHA", margin, y);
      doc.text("ALUNO", 75, y);
      doc.text("OBJETIVO", 110, y); // Nova Coluna
      doc.text("TOTAL EXER.", 140, y); // Nova Coluna (Qtd)
      doc.text("STATUS", 165, y);
      doc.text("DATA", 185, y);

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;
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

    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 50;
        printHeader();
        printTableHeader();
      }
    };

    printHeader();
    printTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    treinosOrdenados.forEach((t) => {
      checkPageBreak(10);

      // Ajustei tamanhos para caber na linha
      const nome = doc.splitTextToSize(t.nome, 48);
      const aluno = doc.splitTextToSize(t.aluno.nome, 40);
      const objetivo = doc.splitTextToSize(t.objetivo || "-", 40); // Trata objetivo vazio
      const qtdExercicios = String(t._count.exercicios);
      const status = t.ativo ? "Ativo" : "Inativo";
      const data = formatDate(t.dataInicio);

      // Calcula altura baseado na maior quebra de linha das 3 colunas de texto
      const height = Math.max(
        nome.length * 4,
        aluno.length * 4,
        objetivo.length * 4,
        6
      );

      doc.setFontSize(8); // Fonte levemente menor para os dados

      doc.text(nome, margin, y);
      doc.text(aluno, 70, y);
      doc.text(objetivo, 110, y); // Coluna Objetivo
      doc.text(qtdExercicios, 145, y); // Coluna Qtd

      // Status colorido
      if (t.ativo) doc.setTextColor(0, 128, 0);
      else doc.setTextColor(255, 0, 0);
      doc.text(status, 165, y);

      doc.setTextColor(0, 0, 0);
      doc.text(data, 185, y);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + height, pageWidth - margin, y + height);

      y += height + 4;
    });

    printFooter();
    doc.save("relatorio-treinos.pdf");
  };

  // ============================================================
  // 🚀 WHATSAPP DE LISTA DE TREINOS
  // ============================================================
  const enviarWhatsAppLista = () => {
    if (treinosOrdenados.length === 0) return;

    const nomeCliente = session?.user?.name || "SaaS Academia";

    let texto = `📋 *RELATÓRIO DE TREINOS*\n\n`;

    treinosOrdenados.forEach((t) => {
      const status = t.ativo ? "✅ Ativo" : "🛑 Inativo";
      texto += `*${t.nome}*\n`;
      texto += `👤 Aluno: ${t.aluno.nome}\n`;
      texto += `📅 Data: ${formatDate(t.dataInicio)} | ${status}\n`;
      texto += `📊 Ex: ${t._count.exercicios} | Dias: ${t._count.cronogramas}\n`;
      texto += `------------------------------\n`;
    });

    texto += `📌 *${nomeCliente}*`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  // ============================================================

  if (!permissoesCarregadas || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando treinos...</p>
      </div>
    );
  }

  if (!permissoes.ler && session?.user?.role !== "SUPERADMIN") {
    return (
      <div className={styles.error}>
        <p>⛔ Você não tem permissão para visualizar treinos</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (treinos.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📋</div>
        <h3>Nenhum treino cadastrado</h3>
        <p>Comece criando o primeiro treino</p>
      </div>
    );
  }

  return (
    <>
      {/* Botões de Ação no Topo */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={gerarPdfLista}
          className={styles.actionButton}
          style={{
            backgroundColor: "#f59e0b",
            color: "#fff",
            border: "none",
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
          title="Baixar PDF de Fichas"
        >
          <FileText size={18} />
          <span className={styles.hideMobile}>Relatório PDF</span>
        </button>

        <button
          onClick={enviarWhatsAppLista}
          className={styles.actionButton}
          style={{
            backgroundColor: "#25d366",
            color: "#fff",
            border: "none",
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
          title="Enviar Relatório WhatsApp"
        >
          <Share2 size={18} />
          <span className={styles.hideMobile}>Relatório Whats</span>
        </button>
      </div>

      {/* Grid de Cards (Usando a lista ORDENADA) */}
      <div className={styles.grid}>
        {treinosOrdenados.map((treino) => (
          <div key={treino.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{treino.nome}</h3>
              <span
                className={`${styles.statusBadge} ${
                  treino.ativo ? styles.ativo : styles.inativo
                }`}
              >
                {treino.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Aluno:</span>
                <span className={styles.value}>{treino.aluno.nome}</span>
              </div>

              {treino.objetivo && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Objetivo:</span>
                  <span className={styles.value}>{treino.objetivo}</span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.label}>Início:</span>
                <span className={styles.value}>
                  {formatDate(treino.dataInicio)}
                </span>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {treino._count.exercicios}
                  </span>
                  <span className={styles.statLabel}>Exercícios</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {treino._count.cronogramas}
                  </span>
                  <span className={styles.statLabel}>Dias</span>
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link
                href={`/dashboard/treinos/${treino.id}`}
                className={styles.viewButton}
              >
                👁️ Ver Detalhes
              </Link>
              {permissoes.editar && (
                <Link
                  href={`/dashboard/treinos/${treino.id}/editar`}
                  className={styles.editButton}
                >
                  ✏️ Editar
                </Link>
              )}
              {permissoes.deletar && (
                <button
                  onClick={() => setDeleteModal({ isOpen: true, treino })}
                  className={styles.deleteButton}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        title="Confirmar Exclusão"
        size="small"
      >
        <div className={styles.modalContent}>
          <p>
            Tem certeza que deseja excluir o treino{" "}
            <strong>{deleteModal.treino?.nome}</strong>?
          </p>
          <p className={styles.warning}>
            ⚠️ Todos os exercícios e cronogramas serão excluídos!
          </p>

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deleteModal.treino && handleDelete(deleteModal.treino.id)
              }
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
