"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./usertable.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";
import { Edit, Trash2 } from "lucide-react";

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
    } catch {
      setError("Erro ao carregar usuários");
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
    } catch {
      alert("Erro ao excluir usuário");
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
              <th className={styles.thNome}>Nome</th>
              <th className={styles.thEmail}>Email</th>
              <th className={styles.thPerfil}>Perfil</th>
              <th className={styles.thStatus}>Status</th>
              <th className={styles.thCadastro}>Cadastro</th>
              <th className={styles.thAcoes}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className={styles.tableBodyRow}>
                <td className={styles.tdNome}>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.userName}>{usuario.nome}</span>
                  </div>
                </td>
                <td className={styles.tdEmail}>{usuario.email}</td>
                <td className={styles.tdPerfil}>
                  {getRoleBadge(usuario.role)}
                </td>
                <td className={styles.tdStatus}>
                  <span
                    className={`${styles.statusBadge} ${
                      usuario.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className={styles.tdCadastro}>
                  {formatDate(usuario.createdAt)}
                </td>
                <td className={styles.tdAcoes}>
                  <div className={styles.actions}>
                    <Link
                      href={`/dashboard/usuarios/${usuario.id}/editar`}
                      title="Editar"
                      className={styles.iconEditar}
                    >
                      <Edit className={styles.iconEdit} />
                    </Link>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, usuario })}
                      className={styles.iconButtonDelete}
                      title="Excluir"
                    >
                      <Trash2 className={styles.iconDelete} />
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
                  className={styles.iconEditar}
                >
                  <Edit className={styles.iconEdit} />
                </Link>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, usuario })}
                  className={styles.iconButtonDelete}
                  title="Excluir"
                >
                  <Trash2 className={styles.iconDelete} />
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
