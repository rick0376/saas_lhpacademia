import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlunoTable } from "@/components/alunos/AlunoTable";
import styles from "./styles.module.scss";

export default async function AlunosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ALUNO não acessa esta página (eles usam o app mobile)
  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  // ADMIN, USER e SUPERADMIN podem acessar (com permissões controladas no componente)
  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Gerenciamento de Alunos</h1>
              <p className={styles.subtitle}>
                Cadastre e acompanhe todos os alunos da academia
              </p>
            </div>
          </div>

          <AlunoTable />
        </div>
      </main>
    </>
  );
}
