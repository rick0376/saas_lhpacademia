import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AvaliacaoAluno } from "@/components/alunos/AvaliacaoAluno";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

export default async function AvaliacoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  if (session.user.role !== "SUPERADMIN") {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "avaliacoes",
        },
      },
    });

    if (!permissao || !permissao.ler) {
      redirect("/dashboard?erro=sem-permissao");
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Gerenciamento das Avaliações</h1>
            <p className={styles.subtitle}>
              Cadastre e acompanhe todas as avaliações da academia
            </p>
          </div>
        </div>
        <AvaliacaoAluno />
      </div>
    </main>
  );
}
