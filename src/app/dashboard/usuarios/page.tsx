import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserTable } from "@/components/usuarios/UserTable";
import Link from "next/link";
import styles from "./styles.module.scss";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/alunos/dashboard");
  }

  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Gerenciamento de Usuários</h1>
              <p className={styles.subtitle}>
                Cadastre e gerencie todos os usuários do sistema
              </p>
            </div>
            <Link href="/dashboard/usuarios/novo" className={styles.addButton}>
              <span className={styles.icon}>+</span>
              Novo Usuário
            </Link>
          </header>

          <UserTable />
        </div>
      </main>
    </>
  );
}
