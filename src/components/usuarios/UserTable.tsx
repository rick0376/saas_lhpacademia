"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./usertable.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { Edit, Trash2, Plus } from "lucide-react";
import { FaEnvelope, FaUserShield, FaCalendarAlt } from "react-icons/fa";

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
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "usuarios",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  });
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);

  // Busca permissões do usuário logado para o recurso "usuarios"
  const fetchPermissoes = async () => {
    try {
      // SUPERADMIN tem acesso total
      if (session?.user?.role === "SUPERADMIN") {
        setPermissoes({
          recurso: "usuarios",
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

      const permissaoUsuarios = data.find(
        (p: Permissao) => p.recurso === "usuarios"
      );

      if (permissaoUsuarios) {
        setPermissoes(permissaoUsuarios);
      } else {
        setPermissoes({
          recurso: "usuarios",
          criar: false,
          ler: false,
          editar: false,
          deletar: false,
        });
      }
      setPermissoesCarregadas(true);
    } catch (err) {
      console.error("Erro ao carregar permissões de usuários:", err);
      setPermissoes({
        recurso: "usuarios",
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
      fetchUsuarios(debouncedTerm);
    }
  }, [debouncedTerm, permissoesCarregadas, permissoes.ler]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
    }
  }, [status, session]);

  async function fetchUsuarios(search = "") {
    try {
      setLoading(true);
      const url = search
        ? `/api/usuarios?search=${encodeURIComponent(search)}`
        : "/api/usuarios";
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

  const handleDelete = async (id: string) => {
    if (!permissoes.deletar) {
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

  // Sem permissão de leitura
  if (
    permissoesCarregadas &&
    !permissoes.ler &&
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
    <>
      {/* Botão Novo Usuário controlado por permissão */}
      {permissoes.criar && (
        <div className={styles.topActions}>
          <Link href="/dashboard/usuarios/novo" className={styles.addButton}>
            <Plus size={20} />
            Novo Usuário
          </Link>
        </div>
      )}

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          aria-label="Buscar usuários"
          autoFocus
        />
        <button type="submit" className={styles.searchButton}>
          🔍 Buscar
        </button>
      </form>

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
                <p className={styles.infoItem}>
                  <FaEnvelope size={24} className={styles.iconEmail} />
                  <span>{usuario.email}</span>
                </p>
                <p className={styles.infoItem}>
                  <FaUserShield size={24} className={styles.iconRole} />
                  <span>{getRoleBadge(usuario.role)}</span>
                </p>
                <p className={styles.infoItem}>
                  <FaCalendarAlt size={24} className={styles.iconDate} />
                  <span>Cadastrado em {formatDate(usuario.createdAt)}</span>
                </p>
                {usuario.cliente && (
                  <div className={styles.clienteBadge}>
                    Cliente: {usuario.cliente.nome}
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                {permissoes.editar && (
                  <Link
                    href={`/dashboard/usuarios/${usuario.id}/editar`}
                    title="Editar"
                    className={styles.iconEditar}
                  >
                    <Edit size={24} />
                  </Link>
                )}
                {permissoes.deletar && (
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, usuario })}
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
    </>
  );
};
