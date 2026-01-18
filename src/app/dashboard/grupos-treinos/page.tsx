//src/app/dashboard/grupos-treinos/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";
import { GrupoTreinosGrid } from "@/components/gruposTreinos/GrupoTreinosGrid/GrupoTreinosGrid";

export default async function GruposTreinosPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/");

  // BLOQUEIO: usa a permissão de "treinos" para entrar aqui (mesma lógica do seu sistema)
  if (session.user.role !== "SUPERADMIN") {
    const p = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "treinos",
        },
      },
    });

    if (!p?.ler) {
      redirect("/dashboard?erro=sem-permissao");
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Grupos de Treinos</h1>
            <p className={styles.subtitle}>
              Crie grupos e organize treinos existentes em múltiplos grupos.
            </p>
          </div>
        </div>

        <GrupoTreinosGrid />
      </div>
    </main>
  );
}
