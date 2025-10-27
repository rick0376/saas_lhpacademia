import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserForm } from "@/components/usuarios/UserForm";
import styles from "./styles.module.scss";

export default async function NovoUsuarioPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Novo Usuário</h1>
            <p className={styles.subtitle}>
              Preencha os dados abaixo para criar um novo usuário
            </p>
          </div>

          <UserForm />
        </div>
      </main>
    </>
  );
}
