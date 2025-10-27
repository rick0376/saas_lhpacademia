import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserTable } from "@/components/usuarios/UserTable";
import Link from "next/link";
import styles from "./styles.module.scss";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  console.log("🔍 1. Session:", session); // ✅ Vê a sessão completa

  if (!session) {
    console.log("❌ 2. Sem sessão");
    redirect("/");
  }

  console.log("🔍 2. Session user:", session.user); // ✅ Vê o usuário completo
  console.log("🔍 3. Session role:", session.user.role); // ✅ Vê o role

  if (session.user.role === "ALUNO") {
    console.log("❌ 3. É ALUNO");
    redirect("/alunos/dashboard");
  }

  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    console.log("❌ 4. Não é SUPERADMIN nem ADMIN, role =", session.user.role);
    redirect("/dashboard");
  }

  console.log("✅ 5. Passou nas validações!");

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
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
          </div>

          <UserTable />
        </div>
      </main>
    </>
  );
}
