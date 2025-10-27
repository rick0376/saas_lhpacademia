"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";

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

export const ClienteTable = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    cliente?: Cliente;
  }>({ isOpen: false });

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
    fetchClientes();
  }, []);

  const handleDelete = async (id: string) => {
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
        <button onClick={fetchClientes} className={styles.retryButton}>
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
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Status</th>
              <th>Usuários</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>
                  <div className={styles.clienteCell}>
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
                    <div className={styles.clienteInfo}>
                      <span className={styles.clienteNome}>{cliente.nome}</span>
                      <span className={styles.clienteId}>{cliente.id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      cliente.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {cliente.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <span className={styles.usuariosCount}>
                    {cliente._count.usuarios}{" "}
                    {cliente._count.usuarios === 1 ? "usuário" : "usuários"}
                  </span>
                </td>
                <td>{formatDate(cliente.createdAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      href={`/dashboard/clientes/${cliente.id}/editar`}
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
                      onClick={() => setDeleteModal({ isOpen: true, cliente })}
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
    </>
  );
};
