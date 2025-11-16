import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AvaliacaoAluno } from "@/components/alunos/AvaliacaoAluno";
import Link from "next/link";
import styles from "./styles.module.scss";

export default async function AlunosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ✅ Novo: Proteção por role (só admins acessam avaliações via aqui)
  if (!["ADMIN", "SUPERADMIN"].includes((session.user as any).role)) {
    redirect("/dashboard"); // Redireciona para dashboard principal se não admin
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Gerenciamento das Avaliações</h1>
              <p className={styles.subtitle}>
                Cadastre e acompanhe todas as avaliacões da academia
              </p>
            </div>
            <Link href="/dashboard/alunos/novo" className={styles.addButton}>
              <span className={styles.icon}>+</span>
              Novo Aluno
            </Link>
          </div>

          <AvaliacaoAluno />
        </div>
      </main>
    </>
  );
}
