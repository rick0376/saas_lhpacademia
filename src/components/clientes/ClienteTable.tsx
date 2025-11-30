"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { Edit, Trash2, Plus, FileText, Users, Calendar } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface Cliente {
  id: string;
  nome: string;
  logo?: string;
  ativo: boolean;
  createdAt: string;
  _count: {
    usuarios: number;
  };
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

export const ClienteTable = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    cliente?: Cliente;
  }>({ isOpen: false });
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "clientes",
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
          recurso: "clientes",
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

      const permissaoCliente = data.find(
        (p: Permissao) => p.recurso === "clientes"
      );
      if (permissaoCliente) {
        setPermissoes(permissaoCliente);
      } else {
        setPermissoes({
          recurso: "clientes",
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
        recurso: "clientes",
        criar: false,
        ler: false,
        editar: false,
        deletar: false,
      });
      setPermissoesCarregadas(true);
    }
  };

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clientes");

      if (!response.ok) {
        throw new Error("Erro ao buscar clientes");
      }

      const data = await response.json();
      setClientes(data);
    } catch (err) {
      setError("Erro ao carregar clientes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated" && permissoesCarregadas) {
      if (!permissoes.ler && session?.user?.role !== "SUPERADMIN") {
        setError("⛔ Você não tem permissão para visualizar clientes");
        setLoading(false);
      } else {
        fetchClientes();
      }
    }
  }, [status, permissoesCarregadas, permissoes.ler, session?.user?.role]);

  const handleDelete = async (id: string) => {
    if (!permissoes.deletar) {
      alert("⛔ Você não tem permissão para deletar clientes");
      return;
    }

    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir cliente");
      }

      setClientes(clientes.filter((c) => c.id !== id));
      setDeleteModal({ isOpen: false });
    } catch (err) {
      alert(
        "Erro ao excluir cliente. Verifique se não há usuários vinculados."
      );
      console.error(err);
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

  // ✅ Gerar PDF dos Clientes
  const gerarPdfClientes = async () => {
    if (clientes.length === 0) return;

    const nomeUsuario = session?.user?.name || "Sistema";
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

    // Função para obter logo
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

    // Cabeçalho
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
      doc.text("RELATÓRIO DE CLIENTES", pageWidth / 2, 18, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total de Clientes: ${clientes.length}`, pageWidth / 2, 28, {
        align: "center",
      });
    };

    // Cabeçalho da tabela
    const printTableHeader = () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");

      doc.text("CLIENTE", margin, y);
      doc.text("STATUS", 90, y);
      doc.text("USUÁRIOS", 130, y);
      doc.text("CADASTRO", 165, y);

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;
    };

    // Rodapé
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
        doc.text(nomeUsuario, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    // Verificar quebra de página
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

    clientes.forEach((cliente) => {
      checkPageBreak(10);

      doc.setFontSize(8);
      const nome = doc.splitTextToSize(cliente.nome, 75);
      doc.text(nome, margin, y);

      // Status
      if (cliente.ativo) doc.setTextColor(0, 128, 0);
      else doc.setTextColor(255, 0, 0);
      doc.text(cliente.ativo ? "Ativo" : "Inativo", 90, y);
      doc.setTextColor(0, 0, 0);

      // Usuários
      doc.text(`${cliente._count.usuarios}`, 140, y);

      // Data
      doc.text(formatDate(cliente.createdAt), 165, y);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + 5, pageWidth - margin, y + 5);

      y += 10;
    });

    printFooter();
    doc.save("relatorio-clientes.pdf");
  };

  // ✅ Enviar WhatsApp
  const enviarWhatsAppClientes = () => {
    if (clientes.length === 0) return;

    const nomeUsuario = session?.user?.name || "Sistema";

    let texto = `🏢 *RELATÓRIO DE CLIENTES*\n\n`;

    clientes.forEach((cliente) => {
      const status = cliente.ativo ? "✅ Ativo" : "🛑 Inativo";
      texto += `*${cliente.nome}*\n`;
      texto += `Status: ${status}\n`;
      texto += `👥 Usuários: ${cliente._count.usuarios}\n`;
      texto += `📅 Cadastro: ${formatDate(cliente.createdAt)}\n`;
      texto += `------------------------------\n`;
    });

    texto += `\n📌 *${nomeUsuario}*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🏢</div>
        <h3>Nenhum cliente cadastrado</h3>
        <p>Comece adicionando o primeiro cliente ao sistema</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ✅ Toolbar com botões */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h2 className={styles.toolbarTitle}>Clientes</h2>
          <span className={styles.toolbarCount}>{clientes.length} total</span>
        </div>

        <div className={styles.actionsGroup}>
          {permissoes.criar && (
            <Link href="/dashboard/clientes/novo" className={styles.addButton}>
              <Plus size={18} />
              <span className={styles.hideMobile}>Novo</span>
            </Link>
          )}

          <button
            onClick={gerarPdfClientes}
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            title="Baixar PDF"
          >
            <FileText className={styles.iconBtn} />
            <span className={styles.hideMobile}>PDF</span>
          </button>

          <button
            onClick={enviarWhatsAppClientes}
            className={`${styles.actionBtn} ${styles.btnWhats}`}
            title="Enviar WhatsApp"
          >
            <FaWhatsapp className={styles.iconBtn} />
            <span className={styles.hideMobile}>Whats</span>
          </button>
        </div>
      </div>

      {/* ✅ Cards Container */}
      <div className={styles.cardsContainer}>
        {clientes.map((cliente) => (
          <div key={cliente.id} className={styles.card}>
            <div className={styles.cardHeader}>
              {cliente.logo ? (
                <img
                  src={cliente.logo}
                  alt={cliente.nome}
                  className={styles.logo}
                />
              ) : (
                <div className={styles.logoPlaceholder}>
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.headerInfo}>
                <h3 className={styles.cardName}>{cliente.nome}</h3>
                <span
                  className={`${styles.statusBadge} ${
                    cliente.ativo ? styles.ativo : styles.inativo
                  }`}
                >
                  {cliente.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.infoItem}>
                <Users
                  size={16}
                  className={`${styles.iconInfo} ${styles.iconUsuarios}`}
                />
                <span className={styles.label}>Usuários:</span>
                <span className={styles.value}>{cliente._count.usuarios}</span>
              </div>
              <div className={styles.infoItem}>
                <Calendar
                  size={16}
                  className={`${styles.iconInfo} ${styles.iconCadastro}`}
                />
                <span className={styles.label}>Cadastro:</span>
                <span className={styles.value}>
                  {formatDate(cliente.createdAt)}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                onClick={() =>
                  router.push(`/dashboard/alunos/novo?clienteId=${cliente.id}`)
                }
                className={styles.manageButton}
                title="Criar Aluno"
              >
                <Users size={18} />
              </button>

              {permissoes.editar && (
                <Link
                  href={`/dashboard/clientes/${cliente.id}/editar`}
                  className={styles.editButton}
                  title="Editar"
                >
                  <Edit size={18} />
                </Link>
              )}

              {permissoes.deletar && (
                <button
                  onClick={() => setDeleteModal({ isOpen: true, cliente })}
                  className={styles.deleteButton}
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        title="Confirmar Exclusão"
        size="small"
      >
        <div className={styles.modalContent}>
          <p>
            Tem certeza que deseja excluir o cliente{" "}
            <strong>{deleteModal.cliente?.nome}</strong>?
          </p>
          <p className={styles.warning}>
            ⚠️ Todos os usuários vinculados a este cliente também serão
            excluídos!
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
                deleteModal.cliente && handleDelete(deleteModal.cliente.id)
              }
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
