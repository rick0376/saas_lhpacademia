"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./usertable.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";

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

export const UserTable = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    usuario?: Usuario;
  }>({ isOpen: false });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/usuarios");
      if (!response.ok) throw new Error("Erro ao buscar usuários");
      const data = await response.json();
      setUsuarios(data);
      setError("");
    } catch (err) {
      setError("Erro ao carregar usuários");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir usuário");
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setDeleteModal({ isOpen: false });
    } catch (err) {
      alert("Erro ao excluir usuário");
      console.error(err);
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

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={fetchUsuarios} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>👥</div>
        <h3>Nenhum usuário cadastrado</h3>
        <p>Comece adicionando o primeiro usuário ao sistema</p>
      </div>
    );
  }

  return (
    <>
      {/* Tabela desktop */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr className={styles.tableHeadRow}>
              <th className={styles.tableHeadCell}>Nome</th>
              <th className={styles.tableHeadCell}>Email</th>
              <th className={styles.tableHeadCell}>Perfil</th>
              <th className={styles.tableHeadCell}>Status</th>
              <th className={styles.tableHeadCell}>Cadastro</th>
              <th className={styles.tableHeadCell}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className={styles.tableBodyRow}>
                <td className={styles.tableBodyCell}>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.userName}>{usuario.nome}</span>
                  </div>
                </td>
                <td className={styles.tableBodyCell}>{usuario.email}</td>
                <td
                  className={`${styles.tableBodyCell} ${styles.tableBodyCellPerfil}`}
                >
                  {getRoleBadge(usuario.role)}
                </td>
                <td className={styles.tableBodyCell}>
                  <span
                    className={`${styles.statusBadge} ${
                      usuario.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className={styles.tableBodyCell}>
                  {formatDate(usuario.createdAt)}
                </td>
                <td className={styles.tableBodyCell}>
                  <div className={styles.actions}>
                    <Link
                      href={`/dashboard/usuarios/${usuario.id}/editar`}
                      className={styles.editButton}
                      title="Editar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                        className={styles.actionIcon}
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, usuario })}
                      className={styles.deleteButton}
                      title="Excluir"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                        className={styles.actionIcon}
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className={styles.cardsContainer}>
        {usuarios.map((usuario) => (
          <div key={usuario.id} className={styles.usuarioCard}>
            <div className={styles.usuarioIcon}>
              {usuario.nome.charAt(0).toUpperCase()}
            </div>
            <div className={styles.usuarioInfo}>
              <strong>{usuario.nome}</strong>
              <span>{usuario.email}</span>
              {getRoleBadge(usuario.role)}
              <span
                className={`${styles.statusBadge} ${
                  usuario.ativo ? styles.ativo : styles.inativo
                }`}
              >
                {usuario.ativo ? "Ativo" : "Inativo"}
              </span>
              <span>Cadastro: {formatDate(usuario.createdAt)}</span>
              <div className={styles.actions}>
                <Link
                  href={`/dashboard/usuarios/${usuario.id}/editar`}
                  title="Editar"
                  className={styles.editButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                    className={styles.actionIcon}
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </Link>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, usuario })}
                  title="Excluir"
                  className={styles.deleteButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                    className={styles.actionIcon}
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
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
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
