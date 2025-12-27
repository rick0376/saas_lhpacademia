"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";
import styles from "./usertable.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { useSearchParams } from "next/navigation";
import {
  Edit,
  Trash2,
  Plus,
  FileText,
  Search,
  Mail,
  Shield,
  Calendar,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  createdAt: string;
  cliente?: {
    nome: string;
  };
}

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

type PermissoesMap = Record<string, Permissao>;

export const UserTable = () => {
  const { data: session, status } = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    usuario?: Usuario;
  }>({ isOpen: false });
  const [deleting, setDeleting] = useState(false);
  const [permissoes, setPermissoes] = useState<PermissoesMap>({});
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);

  const recursosUsuarios = ["usuarios", "usuarios_compartilhar"];

  const searchParams = useSearchParams();
  const clienteIdFromUrl = searchParams.get("clienteId");
  const [clienteId, setClienteId] = useState<string>("");
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>(
    []
  );

  const fetchPermissoes = async () => {
    try {
      if (session?.user?.role === "SUPERADMIN") {
        const full: PermissoesMap = {};
        recursosUsuarios.forEach((r) => {
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

      const response = await fetch("/api/permissoes/usuario");
      if (!response.ok) throw new Error("Erro ao buscar permissões");
      const data: Permissao[] = await response.json();

      const map: PermissoesMap = {};
      recursosUsuarios.forEach((recurso) => {
        const p = data.find((perm) => perm.recurso === recurso);
        map[recurso] =
          p ??
          ({
            recurso,
            criar: false,
            ler: false,
            editar: false,
            deletar: false,
          } as Permissao);
      });

      setPermissoes(map);
      setPermissoesCarregadas(true);
    } catch (err) {
      console.error("Erro ao carregar permissões de usuários:", err);
      setPermissoes({});
      setPermissoesCarregadas(true);
    }
  };

  useEffect(() => {
    if (clienteIdFromUrl) {
      setClienteId(clienteIdFromUrl);
    }
  }, [clienteIdFromUrl]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const permUsuarios = permissoes["usuarios"];
    if (permissoesCarregadas && permUsuarios?.ler) {
      fetchUsuarios(debouncedTerm);
    }
  }, [debouncedTerm, permissoesCarregadas, permissoes, clienteId]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
      if (session.user.role === "SUPERADMIN") {
        fetchClientes();
      }
    }
  }, [status, session]);

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes");
      if (!response.ok) return;
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  async function fetchUsuarios(search = "") {
    try {
      setLoading(true);

      let url = "/api/usuarios";
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (clienteId) params.append("clienteId", clienteId);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar usuários");
      const data = await response.json();
      setUsuarios(data);
      setError("");
    } catch {
      setError("Erro ao carregar usuários");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  const usuariosOrdenados = [...usuarios].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedTerm(searchTerm);
  };

  const permUsuarios = permissoes["usuarios"] ?? {
    recurso: "usuarios",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  };

  const canCompartilharUsuarios = !!permissoes["usuarios_compartilhar"]?.ler;

  const handleDelete = async (id: string) => {
    if (!permUsuarios.deletar) {
      alert("⛔ Você não tem permissão para excluir usuários");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir usuário");
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setDeleteModal({ isOpen: false });
    } catch {
      alert("Erro ao excluir usuário");
    } finally {
      setDeleting(false);
    }
  };

  const getRoleText = (role: string) => {
    const roles = {
      SUPERADMIN: "Super Admin",
      ADMIN: "Admin",
      USER: "Usuário",
    };
    return roles[role as keyof typeof roles] || "Usuário";
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      SUPERADMIN: { text: "Super Admin", class: styles.superadmin },
      ADMIN: { text: "Admin", class: styles.admin },
      USER: { text: "Usuário", class: styles.user },
    };
    const badge = badges[role as keyof typeof badges] || badges.USER;
    return (
      <span className={`${styles.badge} ${badge.class}`}>{badge.text}</span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const gerarPdfUsuarios = async () => {
    if (usuariosOrdenados.length === 0) return;

    const nomeUsuario = session?.user?.name || "Sistema";
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
      doc.text("RELATÓRIO DE USUÁRIOS", pageWidth / 2, 18, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Total de Usuários: ${usuariosOrdenados.length}`,
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
      doc.text("PERFIL", 120, y);
      doc.text("STATUS", 150, y);
      doc.text("CADASTRO", 175, y);

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
        doc.text(nomeUsuario, margin, footerY);
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

    usuariosOrdenados.forEach((usuario) => {
      checkPageBreak(10);

      doc.setFontSize(8);
      const nome = doc.splitTextToSize(usuario.nome, 45);
      const email = doc.splitTextToSize(usuario.email, 55);

      doc.text(nome, margin, y);
      doc.text(email, 60, y);
      doc.text(getRoleText(usuario.role), 120, y);

      if (usuario.ativo) doc.setTextColor(0, 128, 0);
      else doc.setTextColor(255, 0, 0);
      doc.text(usuario.ativo ? "Ativo" : "Inativo", 150, y);
      doc.setTextColor(0, 0, 0);

      doc.text(formatDate(usuario.createdAt), 175, y);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + 5, pageWidth - margin, y + 5);

      y += 10;
    });

    printFooter();
    doc.save("relatorio-usuarios.pdf");
  };

  const enviarWhatsAppUsuarios = () => {
    if (usuariosOrdenados.length === 0) return;

    const nomeUsuario = session?.user?.name || "Sistema";

    let texto = `👥 *RELATÓRIO DE USUÁRIOS*\n\n`;

    usuariosOrdenados.forEach((usuario) => {
      const status = usuario.ativo ? "✅ Ativo" : "🛑 Inativo";
      texto += `*${usuario.nome}*\n`;
      texto += `📧 ${usuario.email}\n`;
      texto += `🔐 Perfil: ${getRoleText(usuario.role)}\n`;
      texto += `Status: ${status}\n`;
      if (usuario.cliente) {
        texto += `🏢 Cliente: ${usuario.cliente.nome}\n`;
      }
      texto += `📅 Cadastro: ${formatDate(usuario.createdAt)}\n`;
      texto += `------------------------------\n`;
    });

    texto += `\n📌 *${nomeUsuario}*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const gerarPdfUsuario = async (usuario: Usuario) => {
    const nomeUsuario = session?.user?.name || "Sistema";
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
    doc.text("FICHA DO USUÁRIO", pageWidth / 2, 18, { align: "center" });

    y = 60;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("DADOS PESSOAIS", margin, y);

    y += 10;
    doc.setFontSize(11);

    doc.setFont("helvetica", "bold");
    doc.text("Nome:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(usuario.nome, margin + 25, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Email:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(usuario.email, margin + 25, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Perfil:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(getRoleText(usuario.role), margin + 25, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Status:", margin, y);
    doc.setFont("helvetica", "normal");
    if (usuario.ativo) doc.setTextColor(0, 128, 0);
    else doc.setTextColor(255, 0, 0);
    doc.text(usuario.ativo ? "Ativo" : "Inativo", margin + 25, y);
    doc.setTextColor(0, 0, 0);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Cadastro:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(usuario.createdAt), margin + 25, y);

    if (usuario.cliente) {
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Cliente:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(usuario.cliente.nome, margin + 25, y);
    }

    const footerY = pageHeight - 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(nomeUsuario, margin, footerY);
    doc.text(
      new Date().toLocaleDateString("pt-BR"),
      pageWidth - margin,
      footerY,
      { align: "right" }
    );

    doc.save(`usuario-${usuario.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const enviarWhatsAppUsuario = (usuario: Usuario) => {
    const nomeUsuario = session?.user?.name || "Sistema";
    const status = usuario.ativo ? "✅ Ativo" : "🛑 Inativo";

    let texto = `👤 *FICHA DO USUÁRIO*\n\n`;
    texto += `*${usuario.nome}*\n`;
    texto += `📧 Email: ${usuario.email}\n`;
    texto += `🔐 Perfil: ${getRoleText(usuario.role)}\n`;
    texto += `Status: ${status}\n`;
    texto += `📅 Cadastro: ${formatDate(usuario.createdAt)}\n`;

    if (usuario.cliente) {
      texto += `🏢 Cliente: ${usuario.cliente.nome}\n`;
    }

    texto += `\n📌 *${nomeUsuario}*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (
    permissoesCarregadas &&
    !permUsuarios.ler &&
    session?.user?.role !== "SUPERADMIN"
  ) {
    return (
      <div className={styles.error}>
        <p>⛔ Você não tem permissão para visualizar usuários</p>
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
      <div className={styles.toolbar}>
        {session?.user?.role === "SUPERADMIN" && (
          <div className={styles.filterGroup}>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todos os clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSearch} className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          <button type="submit" className={styles.searchButton}>
            <Search className={styles.iconBtn} />
            <span>Buscar</span>
          </button>
        </form>

        <div className={styles.actionsGroup}>
          {permUsuarios.criar && (
            <Link
              href="/dashboard/usuarios/novo"
              className={`${styles.actionBtn} ${styles.btnNovo}`}
              title="Novo Aluno"
            >
              <Plus className={styles.iconBtn} />
              <span className={styles.hideMobile}>Novo</span>
            </Link>
          )}

          {canCompartilharUsuarios && (
            <>
              <button
                onClick={gerarPdfUsuarios}
                className={`${styles.actionBtn} ${styles.btnPdf}`}
                disabled={usuariosOrdenados.length === 0}
                title="Baixar PDF"
              >
                <FileText className={styles.iconBtn} />
                <span className={styles.hideMobile}>PDF</span>
              </button>

              <button
                onClick={enviarWhatsAppUsuarios}
                className={`${styles.actionBtn} ${styles.btnWhats}`}
                disabled={usuariosOrdenados.length === 0}
                title="Enviar WhatsApp"
              >
                <FaWhatsapp className={styles.iconBtn} />
                <span className={styles.hideMobile}>Whats</span>
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando usuários...</p>
        </div>
      )}

      {error && !loading && (
        <div className={styles.error}>
          <p>{error}</p>
          <button
            onClick={() => fetchUsuarios()}
            className={styles.retryButton}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && usuarios.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>Nenhum usuário cadastrado</h3>
          <p>Comece adicionando o primeiro usuário ao sistema</p>
        </div>
      )}

      {!loading && !error && usuarios.length > 0 && (
        <div className={styles.cardsContainer}>
          {usuariosOrdenados.map((usuario) => (
            <div key={usuario.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {usuario.nome.charAt(0).toUpperCase()}
                </div>
                <div className={styles.headerInfo}>
                  <h3 className={styles.cardName}>{usuario.nome}</h3>
                  <span
                    className={`${styles.statusBadge} ${
                      usuario.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.infoItem}>
                  <Mail
                    size={16}
                    className={`${styles.iconInfo} ${styles.iconEmail}`}
                  />
                  <span className={styles.label}>Email:</span>
                  <span className={styles.value}>{usuario.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <Shield
                    size={16}
                    className={`${styles.iconInfo} ${styles.iconRole}`}
                  />
                  <span className={styles.label}>Perfil:</span>
                  <span className={styles.value}>
                    {getRoleBadge(usuario.role)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <Calendar
                    size={16}
                    className={`${styles.iconInfo} ${styles.iconDate}`}
                  />
                  <span className={styles.label}>Cadastro:</span>
                  <span className={styles.value}>
                    {formatDate(usuario.createdAt)}
                  </span>
                </div>
                {usuario.cliente && (
                  <div className={styles.clienteBadge}>
                    🏢 {usuario.cliente.nome}
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                {canCompartilharUsuarios && (
                  <>
                    <button
                      onClick={() => gerarPdfUsuario(usuario)}
                      className={styles.actionBtnCard}
                      title="PDF do Usuário"
                    >
                      <FileText size={18} />
                    </button>

                    <button
                      onClick={() => enviarWhatsAppUsuario(usuario)}
                      className={styles.actionBtnCardWhats}
                      title="WhatsApp do Usuário"
                    >
                      <FaWhatsapp size={18} />
                    </button>
                  </>
                )}

                {permUsuarios.editar && (
                  <Link
                    href={`/dashboard/usuarios/${usuario.id}/editar`}
                    title="Editar"
                    className={styles.iconEditar}
                  >
                    <Edit size={18} />
                  </Link>
                )}

                {permUsuarios.deletar && (
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, usuario })}
                    title="Excluir"
                    className={styles.iconButtonDelete}
                  >
                    <Trash2 size={18} />
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
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{deleteModal.usuario?.nome}</strong>?
            </p>
            <p className={styles.warning}>Esta ação não pode ser desfeita.</p>
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
                  deleteModal.usuario && handleDelete(deleteModal.usuario.id)
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
