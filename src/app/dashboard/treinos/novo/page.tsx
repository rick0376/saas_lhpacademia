import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TreinoForm } from "@/components/treinos/TreinoForm";
import styles from "./styles.module.scss";

export default async function NovoTreinoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Novo Treino</h1>
            <p className={styles.subtitle}>
              Crie uma nova ficha de treino para um aluno
            </p>
          </div>

          <TreinoForm />
        </div>
      </main>
    </>
  );
}
