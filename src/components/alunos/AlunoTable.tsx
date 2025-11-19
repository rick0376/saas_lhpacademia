"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./alunoTable.module.scss";
import { Button } from "../ui/Button/Button";
import { Modal } from "../ui/Modal/Modal";

import { FaEnvelope, FaPhone, FaBullseye } from "react-icons/fa";
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
  clienteId: string;
}

export const AlunoTable = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    aluno?: Aluno;
  }>({ isOpen: false });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchAlunos(debouncedTerm);
  }, [debouncedTerm]);

  async function fetchAlunos(search = "") {
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
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  }
  const alunosOrdenados = [...alunos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedTerm(searchTerm);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir aluno");
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      setDeleteModal({ isOpen: false });
    } catch {
      alert("Erro ao excluir aluno");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          aria-label="Buscar alunos"
          autoFocus
        />
        <button type="submit" className={styles.searchButton}>
          🔍 Buscar
        </button>
      </form>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando alunos...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => fetchAlunos()} className={styles.retryButton}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && alunos.length === 0 && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>Nenhum aluno encontrado</h3>
          <p>Tente outro termo na busca.</p>
        </div>
      )}

      {!loading && alunos.length > 0 && (
        <div className={styles.cardsContainer}>
          {alunosOrdenados.map((aluno) => (
            <div key={aluno.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>
                <div className={styles.headerInfo}>
                  <h3 className={styles.cardName}>{aluno.nome}</h3>
                  <span
                    className={`${styles.statusBadge} ${
                      aluno.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <p className={styles.infoItem}>
                  <FaEnvelope size={24} className={styles.iconEmail} />
                  <span>{aluno.email || "Sem email"}</span>
                </p>
                <p className={styles.infoItem}>
                  <FaPhone size={24} className={styles.iconPhone} />
                  <span>{aluno.telefone || "Sem telefone"}</span>
                </p>
                <p className={styles.infoItem}>
                  <FaBullseye size={24} className={styles.iconObjetivo} />
                  <span>{aluno.objetivo || "Sem objetivo"}</span>
                </p>

                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {aluno._count.treinos}
                    </span>
                    <span className={styles.statLabel}>Treinos</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {aluno._count.medidas}
                    </span>
                    <span className={styles.statLabel}>Medidas</span>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Link
                  href={`/dashboard/alunos/${aluno.id}`}
                  title="Ver Perfil"
                  className={styles.iconPerfil}
                >
                  <User size={24} />
                </Link>
                <Link
                  href={`/dashboard/alunos/${aluno.id}/editar`}
                  title="Editar"
                  className={styles.iconEditar}
                >
                  <Edit size={24} />
                </Link>
                <Link
                  href={`/dashboard/alunos/${aluno.id}/avaliacoes`}
                  title="Ver Avaliações"
                  className={styles.iconAvaliar}
                >
                  <ClipboardCheck size={24} />
                </Link>
                <Link
                  href={`/dashboard/medidas?alunoId=${
                    aluno.id
                  }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                  title="Ver Medidas"
                  className={styles.iconMedidas}
                >
                  <Ruler size={24} />
                </Link>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, aluno })}
                  title="Excluir"
                  className={styles.iconButtonDelete}
                >
                  <Trash2 size={24} />
                </button>
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
