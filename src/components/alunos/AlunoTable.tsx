"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./alunoTable.module.scss";
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
          aria-label="Buscar alunos"
        />
        <button type="submit" className={styles.searchButton}>
          🔍 Buscar
        </button>
      </form>

      {/* Tabela para desktop e telas médias */}
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
                      <span className={styles.telefone}>{aluno.telefone}</span>
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
                      className={`${styles.actionButton} ${styles.perfil}`}
                      title="Ver Perfil"
                    >
                      Perfil
                    </Link>

                    <Link
                      href={`/dashboard/alunos/${aluno.id}/editar`}
                      className={`${styles.actionButton} ${styles.editar}`}
                      title="Editar"
                    >
                      Editar
                    </Link>

                    <Link
                      href={`/dashboard/alunos/${aluno.id}/avaliacoes/nova`}
                      className={`${styles.actionButton} ${styles.avaliacao}`}
                      title="Nova Avaliação"
                    >
                      Avaliação
                    </Link>

                    <Link
                      href={`/dashboard/medidas?alunoId=${
                        aluno.id
                      }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                      className={`${styles.actionButton} ${styles.medidas}`}
                      title="Ver Medidas"
                    >
                      Medidas
                    </Link>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, aluno })}
                      className={styles.deleteButton}
                      title="Excluir"
                      aria-label={`Excluir aluno ${aluno.nome}`}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards para telas pequenas */}
      <div className={styles.cardsContainer}>
        {alunos.map((aluno) => (
          <div key={aluno.id} className={styles.card}>
            <div className={styles.avatar}>
              {aluno.nome.charAt(0).toUpperCase()}
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardName}>{aluno.nome}</h3>
              <p>
                <strong>Email:</strong> {aluno.email || "-"}
              </p>
              <p>
                <strong>Telefone:</strong> {aluno.telefone || "-"}
              </p>
              <p>
                <strong>Objetivo:</strong> {aluno.objetivo || "-"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`${styles.statusBadge} ${
                    aluno.ativo ? styles.ativo : styles.inativo
                  }`}
                >
                  {aluno.ativo ? "Ativo" : "Inativo"}
                </span>
              </p>
              <p>
                <strong>Treinos:</strong> {aluno._count.treinos}
              </p>
              <p>
                <strong>Medidas:</strong> {aluno._count.medidas}
              </p>

              <div className={styles.actions}>
                <Link
                  href={`/dashboard/alunos/${aluno.id}`}
                  className={`${styles.actionButton} ${styles.perfil}`}
                  title="Ver Perfil"
                >
                  Perfil
                </Link>

                <Link
                  href={`/dashboard/alunos/${aluno.id}/editar`}
                  className={`${styles.actionButton} ${styles.editar}`}
                  title="Editar"
                >
                  Editar
                </Link>

                <Link
                  href={`/dashboard/alunos/${aluno.id}/avaliacoes/nova`}
                  className={`${styles.actionButton} ${styles.avaliacao}`}
                  title="Nova Avaliação"
                >
                  Avaliação
                </Link>

                <Link
                  href={`/dashboard/medidas?alunoId=${
                    aluno.id
                  }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                  className={`${styles.actionButton} ${styles.medidas}`}
                  title="Ver Medidas"
                >
                  Medidas
                </Link>

                <button
                  onClick={() => setDeleteModal({ isOpen: true, aluno })}
                  className={styles.deleteButton}
                  title="Excluir"
                  aria-label={`Excluir aluno ${aluno.nome}`}
                >
                  Excluir
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
