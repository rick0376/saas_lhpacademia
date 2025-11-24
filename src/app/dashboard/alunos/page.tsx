import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlunoTable } from "@/components/alunos/AlunoTable";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AlunosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  let canCreate = false;
  if (session.user.role === "SUPERADMIN") {
    canCreate = true;
  } else {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "alunos",
        },
      },
    });
    canCreate = permissao?.criar ?? false;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Gerenciamento de Alunos</h1>
            <p className={styles.subtitle}>
              Cadastre e acompanhe todos os alunos da academia
            </p>
          </div>
          {canCreate && (
            <Link href="/dashboard/alunos/novo" className={styles.addButton}>
              <Plus size={20} />
              Novo Aluno
            </Link>
          )}
        </div>

        <AlunoTable />
      </div>
    </main>
  );
}
