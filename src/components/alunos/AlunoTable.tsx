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
      if (!response.ok) throw new Error("Erro ao buscar alunos");
      const data = await response.json();
      setAlunos(data);
      setError("");
    } catch {
      setError("Erro ao carregar alunos");
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
      const response = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir aluno");
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      setDeleteModal({ isOpen: false });
    } catch {
      alert("Erro ao excluir aluno");
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

  if (alunos.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>👥</div>
        <h3>Nenhum aluno cadastrado</h3>
        <p>Comece adicionando o primeiro aluno ao sistema</p>
      </div>
    );
  }

  return (
    <>
      {/* Barra de busca */}
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

      {/* Tabela desktop */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNome}>Nome</th>
              <th className={styles.thContato}>Contato</th>
              <th className={styles.thObjetivo}>Objetivo</th>
              <th className={styles.thTreinos}>Treinos</th>
              <th className={styles.thStatus}>Status</th>
              <th className={styles.thCadastro}>Cadastro</th>
              <th className={styles.thAcoes}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td className={styles.tdNome}>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {aluno.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.userName}>{aluno.nome}</span>
                  </div>
                </td>
                <td className={styles.tdContato}>
                  {aluno.email && (
                    <span className={styles.email}>{aluno.email}</span>
                  )}
                  {aluno.telefone && (
                    <span className={styles.telefone}>{aluno.telefone}</span>
                  )}
                  {!aluno.email && !aluno.telefone && (
                    <span className={styles.noContact}>-</span>
                  )}
                </td>
                <td className={styles.tdObjetivo}>{aluno.objetivo || "-"}</td>
                <td className={styles.tdTreinos}>
                  {aluno._count.treinos}{" "}
                  {aluno._count.treinos === 1 ? "treino" : "treinos"}
                </td>
                <td className={styles.tdStatus}>
                  <span
                    className={`${styles.statusBadge} ${
                      aluno.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className={styles.tdCadastro}>
                  {formatDate(aluno.createdAt)}
                </td>
                <td className={styles.tdAcoes}>
                  <div className={styles.actions}>
                    <Link
                      href={`/dashboard/alunos/${aluno.id}`}
                      title="Ver Perfil"
                      className={styles.iconButton}
                      aria-label={`Ver perfil ${aluno.nome}`}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="#64748b"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="12" cy="7" r="4" />
                        <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
                      </svg>
                    </Link>
                    <Link
                      href={`/dashboard/alunos/${aluno.id}/editar`}
                      title="Editar"
                      className={styles.iconButton}
                      aria-label={`Editar ${aluno.nome}`}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="#2563eb"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/dashboard/alunos/${aluno.id}/avaliacoes/nova`}
                      title="Nova Avaliação"
                      className={styles.iconButton}
                      aria-label={`Nova avaliação ${aluno.nome}`}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="#facc15"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        stroke="#a16207"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </Link>
                    <Link
                      href={`/dashboard/medidas?alunoId=${
                        aluno.id
                      }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                      title="Ver Medidas"
                      className={styles.iconButton}
                      aria-label={`Ver medidas ${aluno.nome}`}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="#22c55e"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        stroke="#166534"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, aluno })}
                      title="Excluir"
                      className={styles.iconButtonDelete}
                      aria-label={`Excluir ${aluno.nome}`}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="#ef4444"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" stroke="#fff" />
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                          stroke="#fff"
                        />
                        <line x1="10" y1="11" x2="10" y2="17" stroke="#fff" />
                        <line x1="14" y1="11" x2="14" y2="17" stroke="#fff" />
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
                  className={styles.iconButton}
                  title="Ver Perfil"
                  aria-label={`Ver perfil ${aluno.nome}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="#64748b"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
                  </svg>
                </Link>
                <Link
                  href={`/dashboard/alunos/${aluno.id}/editar`}
                  className={styles.iconButton}
                  title="Editar"
                  aria-label={`Editar ${aluno.nome}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="#2563eb"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </Link>
                <Link
                  href={`/dashboard/alunos/${aluno.id}/avaliacoes/nova`}
                  className={styles.iconButton}
                  title="Nova Avaliação"
                  aria-label={`Nova avaliação ${aluno.nome}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="#facc15"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#a16207"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </Link>
                <Link
                  href={`/dashboard/medidas?alunoId=${
                    aluno.id
                  }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                  className={styles.iconButton}
                  title="Ver Medidas"
                  aria-label={`Ver medidas ${aluno.nome}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="#22c55e"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#166534"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </Link>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, aluno })}
                  className={styles.iconButtonDelete}
                  title="Excluir"
                  aria-label={`Excluir ${aluno.nome}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="#ef4444"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" stroke="#fff" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
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
