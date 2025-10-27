import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AlunoForm } from "@/components/alunos/AlunoForm";
import styles from "./styles.module.scss";

interface PageProps {
  searchParams: {
    clienteId?: string;
  };
}

export default async function NovoAlunoPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  let clienteId: string | null = null;
  let clienteNome: string | null = null;

  if (searchParams.clienteId) {
    clienteId = searchParams.clienteId;
  } else if (session.user.role !== "SUPERADMIN" && session.user.clienteId) {
    clienteId = session.user.clienteId;
  }

  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { nome: true },
    });
    clienteNome = cliente?.nome || null;
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {clienteNome ? `Novo Aluno - ${clienteNome}` : "Novo Aluno"}
            </h1>
            <p className={styles.subtitle}>
              Preencha os dados abaixo para cadastrar um novo aluno
            </p>
          </div>

          <AlunoForm clienteId={clienteId} />
        </div>
      </main>
    </>
  );
}
