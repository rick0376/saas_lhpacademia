import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClienteTable } from "@/components/clientes/ClienteTable";
import Link from "next/link";
import styles from "./styles.module.scss";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Gerenciamento de Clientes</h1>
              <p className={styles.subtitle}>
                Cadastre e gerencie todos os clientes do sistema
              </p>
            </div>
            <Link href="/dashboard/clientes/novo" className={styles.addButton}>
              <span className={styles.icon}>+</span>
              Novo Cliente
            </Link>
          </div>

          <ClienteTable />
        </div>
      </main>
    </>
  );
}
