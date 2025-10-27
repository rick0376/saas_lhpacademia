"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
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

      if (!response.ok) {
        throw new Error("Erro ao buscar usuários");
      }

      const data = await response.json();
      setUsuarios(data);
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
      const response = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir usuário");
      }

      setUsuarios(usuarios.filter((u) => u.id !== id));
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
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.userName}>{usuario.nome}</span>
                  </div>
                </td>
                <td>{usuario.email}</td>
                <td>{getRoleBadge(usuario.role)}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      usuario.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>{formatDate(usuario.createdAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      href={`/dashboard/usuarios/${usuario.id}/editar`}
                      className={styles.editButton}
                      title="Editar"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, usuario })}
                      className={styles.deleteButton}
                      title="Excluir"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
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
