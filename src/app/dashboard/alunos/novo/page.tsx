import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AlunoForm } from "@/components/alunos/AlunoForm";
import styles from "./styles.module.scss";

export default async function NovoAluno(props: any) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const sp = await props.searchParams;
  const cid = sp?.clienteId || session.user.clienteId || null;
  console.log("CID =", cid);

  let cnome = null;
  if (cid) {
    const c = await prisma.cliente.findUnique({
      where: { id: cid },
      select: { nome: true },
    });
    cnome = c?.nome || null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {cnome ? `Novo Aluno - ${cnome}` : "Novo Aluno"}
          </h1>
        </div>
        <AlunoForm clienteId={cid} />
      </div>
    </main>
  );
}
