import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlunoForm } from "@/components/alunos/AlunoForm";
import styles from "./styles.module.scss";

export default async function NovoAlunoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Novo Aluno</h1>
            <p className={styles.subtitle}>
              Preencha os dados abaixo para cadastrar um novo aluno
            </p>
          </div>

          <AlunoForm />
        </div>
      </main>
    </>
  );
}
