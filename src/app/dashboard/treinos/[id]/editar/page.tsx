import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TreinoForm } from "@/components/treinos/TreinoForm";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{ id: string }>; // ✅ Promise
}

export default async function EditarTreinoPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ALUNO") {
    redirect("/dashboard");
  }

  // ✅ ADICIONAR VERIFICAÇÃO DE PERMISSÃO (EDITAR)
  if (session.user.role !== "SUPERADMIN") {
    const permissao = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: {
          usuarioId: session.user.id,
          recurso: "treinos",
        },
      },
    });

    if (!permissao || !permissao.editar) {
      redirect("/dashboard?erro=sem-permissao");
    }
  }

  // ✅ Await params
  const { id } = await params;

  const treino = await prisma.treino.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      alunoId: true,
      objetivo: true,
      observacoes: true,
      ativo: true,
      dataInicio: true,
      dataFim: true,
    },
  });

  if (!treino) {
    redirect("/dashboard/treinos");
  }

  const treinoData = {
    ...treino,
    objetivo: treino.objetivo || "",
    observacoes: treino.observacoes || "",
    dataInicio: treino.dataInicio.toISOString().split("T")[0],
    dataFim: treino.dataFim ? treino.dataFim.toISOString().split("T")[0] : "",
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Editar Treino</h1>
            <p className={styles.subtitle}>
              Atualize as informações do treino <strong>{treino.nome}</strong>
            </p>
          </div>

          <TreinoForm initialData={treinoData} isEdit={true} />
        </div>
      </main>
    </>
  );
}
