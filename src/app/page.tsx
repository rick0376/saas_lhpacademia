import { prisma } from "@/lib/prisma";
import { ClientCard } from "@/components/dashboard/ClientCard";
import styles from "./styles.module.scss";
import Link from "next/link";

export default async function Home() {
  const clientes = await prisma.cliente.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Link href="/login-superadmin" className={styles.adminLink}>
          🔑 Acesso SuperAdmin
        </Link>
      </div>

      <div className={styles.hero}>
        <h1 className={styles.title}>Bem-vindo a Academia LHP</h1>
        <p className={styles.subtitle}>Selecione um cliente para fazer login</p>
      </div>

      <div className={styles.clientesGrid}>
        {clientes.map((cliente: any) => (
          <ClientCard
            key={cliente.id}
            id={cliente.id}
            nome={cliente.nome}
            logo={cliente.logo || undefined}
          />
        ))}
      </div>

      {clientes.length === 0 && (
        <div className={styles.empty}>
          <p>Nenhum cliente cadastrado ainda.</p>
          <p className={styles.emptySubtext}>
            Entre em contato com o administrador do sistema.
          </p>
        </div>
      )}
    </div>
  );
}
