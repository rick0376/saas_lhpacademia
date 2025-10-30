"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlunoLayout } from "@/components/alunos/AlunoLayout";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";
import styles from "./styles.module.scss";

interface DobrasCutaneas {
  subescapular?: number | null;
  triceps?: number | null;
  peitoral?: number | null;
  axilar?: number | null;
  suprailiaca?: number | null;
  abdominal?: number | null;
  femural?: number | null;
}

interface Avaliacao {
  id: string;
  alunoId: string;
  tipo: string | null;
  resultado: string | null;
  observacoes: string | null;
  arquivo: string | null;
  data: Date; // Data da avaliação (ISO string ou Date)
  createdAt: Date;
  updatedAt: Date | null;

  // Anamnese
  historicoMedico: string | null;
  objetivos: string | null;
  praticaAnterior: string | null;
  fumante: boolean;
  diabetes: boolean;
  doencasArticulares: boolean;
  cirurgias: string | null;

  // Antropometria
  peso: number | null;
  altura: number | null;
  imc: number | null;
  percentualGordura: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  dobrasCutaneas: DobrasCutaneas | null;

  // Cardiorrespiratória
  vo2Max: number | null;
  testeCooper: number | null;

  // Muscular
  forcaSupino: number | null;
  repeticoesFlexoes: number | null;
  pranchaTempo: number | null;

  // Flexibilidade
  testeSentarEsticar: number | null;
}

export default function AvaliacoesPage() {
  const { data: session } = useSession();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const fetchAvaliacoes = async (alunoId: string) => {
    try {
      console.log("🔍 Buscando avaliações para alunoId:", alunoId);
      const res = await fetch(`/api/alunos/avaliacoes?alunoId=${alunoId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      const data = await res.json();
      // Converte strings de data para Date se necessário (API retorna ISO strings)
      const avaliacoesComDatas = data.map((av: Avaliacao) => ({
        ...av,
        data: new Date(av.data),
        createdAt: new Date(av.createdAt),
        updatedAt: av.updatedAt ? new Date(av.updatedAt) : null,
      }));
      setAvaliacoes(avaliacoesComDatas as Avaliacao[]);
      setError(null);
      console.log("✅ Avaliações carregadas:", avaliacoesComDatas.length);
    } catch (err: any) {
      console.error("❌ Erro fetch:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  const recarregarAvaliacoes = async () => {
    if (!session?.user) return;
    setReloading(true);
    const alunoId = (session.user as any).aluno?.id;
    if (alunoId) await fetchAvaliacoes(alunoId);
  };

  useEffect(() => {
    if (!session?.user) return;
    const alunoId = (session.user as any).aluno?.id;
    if (!alunoId) {
      setError("ID do aluno não encontrado na sessão.");
      setLoading(false);
      return;
    }
    fetchAvaliacoes(alunoId);
    // Auto-refresh a cada 10 segundos (aumentado de 8s para evitar spam)
    const interval = setInterval(() => fetchAvaliacoes(alunoId), 10000);
    return () => clearInterval(interval);
  }, [session]);

  const formatarData = (data: Date): string =>
    data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatarMedida = (valor: number | null, unidade: string): string => {
    return valor ? `${valor.toFixed(1)} ${unidade}` : "N/A";
  };

  const resumirDobrasCutaneas = (dobras: DobrasCutaneas | null): string => {
    if (
      !dobras ||
      Object.values(dobras).every((v) => v === null || v === undefined)
    )
      return "N/A";
    const medias = Object.values(dobras).filter(
      (v): v is number => v !== null && v !== undefined
    );
    if (medias.length === 0) return "N/A";
    const media = medias.reduce((a, b) => a + b, 0) / medias.length;
    return `${media.toFixed(1)} mm (média)`;
  };

  const baixarArquivo = (avaliacao: Avaliacao) => {
    if (!avaliacao.arquivo) return;
    const link = document.createElement("a");
    link.href = avaliacao.arquivo;
    link.download = `avaliacao_${avaliacao.tipo || "fisica"}_${formatarData(
      avaliacao.data
    ).replace(/\//g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando avaliações...</p>
          </div>
        </div>
      </AlunoLayout>
    );
  }

  if (error) {
    return (
      <AlunoLayout>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <p>❌ Erro ao carregar: {error}</p>
            <button
              onClick={recarregarAvaliacoes}
              className={styles.retryButton}
            >
              Tentar Novamente
            </button>
          </div>
          <Link href="/alunos/dashboard" className={styles.backLink}>
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Link>
        </div>
      </AlunoLayout>
    );
  }

  return (
    <AlunoLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>📊 Avaliações Físicas</h1>
          <button
            onClick={recarregarAvaliacoes}
            disabled={reloading}
            className={styles.refreshBtn}
            title="Recarregar avaliações"
          >
            <RefreshCw size={20} className={reloading ? styles.spinning : ""} />
            {reloading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {avaliacoes.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>📋</div>
            <h2>Nenhuma Avaliação Encontrada</h2>
            <p>Aguarde o treinador cadastrar sua primeira avaliação física!</p>
            <button
              onClick={recarregarAvaliacoes}
              className={styles.emptyButton}
            >
              Verificar Novamente
            </button>
          </div>
        ) : (
          <>
            {/* Tabela para Desktop */}
            <div className={styles.tableWrapper}>
              <h2>Lista de Avaliações</h2>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th>Tipo</th>
                      <th>Data</th>
                      <th>Peso (kg)</th>
                      <th>Altura (cm)</th>
                      <th>IMC</th>
                      <th>% Gordura</th>
                      <th>VO2 Max (ml/kg/min)</th>
                      <th>Flexões</th>
                      <th>Prancha (s)</th>
                      <th>Dobras (mm média)</th>
                      <th>Resultado</th>
                      <th>Observações</th>
                      <th>Arquivo PDF</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {avaliacoes.map((av) => (
                      <tr key={av.id}>
                        <td data-label="Tipo">{av.tipo || "N/A"}</td>
                        <td data-label="Data">{formatarData(av.data)}</td>
                        <td data-label="Peso">
                          {formatarMedida(av.peso, "kg")}
                        </td>
                        <td data-label="Altura">
                          {formatarMedida(av.altura, "cm")}
                        </td>
                        <td data-label="IMC">{formatarMedida(av.imc, "")}</td>
                        <td data-label="% Gordura">
                          {formatarMedida(av.percentualGordura, "%")}
                        </td>
                        <td data-label="VO2 Max">
                          {formatarMedida(av.vo2Max, "")}
                        </td>
                        <td data-label="Flexões">
                          {av.repeticoesFlexoes
                            ? `${av.repeticoesFlexoes} reps`
                            : "N/A"}
                        </td>
                        <td data-label="Prancha">
                          {formatarMedida(av.pranchaTempo, "s")}
                        </td>
                        <td data-label="Dobras">
                          {resumirDobrasCutaneas(av.dobrasCutaneas)}
                        </td>
                        <td data-label="Resultado">{av.resultado || "N/A"}</td>
                        <td
                          className={styles.observacoes}
                          data-label="Observações"
                          title={av.observacoes || "N/A"}
                        >
                          {av.observacoes ? (
                            <div className={styles.observacoesContent}>
                              {av.observacoes.length > 100
                                ? `${av.observacoes.substring(0, 100)}...`
                                : av.observacoes}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td data-label="Arquivo PDF">
                          {av.arquivo ? (
                            <button
                              onClick={() => baixarArquivo(av)}
                              className={styles.pdfLink}
                              title="Baixar PDF"
                            >
                              <Download size={16} /> Ver PDF
                            </button>
                          ) : (
                            "N/A"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards para Mobile */}
            <div className={styles.mobileCardsWrapper}>
              <h2>Lista de Avaliações</h2>
              {avaliacoes.map((av) => (
                <div key={av.id} className={styles.evaluationCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.tipo}>{av.tipo || "N/A"}</span>
                    <span className={styles.data}>{formatarData(av.data)}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>Peso</span>
                      <span className={styles.value}>
                        {formatarMedida(av.peso, "kg")}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>Altura</span>
                      <span className={styles.value}>
                        {formatarMedida(av.altura, "cm")}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>IMC</span>
                      <span className={styles.value}>
                        {formatarMedida(av.imc, "")}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>% Gordura</span>
                      <span className={styles.value}>
                        {formatarMedida(av.percentualGordura, "%")}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>VO2 Max</span>
                      <span className={styles.value}>
                        {formatarMedida(av.vo2Max, "ml/kg/min")}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>Flexões</span>
                      <span className={styles.value}>
                        {av.repeticoesFlexoes
                          ? `${av.repeticoesFlexoes} reps`
                          : "N/A"}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>Prancha</span>
                      <span className={styles.value}>
                        {formatarMedida(av.pranchaTempo, "s")}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>Dobras</span>
                      <span className={styles.value}>
                        {resumirDobrasCutaneas(av.dobrasCutaneas)}
                      </span>
                    </div>
                    <div className={styles.keyValue}>
                      <span className={styles.key}>Resultado</span>
                      <span className={styles.value}>
                        {av.resultado || "N/A"}
                      </span>
                    </div>
                    <div className={styles.keyValue + " " + styles.observacoes}>
                      <span className={styles.key}>Observações</span>
                      <span className={styles.value}>
                        {av.observacoes || "N/A"}
                      </span>
                    </div>
                    {av.fumante && (
                      <div className={`${styles.keyValue} ${styles.warning}`}>
                        <span className={styles.key}>Fumante</span>
                        <span className={styles.value}>Sim</span>
                      </div>
                    )}
                    {av.diabetes && (
                      <div className={`${styles.keyValue} ${styles.warning}`}>
                        <span className={styles.key}>Diabetes</span>
                        <span className={styles.value}>Sim</span>
                      </div>
                    )}
                    {av.doencasArticulares && (
                      <div className={`${styles.keyValue} ${styles.warning}`}>
                        <span className={styles.key}>Doenças Articulares</span>
                        <span className={styles.value}>Sim</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.resumo}>
                      {av.resultado || "Avaliação completa"}
                    </span>
                    {av.arquivo ? (
                      <button
                        onClick={() => baixarArquivo(av)}
                        className={styles.pdfLink}
                        title="Baixar PDF"
                      >
                        <Download size={16} /> PDF
                      </button>
                    ) : (
                      <span className={styles.resumo}>Sem PDF</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo da Última Avaliação (Visível em Desktop e Mobile) */}
            {avaliacoes.length > 0 && (
              <div className={styles.summarySection}>
                <h3>Resumo da Última Avaliação</h3>
                <div className={styles.summaryCards}>
                  <div className={styles.card}>
                    <strong>Peso:</strong>{" "}
                    {formatarMedida(avaliacoes[0].peso, "kg")}
                  </div>
                  <div className={styles.card}>
                    <strong>IMC:</strong>{" "}
                    {formatarMedida(avaliacoes[0].imc, "")}
                  </div>
                  <div className={styles.card}>
                    <strong>% Gordura:</strong>{" "}
                    {formatarMedida(avaliacoes[0].percentualGordura, "%")}
                  </div>
                  <div className={styles.card}>
                    <strong>VO2 Max:</strong>{" "}
                    {formatarMedida(avaliacoes[0].vo2Max, "ml/kg/min")}
                  </div>
                  <div className={styles.card}>
                    <strong>Objetivos:</strong>{" "}
                    {avaliacoes[0].objetivos || "N/A"}
                  </div>
                  {avaliacoes[0].fumante && (
                    <div className={styles.cardWarning}>⚠️ Fumante: Sim</div>
                  )}
                  {avaliacoes[0].diabetes && (
                    <div className={styles.cardWarning}>⚠️ Diabetes: Sim</div>
                  )}
                  {avaliacoes[0].doencasArticulares && (
                    <div className={styles.cardWarning}>
                      ⚠️ Doenças Articulares: Sim
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <Link href="/alunos/dashboard" className={styles.backLink}>
          <ArrowLeft size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </AlunoLayout>
  );
}
