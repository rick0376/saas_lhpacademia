"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";
import { MedidasList } from "@/components/medidas/MedidasList";
import styles from "./styles.module.scss";
//import { FileText, Ruler, Search } from "lucide-react";
import { FileText, Ruler, Search, Weight, TrendingUp } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface Medida {
  id: string;
  peso: number;
  altura: number;
  peito?: number;
  cintura?: number;
  quadril?: number;
  bracoDireito?: number;
  bracoEsquerdo?: number;
  coxaDireita?: number;
  coxaEsquerda?: number;
  panturrilhaDireita?: number;
  panturrilhaEsquerda?: number;
  observacoes?: string;
  fotos?: string[];
  data: string;
}

interface Aluno {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  medidas: Medida[];
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

  // Carregar Alunos com suas medidas
  useEffect(() => {
    if (!alunoId) {
      fetchAlunosComMedidas();
    }
  }, [alunoId]);

  const fetchAlunosComMedidas = async () => {
    setLoading(true);
    try {
      // Primeiro buscar todos os alunos
      const resAlunos = await fetch("/api/alunos");
      if (!resAlunos.ok) throw new Error("Erro ao carregar alunos");
      const dataAlunos: Aluno[] = await resAlunos.json();

      // Para cada aluno, buscar suas medidas
      const alunosComMedidas = await Promise.all(
        dataAlunos.map(async (aluno) => {
          try {
            const resMedidas = await fetch(`/api/alunos/${aluno.id}/medidas`);
            if (!resMedidas.ok) return { ...aluno, medidas: [] };
            const medidas: Medida[] = await resMedidas.json();
            return { ...aluno, medidas };
          } catch {
            return { ...aluno, medidas: [] };
          }
        })
      );

      // Filtrar apenas alunos que têm medidas
      const alunosComMedidasFiltrados = alunosComMedidas.filter(
        (aluno) => aluno.medidas.length > 0
      );

      setAlunos(alunosComMedidasFiltrados);
      setError("");
    } catch {
      setError("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

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

  // Função auxiliar para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Gerar PDF com padrão de cabeçalho e rodapé
  const gerarPdfLista = async () => {
    if (alunosFiltrados.length === 0) return;

    const nomeCliente = session?.user?.name || "SaaS Academia";
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

    // Função para obter logo em Base64
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
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };

    const logoDataUri = await getLogoBase64();

    // Cabeçalho padrão
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
      doc.text("RELATÓRIO DE MEDIDAS", pageWidth / 2, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Total de Alunos com Medidas: ${alunosFiltrados.length}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );
    };

    // Cabeçalho da tabela
    const printTableHeader = () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");

      doc.text("ALUNO", margin, y);
      doc.text("ÚLTIMA MEDIDA", 80, y);
      doc.text("PESO", 130, y);
      doc.text("ALTURA", 155, y);
      doc.text("TOTAL", 180, y);

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;
    };

    // Rodapé padrão
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
        doc.text(nomeCliente, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    // Verificar quebra de página
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

    // Listar alunos e suas medidas
    alunosFiltrados.forEach((aluno) => {
      if (aluno.medidas.length === 0) return;

      // Pegar a medida mais recente
      const medidaMaisRecente = [...aluno.medidas].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      )[0];

      checkPageBreak(10);

      doc.setFontSize(8);
      const nome = doc.splitTextToSize(aluno.nome, 65);
      doc.text(nome, margin, y);
      doc.text(formatarData(medidaMaisRecente.data), 85, y);
      doc.text(`${medidaMaisRecente.peso} kg`, 130, y);
      doc.text(`${medidaMaisRecente.altura} m`, 157, y);
      doc.text(`${aluno.medidas.length}`, 183, y);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + 5, pageWidth - margin, y + 5);

      y += 10;
    });

    printFooter();
    doc.save("relatorio-medidas.pdf");
  };

  // Enviar WhatsApp com informações das medidas
  const enviarWhatsAppLista = () => {
    if (alunosFiltrados.length === 0) return;

    let texto = `📏 *RELATÓRIO DE MEDIDAS*\n\n`;

    alunosFiltrados.forEach((aluno) => {
      if (aluno.medidas.length === 0) return;

      const medidaMaisRecente = [...aluno.medidas].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      )[0];

      texto += `*${aluno.nome}*\n`;
      texto += `📅 Data: ${formatarData(medidaMaisRecente.data)}\n`;
      texto += `⚖️ Peso: ${medidaMaisRecente.peso} kg\n`;
      texto += `📏 Altura: ${medidaMaisRecente.altura} m\n`;
      texto += `📊 Total de Medidas: ${aluno.medidas.length}\n`;
      texto += `------------------------------\n`;
    });

    texto += `\n📌 *${session?.user?.name || "SaaS Academia"}*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedBusca(busca);
  };

  // MODO 1: LISTA DE MEDIDAS DE UM ALUNO ESPECÍFICO
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

  // MODO 2: SELEÇÃO DE ALUNO (GRID DE CARDS)
  return (
    <div className={styles.container}>
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
            title="Baixar Relatório em PDF"
          >
            <FileText className={styles.iconBtn} />
            <span className={styles.hideMobile}>PDF</span>
          </button>
          <button
            onClick={enviarWhatsAppLista}
            className={`${styles.actionBtn} ${styles.btnWhats}`}
            disabled={alunosFiltrados.length === 0}
            title="Enviar Relatório no WhatsApp"
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
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
      {!loading && alunosFiltrados.length === 0 && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>Nenhum aluno com medidas encontrado</h3>
        </div>
      )}

      {!loading && alunosFiltrados.length > 0 && (
        <div className={styles.cardsContainer}>
          {alunosFiltrados.map((aluno) => {
            const medidaMaisRecente = [...aluno.medidas].sort(
              (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
            )[0];

            return (
              <div key={aluno.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.headerInfo}>
                    <h3 className={styles.cardName}>{aluno.nome}</h3>
                    <span className={styles.dataBadge}>
                      {formatarData(medidaMaisRecente.data)}
                    </span>
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <Weight
                      size={16}
                      className={`${styles.iconInfo} ${styles.iconPeso}`}
                    />
                    <span className={styles.label}>Peso:</span>
                    <span className={styles.value}>
                      {medidaMaisRecente.peso} kg
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <Ruler
                      size={16}
                      className={`${styles.iconInfo} ${styles.iconAltura}`}
                    />
                    <span className={styles.label}>Altura:</span>
                    <span className={styles.value}>
                      {medidaMaisRecente.altura} m
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <TrendingUp
                      size={16}
                      className={`${styles.iconInfo} ${styles.iconTotal}`}
                    />
                    <span className={styles.label}>Total de Medidas:</span>
                    <span className={styles.value}>{aluno.medidas.length}</span>
                  </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
