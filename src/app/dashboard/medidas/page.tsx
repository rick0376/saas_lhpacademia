import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MedidasClient from "@/components/medidas/alunos/MedidasAlunos";
import styles from "./styles.module.scss";

export default async function MedidasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Gerenciamento de Medidas</h1>
            <p className={styles.subtitle}>
              Cadastre e acompanhe as medidas corporais dos alunos
            </p>
          </div>
        </div>

        {/* O componente Client-Side entra aqui */}
        <Suspense
          fallback={
            <p style={{ color: "white", textAlign: "center" }}>
              Carregando lista...
            </p>
          }
        >
          <MedidasClient />
        </Suspense>
      </div>
    </main>
  );
}
