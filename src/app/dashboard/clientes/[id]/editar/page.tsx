import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarClientePage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  // ✅ Await params
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      logo: true,
      ativo: true,
    },
  });

  if (!cliente) {
    redirect("/dashboard/clientes");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Editar Cliente</h1>
            <p className={styles.subtitle}>
              Atualize os dados do cliente <strong>{cliente.nome}</strong>
            </p>
          </div>

          <ClienteForm
            initialData={{
              id: cliente.id,
              nome: cliente.nome,
              logo: cliente.logo || undefined,
              ativo: cliente.ativo,
            }}
            isEdit={true}
          />
        </div>
      </main>
    </>
  );
}
