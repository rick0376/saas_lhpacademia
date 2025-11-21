import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExercicioTable } from "@/components/exercicios/ExercicioTable";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

export default async function ExerciciosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  // Verificar permissão de ler exercícios
  if (session.user.role !== "SUPERADMIN") {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "exercicios",
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
            <h1 className={styles.title}>Biblioteca de Exercícios</h1>
            <p className={styles.subtitle}>
              Cadastre e organize os exercícios disponíveis
            </p>
          </div>
        </div>
        <ExercicioTable />
      </div>
    </main>
  );
}
