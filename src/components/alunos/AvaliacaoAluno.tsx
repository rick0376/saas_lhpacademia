"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./avalicaoAluno.module.scss";
import { FaEnvelope, FaPhone, FaBullseye } from "react-icons/fa";
import { ClipboardCheck } from "lucide-react";

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

interface Permissao {
  recurso: string;
  criar: boolean;
  ler: boolean;
  editar: boolean;
  deletar: boolean;
}

export const AvaliacaoAluno = () => {
  const { data: session, status } = useSession();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [permissoes, setPermissoes] = useState<Permissao>({
    recurso: "avaliacoes",
    criar: false,
    ler: false,
    editar: false,
    deletar: false,
  });
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);

  const fetchPermissoes = async () => {
    try {
      if (session?.user?.role === "SUPERADMIN") {
        setPermissoes({
          recurso: "avaliacoes",
          criar: true,
          ler: true,
          editar: true,
          deletar: true,
        });
        setPermissoesCarregadas(true);
        return;
      }

      const response = await fetch("/api/permissoes/usuario");
      if (!response.ok) throw new Error("Erro ao buscar permissões");
      const data = await response.json();

      const permissaoAvaliacoes = data.find(
        (p: Permissao) => p.recurso === "avaliacoes"
      );
      if (permissaoAvaliacoes) {
        setPermissoes(permissaoAvaliacoes);
      } else {
        setPermissoes({
          recurso: "avaliacoes",
          criar: false,
          ler: false,
          editar: false,
          deletar: false,
        });
      }
      setPermissoesCarregadas(true);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setPermissoes({
        recurso: "avaliacoes",
        criar: false,
        ler: false,
        editar: false,
        deletar: false,
      });
      setPermissoesCarregadas(true);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (permissoesCarregadas && permissoes.ler) {
      fetchAlunos(debouncedTerm);
    }
  }, [debouncedTerm, permissoesCarregadas, permissoes.ler]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchPermissoes();
    }
  }, [status, session]);

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
    setDebouncedTerm(searchTerm);
  };

  if (
    permissoesCarregadas &&
    !permissoes.ler &&
    session?.user?.role !== "SUPERADMIN"
  ) {
    return (
      <div className={styles.error}>
        <p>⛔ Você não tem permissão para visualizar avaliações</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

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

      {error && !loading && (
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
                  <FaBullseye size={20} color="#a06921ff" />{" "}
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
                {permissoes.ler && (
                  <Link
                    href={`/dashboard/alunos/${aluno.id}/avaliacoes`}
                    title={`Ver Avaliações de ${aluno.nome}`}
                    aria-label={`Ver avaliações do(a) ${aluno.nome}`}
                    className={styles.iconAvaliar}
                  >
                    <ClipboardCheck />
                    <span>Avaliações</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
