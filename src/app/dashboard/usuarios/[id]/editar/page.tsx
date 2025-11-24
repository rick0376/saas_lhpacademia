import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserForm } from "@/components/usuarios/UserForm";
import { prisma } from "@/lib/prisma";
import styles from "./styles.module.scss";

interface Props {
  params: Promise<{ id: string }>; // ✅ Next.js 15: Params como Promise (resolve type error no build)
}

export default async function EditarUsuarioPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // ✅ Await params (adicionado para acessar id corretamente)
  const { id } = await params;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      telefone: true,
      dataNascimento: true,
      objetivo: true,
    },
  });

  if (!usuario) {
    redirect("/dashboard/usuarios");
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Editar Usuário</h1>
            <p className={styles.subtitle}>
              Atualize os dados do usuário <strong>{usuario.nome}</strong>
            </p>
          </div>

          <UserForm
            initialData={{
              ...usuario,
              dataNascimento: usuario.dataNascimento
                ?.toISOString()
                .split("T")[0],
            }}
            isEdit={true}
          />
        </div>
      </main>
    </>
  );
}
