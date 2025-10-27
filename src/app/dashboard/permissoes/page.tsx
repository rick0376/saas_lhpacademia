import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PermissoesManager } from "@/components/permissoes/PermissoesManager";
import styles from "./styles.module.scss";

export default async function PermissoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Gerenciamento de Permissões</h1>
              <p className={styles.subtitle}>
                Configure o que cada usuário pode fazer no sistema
              </p>
            </div>
          </div>

          <div className={styles.infoBox}>
            <h3>📋 Como funciona:</h3>
            <ul>
              <li>
                <strong>Criar:</strong> Permite adicionar novos registros
              </li>
              <li>
                <strong>Ler:</strong> Permite visualizar informações
              </li>
              <li>
                <strong>Editar:</strong> Permite modificar registros existentes
              </li>
              <li>
                <strong>Deletar:</strong> Permite excluir registros
              </li>
            </ul>
            <p className={styles.infoNote}>
              ⚠️ SuperAdmins têm acesso total e não precisam de permissões
              configuradas.
            </p>
          </div>

          <PermissoesManager />
        </div>
      </main>
    </>
  );
}
