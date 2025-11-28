"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf"; // Import do PDF
import styles from "./avalicaoAluno.module.scss";
import { FaEnvelope, FaPhone, FaBullseye, FaWhatsapp } from "react-icons/fa"; // FaWhatsapp aqui
import { ClipboardCheck, FileText, Share2 } from "lucide-react"; // FileText e Share2 aqui

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

  // ============================================================
  // 🚀 ORDENAÇÃO ALFABÉTICA
  // ============================================================
  const alunosOrdenados = [...alunos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedTerm(searchTerm);
  };

  // ============================================================
  // 🚀 GERAR PDF (LISTA DE ALUNOS PARA AVALIAÇÃO)
  // ============================================================
  const gerarPdfLista = async () => {
    if (alunosOrdenados.length === 0) return; // Alterado para usar alunosOrdenados

    const nomeCliente = session?.user?.name || "SaaS Academia";
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

    // Logo
    const getLogoBase64 = async () => {
      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const resp = await fetch(`${origin}/imagens/logo.png`, {
          cache: "no-store",
        });
        if (!resp.ok) return "";
        const blob = await resp.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };
    const logoDataUri = await getLogoBase64();

    const printHeader = () => {
      doc.setFillColor(25, 35, 55);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setFillColor(218, 165, 32);
      doc.rect(0, 35, pageWidth, 5, "F");

      if (logoDataUri) {
        try {
          doc.addImage(logoDataUri, "PNG", 10, 7, 18, 18);
        } catch {}
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("ALUNOS - AVALIAÇÃO FÍSICA", pageWidth / 2, 18, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total Listado: ${alunosOrdenados.length}`, pageWidth / 2, 28, {
        align: "center",
      });
    };

    const printTableHeader = () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.text("NOME", margin, y);
      doc.text("EMAIL", 60, y);
      doc.text("TELEFONE", 110, y);
      doc.text("STATUS", 150, y);
      doc.text("MEDIDAS", 175, y); // Coluna extra relevante para avaliação
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;
    };

    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - 10;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Academia / Personal: ${nomeCliente}`, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 50;
        printHeader();
        printTableHeader();
        doc.setTextColor(0, 0, 0);
      }
    };

    printHeader();
    printTableHeader();
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    alunosOrdenados.forEach((aluno) => {
      checkPageBreak(10);
      const nome = doc.splitTextToSize(aluno.nome, 45);
      const email = doc.splitTextToSize(aluno.email || "-", 45);
      const status = aluno.ativo ? "Ativo" : "Inativo";
      const height = Math.max(nome.length * 4, email.length * 4, 6);

      doc.text(nome, margin, y);
      doc.text(email, 60, y);
      doc.text(aluno.telefone || "-", 110, y);

      if (aluno.ativo) doc.setTextColor(0, 128, 0);
      else doc.setTextColor(255, 0, 0);
      doc.text(status, 150, y);
      doc.setTextColor(0, 0, 0);

      doc.text(String(aluno._count.medidas), 175, y);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + height, pageWidth - margin, y + height);
      y += height + 4;
    });

    printFooter();
    doc.save("lista-alunos-avaliacao.pdf");
  };

  // ============================================================
  // 🚀 WHATSAPP (LISTA)
  // ============================================================
  const enviarWhatsAppLista = () => {
    if (alunosOrdenados.length === 0) return; // Alterado para usar alunosOrdenados
    const nomeCliente = session?.user?.name || "SaaS Academia";
    let texto = `📋 *ALUNOS PARA AVALIAÇÃO*\n\n`;

    alunosOrdenados.forEach((a) => {
      texto += `👤 *${a.nome}*\n`;
      if (a.telefone) texto += `📱 ${a.telefone}\n`;
      texto += `📊 Medidas Cadastradas: ${a._count.medidas}\n`;
      texto += `------------------------------\n`;
    });
    texto += `📌 *${nomeCliente}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  // ============================================================

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
    <div className={styles.container}>
      {/* BARRA DE FERRAMENTAS (BUSCA + BOTÕES) */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Buscar aluno para avaliar..."
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

        <div className={styles.actionsGroup}>
          <button
            onClick={gerarPdfLista}
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            disabled={alunosOrdenados.length === 0}
            title="Baixar PDF"
          >
            <FileText className={styles.iconBtn} />
            <span className={styles.hideMobile}>PDF</span>
          </button>

          <button
            onClick={enviarWhatsAppLista}
            className={`${styles.actionBtn} ${styles.btnWhats}`}
            disabled={alunosOrdenados.length === 0}
            title="Enviar WhatsApp"
          >
            <FaWhatsapp className={styles.iconBtn} />
            <span className={styles.hideMobile}>Whats</span>
          </button>
        </div>
      </div>

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
                <div className={styles.infoItem}>
                  <FaEnvelope size={18} className={styles.iconEmail} />
                  <span>{aluno.email || "Sem email"}</span>
                </div>
                <div className={styles.infoItem}>
                  <FaPhone size={18} className={styles.iconPhone} />
                  <span>{aluno.telefone || "Sem telefone"}</span>
                </div>
                <div className={styles.infoItem}>
                  <FaBullseye size={18} className={styles.iconObjetivo} />
                  <span>{aluno.objetivo || "Sem objetivo"}</span>
                </div>

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
                  href={`/dashboard/alunos/${aluno.id}/avaliacoes`}
                  className={`${styles.iconBtn} ${styles.btnAvaliar}`}
                  title="Ver Avaliações"
                  style={{
                    textDecoration: "none",
                    width: "100%",
                    borderRadius: "8px",
                  }}
                >
                  <ClipboardCheck size={20} />
                  <span>Ver Avaliações</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
