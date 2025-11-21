import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TreinoDetalhes } from "@/components/treinos/TreinoDetalhes";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TreinoDetalhesPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const treino = await prisma.treino.findUnique({
    where: { id },
    include: {
      aluno: true,
      exercicios: {
        include: {
          exercicio: true,
        },
        orderBy: { ordem: "asc" },
      },
      cronogramas: {
        orderBy: { diaSemana: "asc" },
      },
    },
  });

  if (!treino) {
    redirect("/dashboard/treinos");
  }

  // Verificar permissão de editar treinos (se não for SUPERADMIN)
  // Isso controla a visibilidade dos botões de editar/excluir exercícios
  let podeEditar = true;
  if (session.user.role !== "SUPERADMIN") {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "treinos",
        },
      },
    });
    podeEditar = !!permissao?.editar;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <TreinoDetalhes treino={treino} permissoesEditar={podeEditar} />
      </div>
    </main>
  );
}
