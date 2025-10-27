import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TreinoDetalhes } from "@/components/treinos/TreinoDetalhes";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{ id: string }>; // ✅ Promise
}

export default async function TreinoDetalhesPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ✅ Await params
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

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <TreinoDetalhes treino={treino} />
        </div>
      </main>
    </>
  );
}
