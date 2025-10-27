import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TreinoTable } from "@/components/treinos/TreinoTable";
import Link from "next/link";
import styles from "./styles.module.scss";

export default async function TreinosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Gerenciamento de Treinos</h1>
              <p className={styles.subtitle}>
                Crie e gerencie as fichas de treino dos alunos
              </p>
            </div>
            <Link href="/dashboard/treinos/novo" className={styles.addButton}>
              <span className={styles.icon}>+</span>
              Novo Treino
            </Link>
          </div>

          <TreinoTable />
        </div>
      </main>
    </>
  );
}
