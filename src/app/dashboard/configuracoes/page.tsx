import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackupManager } from "@/components/configuracoes/BackupManager";
import styles from "./styles.module.scss";

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ✅ ALUNO não pode acessar
  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  // ✅ VERIFICAR PERMISSÃO (exceto SUPERADMIN)
  if (session.user.role !== "SUPERADMIN") {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "configuracoes",
        },
      },
    });

    if (!permissao || !permissao.ler) {
      redirect("/dashboard?erro=sem-permissao");
    }
  }

  // ✅ Só SUPERADMIN vê backup
  const isSuperAdmin = session.user.role === "SUPERADMIN";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>⚙️ Configurações do Sistema</h1>
        <p className={styles.subtitle}>
          {isSuperAdmin
            ? "Gerenciamento de backup do banco de dados"
            : "Configurações disponíveis para você"}
        </p>
      </div>

      <div className={styles.grid}>
        {isSuperAdmin && (
          <section className={styles.card}>
            <BackupManager />
          </section>
        )}

        {!isSuperAdmin && (
          <section className={styles.card}>
            <h2>🔧 Configurações Gerais</h2>
            <p>Funcionalidades de configuração em desenvolvimento.</p>
          </section>
        )}
      </div>
    </div>
  );
}
