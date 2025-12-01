"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";
import styles from "./alunoTable.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { FaEnvelope, FaPhone, FaBullseye, FaWhatsapp } from "react-icons/fa";
import {
  User,
  Edit,
  ClipboardCheck,
  Ruler,
  Trash2,
  Plus,
  FileText,
  Share2,
  TrendingUp, // ✅ NOVO ÍCONE IMPORTADO
} from "lucide-react";

interface Aluno {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  objetivo?: string;
  ativo: boolean;
  createdAt: string;
  _count: {
    treinos: number;
    medidas: number;
  };
  clienteId: string;
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

interface AlunoTableProps {
  canCreate: boolean;
}

export const AlunoTable = ({ canCreate }: AlunoTableProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    aluno?: Aluno;
  }>({ isOpen: false });
  const [deleting, setDeleting] = useState(false);
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "alunos",
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
          recurso: "alunos",
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

      const permissaoAlunos = data.find(
        (p: Permissao) => p.recurso === "alunos"
      );
      if (permissaoAlunos) {
        setPermissoes(permissaoAlunos);
      } else {
        setPermissoes({
          recurso: "alunos",
          criar: false,
          ler: false,
          editar: false,
          deletar: false,
        });
      }
      setPermissoesCarregadas(true);
    } catch (error) {
      console.error("❌ Erro ao carregar permissões:", error);
      setPermissoes({
        recurso: "alunos",
        criar: false,
        ler: false,
        editar: false,
        deletar: false,
      });
      setPermissoesCarregadas(true);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (permissoesCarregadas && permissoes.ler) {
      fetchAlunos(debouncedTerm);
    }
  }, [debouncedTerm, permissoesCarregadas, permissoes.ler]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
    }
  }, [status, session]);

  async function fetchAlunos(search = "") {
    try {
      setLoading(true);
      const url = search
        ? `/api/alunos?search=${encodeURIComponent(search)}`
        : "/api/alunos";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar alunos");
      const data = await response.json();
      setAlunos(data);
      setError("");
    } catch {
      setError("Erro ao carregar alunos");
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  }

  const alunosOrdenados = [...alunos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedTerm(searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!permissoes.deletar) {
      alert("⛔ Você não tem permissão para deletar alunos");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir aluno");
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      setDeleteModal({ isOpen: false });
    } catch {
      alert("Erro ao excluir aluno");
    } finally {
      setDeleting(false);
    }
  };

  const gerarPdfAlunos = async () => {
    if (alunosOrdenados.length === 0) return;

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
      doc.text("RELATÓRIO DE ALUNOS", pageWidth / 2, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Total de Alunos: ${alunosOrdenados.length}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );
    };

    const printTableHeader = () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");

      doc.text("NOME", margin, y);
      doc.text("EMAIL", 60, y);
      doc.text("TELEFONE", 110, y);
      doc.text("OBJETIVO", 140, y);
      doc.text("STATUS", 175, y);

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
        doc.setTextColor(0, 0, 0);
      }
    };

    printHeader();
    printTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    alunosOrdenados.forEach((a) => {
      checkPageBreak(10);

      const nome = doc.splitTextToSize(a.nome, 45);
      const email = doc.splitTextToSize(a.email || "-", 45);
      const telefone = a.telefone || "-";
      const objetivo = doc.splitTextToSize(a.objetivo || "-", 30);
      const status = a.ativo ? "Ativo" : "Inativo";

      const height = Math.max(
        nome.length * 4,
        email.length * 4,
        objetivo.length * 4,
        6
      );

      doc.setFontSize(8);

      doc.text(nome, margin, y);
      doc.text(email, 60, y);
      doc.text(telefone, 110, y);
      doc.text(objetivo, 140, y);

      if (a.ativo) doc.setTextColor(0, 128, 0);
      else doc.setTextColor(255, 0, 0);
      doc.text(status, 175, y);

      doc.setTextColor(0, 0, 0);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + height, pageWidth - margin, y + height);

      y += height + 4;
    });

    printFooter();
    doc.save("relatorio-alunos.pdf");
  };

  const enviarWhatsAppAlunos = () => {
    if (alunosOrdenados.length === 0) return;

    const nomeCliente = session?.user?.name || "SaaS Academia";

    let texto = `👥 *RELATÓRIO DE ALUNOS*\n\n`;

    alunosOrdenados.forEach((a) => {
      const status = a.ativo ? "✅ Ativo" : "🛑 Inativo";
      texto += `*${a.nome}*\n`;
      if (a.email) texto += `📧 ${a.email}\n`;
      if (a.telefone) texto += `📱 ${a.telefone}\n`;
      if (a.objetivo) texto += `🎯 ${a.objetivo}\n`;
      texto += `📊 Treinos: ${a._count.treinos} | Medidas: ${a._count.medidas}\n`;
      texto += `Status: ${status}\n`;
      texto += `------------------------------\n`;
    });

    texto += `📌 *${nomeCliente}*`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  if (
    permissoesCarregadas &&
    !permissoes.ler &&
    session?.user?.role !== "SUPERADMIN"
  ) {
    return (
      <div className={styles.error}>
        <p>⛔ Você não tem permissão para visualizar alunos</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* --- NOVA BARRA DE AÇÕES (Alinhada via CSS) --- */}
      <div className={styles.toolbar}>
        {/* Lado Esquerdo: Busca */}
        <form onSubmit={handleSearch} className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          <button type="submit" className={styles.searchButton}>
            🔍 Buscar
          </button>
        </form>

        {/* Lado Direito: Ações */}
        <div className={styles.actionsGroup}>
          {canCreate && (
            <Link
              href="/dashboard/alunos/novo"
              className={`${styles.actionBtn} ${styles.btnNovo}`}
              title="Novo Aluno"
            >
              <Plus className={styles.iconBtn} />
              <span className={styles.hideMobile}>Novo</span>
            </Link>
          )}

          <button
            onClick={gerarPdfAlunos}
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            disabled={alunosOrdenados.length === 0}
            title="Baixar PDF"
          >
            <FileText className={styles.iconBtn} />
            <span className={styles.hideMobile}>PDF</span>
          </button>

          <button
            onClick={enviarWhatsAppAlunos}
            className={`${styles.actionBtn} ${styles.btnWhats}`}
            disabled={alunosOrdenados.length === 0}
            title="Enviar WhatsApp"
          >
            <FaWhatsapp className={styles.iconBtn} />
            <span className={styles.hideMobile}>Whats</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando alunos...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => fetchAlunos()} className={styles.retryButton}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && alunos.length === 0 && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>Nenhum aluno encontrado</h3>
          <p>Tente outro termo na busca.</p>
        </div>
      )}

      {!loading && alunos.length > 0 && (
        <div className={styles.cardsContainer}>
          {alunosOrdenados.map((aluno) => (
            <div key={aluno.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>
                <div className={styles.headerInfo}>
                  <h3 className={styles.cardName}>{aluno.nome}</h3>
                  <span
                    className={`${styles.statusBadge} ${
                      aluno.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <p className={styles.infoItem}>
                  <FaEnvelope size={24} className={styles.iconEmail} />
                  <span>{aluno.email || "Sem email"}</span>
                </p>
                <p className={styles.infoItem}>
                  <FaPhone size={24} className={styles.iconPhone} />
                  <span>{aluno.telefone || "Sem telefone"}</span>
                </p>
                <p className={styles.infoItem}>
                  <FaBullseye size={24} className={styles.iconObjetivo} />
                  <span>{aluno.objetivo || "Sem objetivo"}</span>
                </p>

                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {aluno._count.treinos}
                    </span>
                    <span className={styles.statLabel}>Treinos</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {aluno._count.medidas}
                    </span>
                    <span className={styles.statLabel}>Medidas</span>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Link
                  href={`/dashboard/alunos/${aluno.id}`}
                  title="Ver Perfil"
                  className={styles.iconPerfil}
                >
                  <User size={24} />
                </Link>

                <Link
                  href={`/dashboard/alunos/${aluno.id}/evolucao`}
                  title="Ver Evolução"
                  className={styles.iconEvolucao}
                >
                  <TrendingUp size={24} />
                </Link>

                {permissoes.editar && (
                  <Link
                    href={`/dashboard/alunos/${aluno.id}/editar`}
                    title="Editar"
                    className={styles.iconEditar}
                  >
                    <Edit size={24} />
                  </Link>
                )}
                <Link
                  href={`/dashboard/alunos/${aluno.id}/avaliacoes`}
                  title="Ver Avaliações"
                  className={styles.iconAvaliar}
                >
                  <ClipboardCheck size={24} />
                </Link>
                <Link
                  href={`/dashboard/medidas?alunoId=${
                    aluno.id
                  }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                  title="Ver Medidas"
                  className={styles.iconMedidas}
                >
                  <Ruler size={24} />
                </Link>
                {permissoes.deletar && (
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, aluno })}
                    title="Excluir"
                    className={styles.iconButtonDelete}
                  >
                    <Trash2 size={24} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteModal.isOpen && (
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false })}
          title="Confirmar Exclusão"
          size="small"
        >
          <div className={styles.modalContent}>
            <p>
              Tem certeza que deseja excluir o aluno{" "}
              <strong>{deleteModal.aluno?.nome}</strong>?
            </p>
            <p className={styles.warning}>
              ⚠️ Todos os treinos e medidas deste aluno também serão excluídos!
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
                  deleteModal.aluno && handleDelete(deleteModal.aluno.id)
                }
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
