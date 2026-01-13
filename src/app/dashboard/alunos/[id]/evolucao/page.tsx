//dashboard/alunos/[id]/evolucao/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { FaWhatsapp } from "react-icons/fa";
import {
  ArrowLeft,
  LayoutList,
  Activity,
  Filter,
  CalendarCheck,
  Trophy,
  FileText,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import styles from "./styles.module.scss";

// --- Interfaces ---
interface ExercicioHistorico {
  id: string;
  exercicioNome: string;
  carga: string | null;
  series: number;
  repeticoes: string;
}

interface HistoricoTreino {
  id: string;
  data: string;
  intensidade: string;
  completo: boolean;
  totalExerciciosRealizados: number;
  treinoNome?: string;
  exercicios: ExercicioHistorico[];
}

interface TreinoDefinido {
  id: string;
  nome: string;
  exercicios: { exercicio: { nome: string } }[];
}

interface AlunoInfo {
  nome: string;
  objetivo: string;
}

export default function EvolucaoAlunoPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<HistoricoTreino[]>([]);
  const [treinosDefinidos, setTreinosDefinidos] = useState<TreinoDefinido[]>(
    []
  );
  const [aluno, setAluno] = useState<AlunoInfo | null>(null);

  // Filtros
  const [periodo, setPeriodo] = useState("90");
  const [treinoFiltro, setTreinoFiltro] = useState("geral");

  const [canView, setCanView] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchDados();
  }, [session, status, id]);

  useEffect(() => {
    const verificarPermissoes = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`/api/permissoes?usuarioId=${session.user.id}`);
        if (!res.ok) return;
        const permissoes = await res.json();

        // 🔹 Permissão de visualizar evolução
        const permVer = permissoes.find(
          (p: any) => p.recurso === "alunos_evolucao"
        );

        // 🔹 Permissão de compartilhar (PDF/WhatsApp)
        const permShare = permissoes.find(
          (p: any) => p.recurso === "alunos_compartilhar"
        );

        const isSuper = session.user.role === "SUPERADMIN";

        setCanView(isSuper || !!permVer?.ler || !!permVer?.editar);
        setCanShare(isSuper || !!permShare?.ler || !!permShare?.editar);
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
      }
    };

    verificarPermissoes();
  }, [session]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const resAluno = await fetch(`/api/alunos/${id}`);
      if (resAluno.ok) setAluno(await resAluno.json());

      const resHistorico = await fetch(`/api/alunos/${id}/historico`);
      if (resHistorico.ok) setHistorico(await resHistorico.json());

      const resTreinos = await fetch(`/api/alunos/${id}/treinos`);
      if (resTreinos.ok) setTreinosDefinidos(await resTreinos.json());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- PROCESSAMENTO ---

  const historicoFiltradoData = useMemo(() => {
    if (periodo === "todos") return [...historico].reverse();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
    return historico.filter((h) => new Date(h.data) >= dataLimite).reverse();
  }, [historico, periodo]);

  const exerciciosDoTreinoSelecionado = useMemo(() => {
    if (treinoFiltro === "geral") return [];
    const treino = treinosDefinidos.find((t) => t.id === treinoFiltro);
    return treino ? treino.exercicios.map((e) => e.exercicio.nome) : [];
  }, [treinoFiltro, treinosDefinidos]);

  const recordeKPI = useMemo(() => {
    let maxCarga = 0;
    let nomeExercicio = "Nenhum registro";
    const nomesExerciciosPermitidos =
      treinoFiltro === "geral" ? null : exerciciosDoTreinoSelecionado;

    historicoFiltradoData.forEach((h) => {
      h.exercicios.forEach((ex) => {
        if (
          nomesExerciciosPermitidos &&
          !nomesExerciciosPermitidos.includes(ex.exercicioNome)
        ) {
          return;
        }
        const carga = parseFloat(ex.carga?.replace(/[^0-9.]/g, "") || "0");
        if (carga > maxCarga) {
          maxCarga = carga;
          nomeExercicio = ex.exercicioNome;
        }
      });
    });
    return { carga: maxCarga, exercicio: maxCarga > 0 ? nomeExercicio : "---" };
  }, [historicoFiltradoData, treinoFiltro, exerciciosDoTreinoSelecionado]);

  const consistencia = useMemo(() => {
    if (historico.length === 0) return "Nenhuma";
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    const treinosUltimos30Dias = historico.filter(
      (h) => new Date(h.data) >= trintaDiasAtras
    ).length;
    const mediaSemanal = treinosUltimos30Dias / 4;
    if (mediaSemanal >= 3) return "🔥 Alta";
    if (mediaSemanal >= 1.5) return "✅ Média";
    return "⚠️ Baixa";
  }, [historico]);

  const dadosGerais = useMemo(() => {
    return historicoFiltradoData.map((h) => {
      let volume = 0;
      h.exercicios.forEach((ex) => {
        const carga = parseFloat(ex.carga?.replace(/[^0-9.]/g, "") || "0");
        if (carga > 0) volume += ex.series * 10 * carga;
      });
      return {
        data: new Date(h.data).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        volume: Math.round(volume),
      };
    });
  }, [historicoFiltradoData]);

  const dadosPorExercicioDoTreino = useMemo(() => {
    if (treinoFiltro === "geral") return null;
    const resultado: Record<string, any[]> = {};
    exerciciosDoTreinoSelecionado.forEach((nomeEx) => {
      const dadosEx = historicoFiltradoData
        .map((h) => {
          const execucaoEx = h.exercicios.find(
            (ex) => ex.exercicioNome === nomeEx
          );
          if (!execucaoEx) return null;
          const carga = parseFloat(
            execucaoEx.carga?.replace(/[^0-9.]/g, "") || "0"
          );
          return {
            data: new Date(h.data).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            }),
            carga: carga,
          };
        })
        .filter((item) => item !== null && item.carga > 0);
      if (dadosEx.length > 0) resultado[nomeEx] = dadosEx;
    });
    return resultado;
  }, [treinoFiltro, exerciciosDoTreinoSelecionado, historicoFiltradoData]);

  // --- FUNÇÕES PDF E WHATSAPP ---

  // --- FUNÇÕES PDF E WHATSAPP (AGORA DINÂMICAS) ---

  const gerarPdfEvolucao = async () => {
    if (!aluno) return;

    const nomeUsuario = session?.user?.name || "Sistema";
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const footerMargin = 15; // Espaço reservado para rodapé
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
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };
    const logoDataUri = await getLogoBase64();

    // Função para verificar se precisa quebrar página
    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - footerMargin) {
        doc.addPage();
        y = 50;
        printHeader();
      }
    };

    // Cabeçalho
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

      const titulo =
        treinoFiltro === "geral"
          ? "RELATÓRIO DE EVOLUÇÃO"
          : `RELATÓRIO - ${
              treinosDefinidos.find((t) => t.id === treinoFiltro)?.nome
            }`;

      doc.text(titulo, pageWidth / 2, 18, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Aluno: ${aluno.nome} | Objetivo: ${aluno.objetivo}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );
    };

    // Rodapé
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
        doc.text(nomeUsuario, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    printHeader();

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Resumo de Performance", margin, y);
    y += 12;

    checkPageBreak(20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // --- CONTEÚDO DIFERENCIADO POR FILTRO ---
    if (treinoFiltro === "geral") {
      // VISÃO GERAL
      doc.text(`• Total de Treinos: ${historico.length}`, margin + 5, y);
      y += 8;

      checkPageBreak(10);

      doc.text(
        `• Consistência: ${consistencia
          .replace("🔥", "")
          .replace("✅", "")
          .replace("⚠️", "")}`,
        margin + 5,
        y
      );
      y += 8;

      checkPageBreak(10);

      doc.text(
        `• Recorde Geral: ${recordeKPI.carga}kg - ${recordeKPI.exercicio}`,
        margin + 5,
        y
      );
      y += 15;

      checkPageBreak(15);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Histórico de Treinos (Últimos 15)", margin, y);
      y += 10;

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("DATA", margin + 2, y + 6);
      doc.text("INTENSIDADE", margin + 40, y + 6);
      doc.text("EXERCÍCIOS", margin + 90, y + 6);
      y += 12;

      doc.setFont("helvetica", "normal");

      historicoFiltradoData.slice(0, 15).forEach((h) => {
        checkPageBreak(10);

        doc.text(new Date(h.data).toLocaleDateString("pt-BR"), margin + 2, y);
        doc.text(h.intensidade, margin + 40, y);
        doc.text(`${h.totalExerciciosRealizados} ex.`, margin + 90, y);

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 10;
      });
    } else {
      // VISÃO POR TREINO
      const treinoNome = treinosDefinidos.find(
        (t) => t.id === treinoFiltro
      )?.nome;

      doc.text(`• Treino: ${treinoNome}`, margin + 5, y);
      y += 8;

      checkPageBreak(10);

      doc.text(
        `• Total de Execuções: ${historicoFiltradoData.length}`,
        margin + 5,
        y
      );
      y += 8;

      checkPageBreak(10);

      doc.text(
        `• Recorde do Treino: ${recordeKPI.carga}kg - ${recordeKPI.exercicio}`,
        margin + 5,
        y
      );
      y += 15;

      checkPageBreak(15);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Exercícios do ${treinoNome}`, margin, y);
      y += 10;

      // Mostrar cada exercício com seus dados
      if (dadosPorExercicioDoTreino) {
        Object.entries(dadosPorExercicioDoTreino).forEach(
          ([nomeEx, dados], index) => {
            checkPageBreak(25); // Verifica se precisa de página nova ANTES de adicionar o exercício

            const cargaAtual = dados[dados.length - 1].carga;
            const cargaInicial = dados[0].carga;
            const evolucao = cargaAtual - cargaInicial;
            const maxCarga = Math.max(...dados.map((d) => d.carga));

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`${index + 1}. ${nomeEx}`, margin + 5, y);
            y += 7;

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`   Recorde: ${maxCarga}kg`, margin + 8, y);
            y += 6;

            doc.text(
              `   Carga Inicial: ${cargaInicial}kg → Atual: ${cargaAtual}kg`,
              margin + 8,
              y
            );
            y += 6;

            doc.text(
              `   Evolução: ${evolucao > 0 ? "+" : ""}${evolucao}kg`,
              margin + 8,
              y
            );
            y += 6;

            doc.text(`   Execuções: ${dados.length}`, margin + 8, y);
            y += 8;

            doc.setDrawColor(230, 230, 230);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
          }
        );
      }
    }

    printFooter();

    const nomeArquivo =
      treinoFiltro === "geral"
        ? `evolucao_${aluno.nome}.pdf`
        : `evolucao_${aluno.nome}_${
            treinosDefinidos.find((t) => t.id === treinoFiltro)?.nome
          }.pdf`;

    doc.save(nomeArquivo);
  };
  const enviarWhatsAppEvolucao = () => {
    if (!aluno) return;
    const nomeUsuario = session?.user?.name || "Treinador";

    let texto = "";

    if (treinoFiltro === "geral") {
      // VISÃO GERAL
      texto = `📊 *RELATÓRIO DE EVOLUÇÃO - ${aluno.nome.toUpperCase()}*\n\n`;
      texto += `🎯 Objetivo: ${aluno.objetivo}\n`;
      texto += `📅 Período: Últimos ${
        periodo === "todos" ? "treinos" : periodo + " dias"
      }\n\n`;
      texto += `*RESUMO:*\n`;
      texto += `✅ Total Treinos: ${historicoFiltradoData.length}\n`;
      texto += `🏆 Maior Carga: ${recordeKPI.carga}kg (${recordeKPI.exercicio})\n`;
      texto += `📈 Consistência: ${consistencia}\n\n`;
      texto += `📌 *${nomeUsuario}*`;
    } else {
      // VISÃO POR TREINO
      const treinoNome = treinosDefinidos.find(
        (t) => t.id === treinoFiltro
      )?.nome;

      texto = `📊 *RELATÓRIO DO ${treinoNome.toUpperCase()}*\n`;
      texto += `👤 Aluno: ${aluno.nome}\n\n`;
      texto += `*PERFORMANCE:*\n`;
      texto += `✅ Total de Execuções: ${historicoFiltradoData.length}\n`;
      texto += `🏆 Recorde: ${recordeKPI.carga}kg (${recordeKPI.exercicio})\n\n`;

      texto += `*EXERCÍCIOS:*\n`;
      if (dadosPorExercicioDoTreino) {
        Object.entries(dadosPorExercicioDoTreino).forEach(([nomeEx, dados]) => {
          const cargaAtual = dados[dados.length - 1].carga;
          const cargaInicial = dados[0].carga;
          const evolucao = cargaAtual - cargaInicial;
          const maxCarga = Math.max(...dados.map((d) => d.carga));

          texto += `\n💪 *${nomeEx}*\n`;
          texto += `  Recorde: ${maxCarga}kg\n`;
          texto += `  Evolução: ${
            evolucao > 0 ? "📈 +" : "📉 "
          }${evolucao}kg\n`;
          texto += `  ${cargaInicial}kg → ${cargaAtual}kg\n`;
        });
      }
      texto += `\n📌 *${nomeUsuario}*`;
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      texto
    )}`;
    window.open(url, "_blank");
  };

  if (loading)
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>Carregando...
      </div>
    );

  // 🚫 bloqueia acesso se o usuário não tiver permissão para visualizar
  if (!canView) {
    return (
      <div className={styles.semPermissao}>
        <p>⛔ Você não tem permissão para visualizar a evolução do aluno.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <Link href="/dashboard/alunos" className={styles.backLink}>
          <ArrowLeft size={20} /> Voltar
        </Link>

        <div className={styles.headerInfo}>
          <h1>Evolução de {aluno?.nome}</h1>
          <span className={styles.objetivoBadge}>
            {aluno?.objetivo || "Sem objetivo"}
          </span>
        </div>

        <div className={styles.filtersRow}>
          {/* --- FILTROS DE DATA E TREINO --- */}
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="30">30 dias</option>
              <option value="90">3 meses</option>
              <option value="180">6 meses</option>
              <option value="todos">Tudo</option>
            </select>
          </div>
          <div
            className={`${styles.filterGroup} ${
              treinoFiltro !== "geral" ? styles.activeFilter : ""
            }`}
          >
            <LayoutList size={16} />
            <select
              value={treinoFiltro}
              onChange={(e) => setTreinoFiltro(e.target.value)}
              className={styles.filterSelect}
              style={{ minWidth: "120px" }}
            >
              <option value="geral">Visão Geral</option>
              {treinosDefinidos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* --- BOTÕES PDF E WHATS (AGORA JUNTOS AOS FILTROS) --- */}
          {canShare && (
            <div className={styles.actionButtonsInline}>
              <button
                onClick={gerarPdfEvolucao}
                className={`${styles.actionBtn} ${styles.btnPdf}`}
                title="Baixar PDF"
              >
                <FileText className={styles.iconBtn} />
                <span className={styles.hideMobile}>PDF</span>
              </button>

              <button
                onClick={enviarWhatsAppEvolucao}
                className={`${styles.actionBtn} ${styles.btnWhats}`}
                title="Enviar WhatsApp"
              >
                <FaWhatsapp className={styles.iconBtn} />
                <span className={styles.hideMobile}>Whats</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- KPIs FIXOS --- */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Activity size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Total Treinos</h3>
            <p>{historico.length}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <CalendarCheck size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Frequência (30d)</h3>
            <p>{consistencia}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIcon}
            style={{ background: "#fffbeb", color: "#f59e0b" }}
          >
            <Trophy size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>
              {treinoFiltro === "geral"
                ? "Maior Carga (Geral)"
                : "Recorde do Treino"}
            </h3>
            <p>{recordeKPI.carga} kg</p>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                display: "block",
                maxWidth: "140px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {treinoFiltro === "geral"
                ? "No período selecionado"
                : recordeKPI.exercicio}
            </span>
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      {treinoFiltro === "geral" && (
        <div className={styles.chartCard}>
          <h3>🏋️ Volume Total de Carga (Visão Macro)</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGerais}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#8b5cf6"
                  fill="url(#colorVol)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {treinoFiltro !== "geral" && dadosPorExercicioDoTreino && (
        <div className={styles.treinoViewContainer}>
          <h2 className={styles.sectionTitle}>
            Análise Detalhada:{" "}
            {treinosDefinidos.find((t) => t.id === treinoFiltro)?.nome}
          </h2>

          {Object.keys(dadosPorExercicioDoTreino).length === 0 ? (
            <div className={styles.emptyState}>
              Nenhum dado registrado para este treino no período.
            </div>
          ) : (
            <div className={styles.exerciciosGrid}>
              {Object.entries(dadosPorExercicioDoTreino).map(
                ([nomeEx, dados]) => {
                  const cargaAtual = dados[dados.length - 1].carga;
                  const cargaInicial = dados[0].carga;
                  const evolucao = cargaAtual - cargaInicial;
                  const maxCarga = Math.max(...dados.map((d) => d.carga));

                  return (
                    <div key={nomeEx} className={styles.exercicioMiniCard}>
                      <div className={styles.miniCardHeader}>
                        <h4>{nomeEx}</h4>
                        <div className={styles.miniStats}>
                          <span
                            title="Recorde Pessoal"
                            className={styles.badgeMax}
                          >
                            🏆 {maxCarga}kg
                          </span>
                          <span
                            className={`${styles.badgeEvo} ${
                              evolucao >= 0 ? styles.pos : styles.neg
                            }`}
                          >
                            {evolucao > 0 ? `+${evolucao}kg` : `${evolucao}kg`}
                          </span>
                        </div>
                      </div>
                      <div className={styles.miniChartWrapper}>
                        <ResponsiveContainer width="100%" height={100}>
                          <LineChart data={dados}>
                            <Tooltip
                              contentStyle={{
                                fontSize: "12px",
                                padding: "4px",
                              }}
                              itemStyle={{ padding: 0 }}
                              labelStyle={{ display: "none" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="carga"
                              stroke={evolucao >= 0 ? "#10b981" : "#ef4444"}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
