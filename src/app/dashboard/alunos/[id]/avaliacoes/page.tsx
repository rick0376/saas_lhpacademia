//app/dashboard/alunos/[id]/avaliacoes/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  const session = await getServerSession(authOptions);
  const { id: alunoId } = await params;

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  // ✅ Verificar permissões (visualizar e criar)
  let podeVisualizar = session.user.role === "SUPERADMIN";
  let podeCriarAvaliacao = session.user.role === "SUPERADMIN";

  if (!podeVisualizar || !podeCriarAvaliacao) {
    const permissoes = await prisma.permissao.findMany({
      where: { usuarioId: session.user.id },
      select: { recurso: true, ler: true, criar: true },
    });

    const permAvaliacoes = permissoes.find((p) => p.recurso === "avaliacoes");
    const permAlunosAvaliacoes = permissoes.find(
      (p) => p.recurso === "alunos_avaliacoes"
    );

    // 🔹 “Visualizar Detalhes” → ler de qualquer um dos dois
    podeVisualizar =
      session.user.role === "SUPERADMIN" ||
      !!permAvaliacoes?.ler ||
      !!permAlunosAvaliacoes?.ler;

    // 🔹 “Nova Avaliação” → criar em “avaliacoes”
    podeCriarAvaliacao =
      session.user.role === "SUPERADMIN" || !!permAvaliacoes?.criar;
  }

  // Se o usuário não puder visualizar nada, redireciona
  if (!podeVisualizar) {
    redirect("/dashboard?erro=sem-permissao");
  }

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    select: { nome: true },
  });
  if (!aluno) return <div>Aluno não encontrado.</div>;

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
        {podeCriarAvaliacao && (
          <Link
            href={`/dashboard/alunos/${alunoId}/avaliacoes/nova`}
            className={styles.iconAvaliar}
          >
            Nova Avaliação
          </Link>
        )}
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

              {podeVisualizar && (
                <Link
                  href={`/dashboard/alunos/${alunoId}/avaliacoes/${av.id}`}
                  className={styles.cardLink}
                >
                  Visualizar Detalhes
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
