import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import styles from "./styles.module.scss";

export default async function NovoClientePage() {
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
            <h1 className={styles.title}>Novo Cliente</h1>
            <p className={styles.subtitle}>
              Preencha os dados abaixo para criar um novo cliente
            </p>
          </div>

          <ClienteForm />
        </div>
      </main>
    </>
  );
}
