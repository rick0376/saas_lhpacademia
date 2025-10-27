"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";

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
}

export const AlunoTable = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    aluno?: Aluno;
  }>({ isOpen: false });

  const fetchAlunos = async (search = "") => {
    try {
      setLoading(true);
      const url = search
        ? `/api/alunos?search=${encodeURIComponent(search)}`
        : "/api/alunos";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erro ao buscar alunos");
      }

      const data = await response.json();
      setAlunos(data);
    } catch (err) {
      setError("Erro ao carregar alunos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlunos();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlunos(searchTerm);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/alunos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir aluno");
      }

      setAlunos(alunos.filter((a) => a.id !== id));
      setDeleteModal({ isOpen: false });
    } catch (err) {
      alert("Erro ao excluir aluno");
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
        <p>Carregando alunos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => fetchAlunos()} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Barra de Busca */}
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          🔍 Buscar
        </button>
      </form>

      {alunos.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>👤</div>
          <h3>Nenhum aluno encontrado</h3>
          <p>Comece adicionando o primeiro aluno ao sistema</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Objetivo</th>
                <th>Treinos</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td>
                    <div className={styles.alunoCell}>
                      <div className={styles.avatar}>
                        {aluno.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.alunoNome}>{aluno.nome}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactInfo}>
                      {aluno.email && (
                        <span className={styles.email}>{aluno.email}</span>
                      )}
                      {aluno.telefone && (
                        <span className={styles.telefone}>
                          {aluno.telefone}
                        </span>
                      )}
                      {!aluno.email && !aluno.telefone && (
                        <span className={styles.noContact}>-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={styles.objetivo}>
                      {aluno.objetivo || "-"}
                    </span>
                  </td>
                  <td>
                    <span className={styles.treinosCount}>
                      {aluno._count.treinos}{" "}
                      {aluno._count.treinos === 1 ? "treino" : "treinos"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        aluno.ativo ? styles.ativo : styles.inativo
                      }`}
                    >
                      {aluno.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>{formatDate(aluno.createdAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/dashboard/alunos/${aluno.id}`}
                        className={styles.viewButton}
                        title="Ver Perfil"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                      <Link
                        href={`/dashboard/alunos/${aluno.id}/editar`}
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
                      {/* ✅ Novo: Botão Nova Avaliação */}
                      <Link
                        href={`/dashboard/alunos/${aluno.id}/avaliacoes/nova`}
                        className={styles.evaluateButton}
                        title="Nova Avaliação"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="4 6 18 6 18 18 4 18" />
                          <path d="M4 12h16" />
                          <path d="M12 4v16" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, aluno })}
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
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
