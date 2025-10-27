import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExercicioForm } from "@/components/exercicios/ExercicioForm";
import styles from "./styles.module.scss";

export default async function NovoExercicioPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Novo Exercício</h1>
            <p className={styles.subtitle}>
              Adicione um novo exercício à biblioteca
            </p>
          </div>

          <ExercicioForm />
        </div>
      </main>
    </>
  );
}
