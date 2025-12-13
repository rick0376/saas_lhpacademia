import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserTable } from "@/components/usuarios/UserTable";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./styles.module.scss";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/alunos/dashboard");
  }

  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let canCreate = false;
  if (session.user.role === "SUPERADMIN") {
    canCreate = true;
  } else {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "usuarios",
        },
      },
    });
    canCreate = permissao?.criar ?? false;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Gerenciamento de Usuários</h1>
            <p className={styles.subtitle}>
              Cadastre e gerencie todos os usuários do sistema
            </p>
          </div>
        </header>
        <UserTable />
      </div>
    </main>
  );
}
