import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import styles from "./styles.module.scss";

interface DobrasCutaneas {
  subescapular: number | null;
  triceps: number | null;
  peitoral: number | null;
  axilar: number | null;
  suprailiaca: number | null;
  abdominal: number | null;
  femural: number | null;
}

interface Avaliacao {
  id: string;
  tipo: string | null;
  data: Date;
  resultado: string | null;
  observacoes: string | null;
  historicoMedico: string | null;
  objetivos: string | null;
  praticaAnterior: string | null;
  fumante: boolean | null;
  diabetes: boolean | null;
  doencasArticulares: boolean | null;
  cirurgias: string | null;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  percentualGordura: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  dobrasCutaneas: DobrasCutaneas | null;
  vo2Max: number | null;
  testeCooper: number | null;
  forcaSupino: number | null;
  repeticoesFlexoes: number | null;
  pranchaTempo: number | null;
  testeSentarEsticar: number | null;
  arquivo: string | null;
}

// Função para parsear JSON e garantir tipagem para dobrasCutaneas
function parseDobrasCutaneas(data: unknown): DobrasCutaneas | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Partial<DobrasCutaneas>;
  return {
    subescapular: typeof d.subescapular === "number" ? d.subescapular : null,
    triceps: typeof d.triceps === "number" ? d.triceps : null,
    peitoral: typeof d.peitoral === "number" ? d.peitoral : null,
    axilar: typeof d.axilar === "number" ? d.axilar : null,
    suprailiaca: typeof d.suprailiaca === "number" ? d.suprailiaca : null,
    abdominal: typeof d.abdominal === "number" ? d.abdominal : null,
    femural: typeof d.femural === "number" ? d.femural : null,
  };
}

export default async function AvaliacoesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: alunoId } = await params;

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    select: { nome: true },
  });
  if (!aluno) return <div>Aluno não encontrado.</div>;

  // Buscar avaliação incluindo dobrasCutaneas como Json que deve ser parseado
  const rawAvaliacoes = await prisma.avaliacao.findMany({
    where: { alunoId },
    select: {
      id: true,
      tipo: true,
      data: true,
      resultado: true,
      observacoes: true,
      historicoMedico: true,
      objetivos: true,
      praticaAnterior: true,
      fumante: true,
      diabetes: true,
      doencasArticulares: true,
      cirurgias: true,
      peso: true,
      altura: true,
      imc: true,
      percentualGordura: true,
      circunferenciaCintura: true,
      circunferenciaQuadril: true,
      dobrasCutaneas: true,
      vo2Max: true,
      testeCooper: true,
      forcaSupino: true,
      repeticoesFlexoes: true,
      pranchaTempo: true,
      testeSentarEsticar: true,
      arquivo: true,
    },
    orderBy: { data: "desc" },
  });

  // Parse seguro dobrasCutaneas
  const avaliacoes: Avaliacao[] = rawAvaliacoes.map((av) => ({
    ...av,
    dobrasCutaneas: parseDobrasCutaneas(av.dobrasCutaneas),
  }));

  const safeNum = (n: number | null | undefined) => (n != null ? n : "-");
  const boolToStr = (b: boolean | null | undefined) =>
    b == null ? "-" : b ? "Sim" : "Não";

  return (
    <div className={styles.container}>
      <div className={styles.headerTop}>
        <h1 className={styles.title}>Avaliações de: {aluno.nome ?? "-"}</h1>
        <Link
          href={`/dashboard/alunos/${alunoId}/avaliacoes/nova`}
          className={styles.iconAvaliar}
        >
          Nova Avaliação
        </Link>
      </div>
      {avaliacoes.length === 0 ? (
        <p className={styles.noData}>Sem avaliações cadastradas.</p>
      ) : (
        <div className={styles.cardsContainer}>
          {avaliacoes.map((av) => (
            <div key={av.id} className={styles.card}>
              <h2 className={styles.cardHeader}>
                {av.tipo ?? "-"} - {format(new Date(av.data), "dd/MM/yyyy")}
              </h2>

              <div className={styles.cardSection}>
                <h3>Informações Básicas</h3>
                <p>
                  <strong>IMC:</strong> {safeNum(av.imc)}
                </p>
                <p>
                  <strong>% Gordura Corporal:</strong>{" "}
                  {safeNum(av.percentualGordura)}%
                </p>
                <p>
                  <strong>Peso:</strong> {safeNum(av.peso)} kg
                </p>
                <p>
                  <strong>Altura:</strong> {safeNum(av.altura)} cm
                </p>
                <p>
                  <strong>Circunferência Cintura:</strong>{" "}
                  {safeNum(av.circunferenciaCintura)} cm
                </p>
                <p>
                  <strong>Circunferência Quadril:</strong>{" "}
                  {safeNum(av.circunferenciaQuadril)} cm
                </p>
              </div>

              <div className={styles.cardSection}>
                <h3>Histórico</h3>
                <p>
                  <strong>Histórico Médico:</strong> {av.historicoMedico ?? "-"}
                </p>
                <p>
                  <strong>Objetivos:</strong> {av.objetivos ?? "-"}
                </p>
                <p>
                  <strong>Prática Anterior:</strong> {av.praticaAnterior ?? "-"}
                </p>
                <p>
                  <strong>Fumante:</strong> {boolToStr(av.fumante)}
                </p>
                <p>
                  <strong>Diabetes:</strong> {boolToStr(av.diabetes)}
                </p>
                <p>
                  <strong>Doenças Articulares:</strong>{" "}
                  {boolToStr(av.doencasArticulares)}
                </p>
                <p>
                  <strong>Cirurgias:</strong> {av.cirurgias ?? "-"}
                </p>
              </div>

              <div className={styles.cardSection}>
                <h3>Dobras Cutâneas (mm)</h3>
                <p>
                  <strong>Subescapular:</strong>{" "}
                  {av.dobrasCutaneas?.subescapular ?? "-"}
                </p>
                <p>
                  <strong>Tríceps:</strong> {av.dobrasCutaneas?.triceps ?? "-"}
                </p>
                <p>
                  <strong>Peitoral:</strong>{" "}
                  {av.dobrasCutaneas?.peitoral ?? "-"}
                </p>
                <p>
                  <strong>Axilar:</strong> {av.dobrasCutaneas?.axilar ?? "-"}
                </p>
                <p>
                  <strong>Suprailiaca:</strong>{" "}
                  {av.dobrasCutaneas?.suprailiaca ?? "-"}
                </p>
                <p>
                  <strong>Abdominal:</strong>{" "}
                  {av.dobrasCutaneas?.abdominal ?? "-"}
                </p>
                <p>
                  <strong>Femural:</strong> {av.dobrasCutaneas?.femural ?? "-"}
                </p>
              </div>

              <div className={styles.cardSection}>
                <h3>Testes e Resultados</h3>
                <p>
                  <strong>VO2 Max:</strong> {safeNum(av.vo2Max)}
                </p>
                <p>
                  <strong>Teste de Cooper:</strong> {safeNum(av.testeCooper)}
                </p>
                <p>
                  <strong>Força Supino (kg):</strong> {safeNum(av.forcaSupino)}
                </p>
                <p>
                  <strong>Repetições Flexões:</strong>{" "}
                  {safeNum(av.repeticoesFlexoes)}
                </p>
                <p>
                  <strong>Tempo Prancha (s):</strong> {safeNum(av.pranchaTempo)}
                </p>
                <p>
                  <strong>Teste Sentar e Esticar (cm):</strong>{" "}
                  {safeNum(av.testeSentarEsticar)}
                </p>
                <p>
                  <strong>Resultado:</strong> {av.resultado ?? "-"}
                </p>
                <p>
                  <strong>Observações:</strong> {av.observacoes ?? "-"}
                </p>
              </div>

              {av.arquivo && (
                <div className={styles.cardSection}>
                  <h3>Arquivo</h3>
                  <a
                    href={av.arquivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkButton}
                  >
                    Abrir PDF
                  </a>
                </div>
              )}

              <Link
                href={`/dashboard/alunos/${alunoId}/avaliacoes/${av.id}`}
                className={styles.cardLink}
              >
                Visualizar Detalhes
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
