import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlunoForm } from "@/components/alunos/AlunoForm";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{ id: string }>; // ✅ Next.js 15: Params como Promise (resolve type error no build)
}

export default async function EditarAlunoPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ✅ Await params (já correto no seu código)
  const { id } = await params;

  const aluno = await prisma.aluno.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      dataNascimento: true,
      foto: true,
      objetivo: true,
      observacoes: true,
      ativo: true,
      clienteId: true, // <-- ADICIONAR ISSO
    },
  });

  if (!aluno) {
    redirect("/dashboard/alunos");
  }

  const alunoData = {
    ...aluno,
    email: aluno.email || "",
    telefone: aluno.telefone || "",
    dataNascimento: aluno.dataNascimento
      ? aluno.dataNascimento.toISOString().split("T")[0]
      : "",
    foto: aluno.foto || "",
    objetivo: aluno.objetivo || "",
    observacoes: aluno.observacoes || "",
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Editar Aluno</h1>
            <p className={styles.subtitle}>
              Atualize os dados do aluno <strong>{aluno.nome}</strong>
            </p>
          </div>

          <AlunoForm initialData={alunoData} isEdit={true} />
        </div>
      </main>
    </>
  );
}
