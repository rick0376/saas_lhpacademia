import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TreinoTable } from "@/components/treinos/TreinoTable";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

export default async function TreinosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  // Verificar permissão de ler treinos
  if (session.user.role !== "SUPERADMIN") {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "treinos",
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
            <h1 className={styles.title}>Gerenciamento de Treinos</h1>
            <p className={styles.subtitle}>
              Crie e gerencie as fichas de treino dos alunos
            </p>
          </div>
        </div>
        <TreinoTable />
      </div>
    </main>
  );
}
