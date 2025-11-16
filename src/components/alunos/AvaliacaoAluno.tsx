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

export const AvaliacaoAluno = () => {
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

  // Debounce para busca após digitar
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Busca via debounce
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedTerm(searchTerm); // Garante execução imediata ao clicar no botão buscar
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
    <>
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
          {alunos.map((aluno) => (
            <div key={aluno.id} className={styles.card}>
              <div className={styles.avatar}>
                {aluno.nome.charAt(0).toUpperCase()}
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardName}>{aluno.nome}</h3>
                <p className={styles.emailField}>
                  <FaEnvelope size={20} color="#0f4aca" /> {aluno.email || "-"}
                </p>
                <p className={styles.telefoneField}>
                  <FaPhone size={20} color="#166d1b" /> {aluno.telefone || "-"}
                </p>
                <p className={styles.objetivoField}>
                  <FaBullseye size={20} color="#5a21a0" />{" "}
                  {aluno.objetivo || "-"}
                </p>
                <p className={styles.statusField}>
                  <strong>Status: </strong>
                  <span
                    className={`${styles.statusBadge} ${
                      aluno.ativo ? styles.ativo : styles.inativo
                    }`}
                  >
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </span>
                </p>
                <p className={styles.treinosField}>
                  <strong>Treinos: </strong>
                  {aluno._count.treinos}
                </p>
                <p className={styles.medidasField}>
                  <strong>Medidas: </strong>
                  {aluno._count.medidas}
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
                    href={`/dashboard/alunos/${aluno.id}/avaliacoes`}
                    title={`Ver Avaliações de ${aluno.nome}`}
                    aria-label={`Ver avaliações do(a) ${aluno.nome}`}
                    className={styles.iconAvaliar}
                  >
                    <ClipboardCheck />
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
              >
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
