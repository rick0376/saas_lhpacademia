//src/app/dashboard/grupos-treinos/[grupoId]/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";
import Link from "next/link";
import { TreinosDoGrupo } from "@/components/gruposTreinos/TreinosDoGrupo/TreinosDoGrupo";

export default async function GrupoTreinosDetalhePage({
  params,
}: {
  params: Promise<{ grupoId: string }>;
}) {
  const { grupoId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) redirect("/");

  // Permissão base: ler treinos
  if (session.user.role !== "SUPERADMIN") {
    const p = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "treinos",
        },
      },
    });

    if (!p?.ler) redirect("/dashboard?erro=sem-permissao");
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Link href="/dashboard/grupos-treinos" className={styles.back}>
              ← Voltar
            </Link>
            <h1 className={styles.title}>Treinos do Grupo</h1>
            <p className={styles.subtitle}>
              Gerencie os treinos associados a este grupo.
            </p>
          </div>
        </div>

        <TreinosDoGrupo grupoId={grupoId} />
      </div>
    </main>
  );
}
