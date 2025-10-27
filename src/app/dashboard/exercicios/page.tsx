import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExercicioTable } from "@/components/exercicios/ExercicioTable";
import Link from "next/link";
import styles from "./styles.module.scss";

export default async function ExerciciosPage() {
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
              <h1 className={styles.title}>Biblioteca de Exercícios</h1>
              <p className={styles.subtitle}>
                Cadastre e organize os exercícios disponíveis
              </p>
            </div>
            <Link
              href="/dashboard/exercicios/novo"
              className={styles.addButton}
            >
              <span className={styles.icon}>+</span>
              Novo Exercício
            </Link>
          </div>

          <ExercicioTable />
        </div>
      </main>
    </>
  );
}
