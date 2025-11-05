"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./alunoTable.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";

import { User, Edit, ClipboardCheck, Ruler, Trash2 } from "lucide-react";

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
                      aria-label={`Ver perfil ${aluno.nome}`}
                      className={styles.iconPerfil}
                    >
                      <User className={styles.iconUser} />
                      <span className={styles.iconTextPerfil}>Perfil</span>
                    </Link>

                    <Link
                      href={`/dashboard/alunos/${aluno.id}/editar`}
                      title="Editar"
                      aria-label={`Editar ${aluno.nome}`}
                      className={styles.iconEditar}
                    >
                      <Edit className={styles.iconEdit} />
                      <span className={styles.iconTextEdit}>Editar</span>
                    </Link>

                    <Link
                      href={`/dashboard/alunos/${aluno.id}/avaliacoes/nova`}
                      title="Nova Avaliação"
                      aria-label={`Nova avaliação ${aluno.nome}`}
                      className={styles.iconAvaliar}
                    >
                      <ClipboardCheck className={styles.iconAvaliacao} />
                      <span className={styles.iconTextAvaliar}>Avaliação</span>
                    </Link>

                    <Link
                      href={`/dashboard/medidas?alunoId=${
                        aluno.id
                      }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                      title="Ver Medidas"
                      aria-label={`Ver medidas ${aluno.nome}`}
                      className={styles.iconMedidas}
                    >
                      <Ruler className={styles.iconMed} />
                      <span className={styles.iconTextAvaliar}>Medidas</span>
                    </Link>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, aluno })}
                      title="Excluir"
                      aria-label={`Excluir ${aluno.nome}`}
                      className={styles.iconButtonDelete}
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
                  title="Ver Perfil"
                  aria-label={`Ver perfil ${aluno.nome}`}
                  className={styles.iconPerfil}
                >
                  <User className={styles.iconUser} />
                </Link>

                <Link
                  href={`/dashboard/alunos/${aluno.id}/editar`}
                  title="Editar"
                  aria-label={`Editar ${aluno.nome}`}
                  className={styles.iconEditar}
                >
                  <Edit className={styles.iconEdit} />
                </Link>

                <Link
                  href={`/dashboard/alunos/${aluno.id}/avaliacoes/nova`}
                  title="Nova Avaliação"
                  aria-label={`Nova avaliação ${aluno.nome}`}
                  className={styles.iconAvaliar}
                >
                  <ClipboardCheck className={styles.iconAvaliacao} />
                </Link>

                <Link
                  href={`/dashboard/medidas?alunoId=${
                    aluno.id
                  }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                  title="Ver Medidas"
                  aria-label={`Ver medidas ${aluno.nome}`}
                  className={styles.iconMedidas}
                >
                  <Ruler className={styles.iconMed} />
                </Link>

                <button
                  onClick={() => setDeleteModal({ isOpen: true, aluno })}
                  title="Excluir"
                  aria-label={`Excluir ${aluno.nome}`}
                  className={styles.iconButtonDelete}
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
