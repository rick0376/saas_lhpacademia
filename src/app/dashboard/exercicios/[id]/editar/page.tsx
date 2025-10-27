import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExercicioForm } from "@/components/exercicios/ExercicioForm";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{ id: string }>; // ✅ Promise
}

export default async function EditarExercicioPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ✅ Await params
  const { id } = await params;

  const exercicio = await prisma.exercicio.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      grupoMuscular: true,
      descricao: true,
      video: true,
      imagem: true,
      equipamento: true,
    },
  });

  if (!exercicio) {
    redirect("/dashboard/exercicios");
  }

  const exercicioData = {
    ...exercicio,
    descricao: exercicio.descricao || "",
    video: exercicio.video || "",
    imagem: exercicio.imagem || "",
    equipamento: exercicio.equipamento || "",
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Editar Exercício</h1>
            <p className={styles.subtitle}>
              Atualize os dados do exercício <strong>{exercicio.nome}</strong>
            </p>
          </div>

          <ExercicioForm initialData={exercicioData} isEdit={true} />
        </div>
      </main>
    </>
  );
}
