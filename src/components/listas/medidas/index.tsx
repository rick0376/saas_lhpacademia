"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";
import { MedidasList } from "@/components/medidas/MedidasList";
import styles from "./styles.module.scss";
import { FaWhatsapp, FaUser } from "react-icons/fa";
import { FileText, Ruler, Search } from "lucide-react";

interface Aluno {
  id: string;
  nome: string;
  email?: string; // Adicionei campos opcionais para deixar o card mais rico se a API retornar
  telefone?: string;
}

export default function MedidasClient() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const router = useRouter();

  const alunoId = searchParams.get("alunoId");
  const alunoNomeParam = searchParams.get("alunoNome");

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const [debouncedBusca, setDebouncedBusca] = useState("");

  // Carregar Alunos (apenas se não tiver alunoId selecionado)
  useEffect(() => {
    if (!alunoId) {
      setLoading(true);
      fetch("/api/alunos")
        .then((res) => {
          if (!res.ok) throw new Error("Erro ao carregar alunos");
          return res.json();
        })
        .then((data: Aluno[]) => {
          setAlunos(data);
          setError("");
        })
        .catch(() => setError("Erro ao carregar alunos"))
        .finally(() => setLoading(false));
    }
  }, [alunoId]);

  // Debounce da busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusca(busca);
    }, 300);
    return () => clearTimeout(handler);
  }, [busca]);

  // Filtro e Ordenação
  const alunosFiltrados = alunos
    .filter((a) =>
      a.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(
          debouncedBusca
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        )
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // Funções de PDF e WhatsApp (Lista de Alunos para Medidas)
  const gerarPdfLista = async () => {
    if (alunosFiltrados.length === 0) return;
    const doc = new jsPDF();
    const margin = 10;
    let y = 20;

    doc.setFontSize(16);
    doc.text("Lista de Alunos - Medidas", margin, y);
    y += 10;
    doc.setFontSize(12);

    alunosFiltrados.forEach((aluno) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`- ${aluno.nome}`, margin, y);
      y += 7;
    });
    doc.save("lista-alunos-medidas.pdf");
  };

  const enviarWhatsAppLista = () => {
    if (alunosFiltrados.length === 0) return;
    let texto = `📏 *LISTA DE ALUNOS (MEDIDAS)*\n\n`;
    alunosFiltrados.forEach((a) => (texto += `👤 ${a.nome}\n`));
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedBusca(busca);
  };

  // --- MODO 1: LISTA DE MEDIDAS DE UM ALUNO ESPECÍFICO ---
  if (alunoId && alunoNomeParam) {
    return (
      <div className={styles.container}>
        <div className={styles.headerDetail}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Voltar
          </button>
          <h1 className={styles.titleDetail}>
            Medidas de: <span>{decodeURIComponent(alunoNomeParam)}</span>
          </h1>
        </div>
        <MedidasList alunoId={alunoId} alunoNome={alunoNomeParam} />
      </div>
    );
  }

  // --- MODO 2: SELEÇÃO DE ALUNO (GRID DE CARDS) ---
  return (
    <div className={styles.container}>
      {/* Barra de Ferramentas */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          <button type="submit" className={styles.searchButton}>
            <Search size={18} /> Buscar
          </button>
        </form>

        <div className={styles.actionsGroup}>
          <button
            onClick={gerarPdfLista}
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            disabled={alunosFiltrados.length === 0}
            title="Baixar Lista em PDF"
          >
            <FileText className={styles.iconBtn} />{" "}
            <span className={styles.hideMobile}>PDF Lista</span>
          </button>
          <button
            onClick={enviarWhatsAppLista}
            className={`${styles.actionBtn} ${styles.btnWhats}`}
            disabled={alunosFiltrados.length === 0}
            title="Enviar Lista no WhatsApp"
          >
            <FaWhatsapp className={styles.iconBtn} />{" "}
            <span className={styles.hideMobile}>Whats</span>
          </button>
        </div>
      </div>

      {/* Estados de Loading/Erro/Vazio */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando alunos...</p>
        </div>
      )}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
      {!loading && alunosFiltrados.length === 0 && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>Nenhum aluno encontrado</h3>
        </div>
      )}

      {/* Grid de Cards */}
      {!loading && alunosFiltrados.length > 0 && (
        <div className={styles.cardsContainer}>
          {alunosFiltrados.map((aluno) => (
            <div key={aluno.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>
                <div className={styles.headerInfo}>
                  <h3 className={styles.cardName}>{aluno.nome}</h3>
                  <span className={styles.statusBadge}>Ativo</span>{" "}
                  {/* Assumindo ativo se veio da API */}
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.infoItem}>
                  <FaUser size={16} className={styles.iconUser} />
                  <span>Aluno da Academia</span>
                </div>
                {/* Se a API retornar mais dados, adicione aqui como no outro componente */}
              </div>

              <div className={styles.actions}>
                <Link
                  href={`/dashboard/medidas?alunoId=${
                    aluno.id
                  }&alunoNome=${encodeURIComponent(aluno.nome)}`}
                  className={`${styles.actionBtnCard} ${styles.btnMedidas}`}
                >
                  <Ruler size={20} />
                  <span>Ver Medidas</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
