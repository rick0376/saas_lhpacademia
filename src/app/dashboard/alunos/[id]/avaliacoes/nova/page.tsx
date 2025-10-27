import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link"; // ✅ Para back link no header
import styles from "./styles.module.scss";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NovaAvaliacaoPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["ADMIN", "SUPERADMIN"].includes((session.user as any).role)
  ) {
    redirect("/dashboard");
  }

  const aluno = await prisma.aluno.findUnique({
    where: { id },
    select: { nome: true },
  });
  if (!aluno) notFound();

  return (
    <div className={styles.container}>
      {/* ✅ Header do projeto: Título, subtítulo, back link */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Nova Avaliação</h1>
          <p className={styles.subtitle}>Preencha os dados para {aluno.nome}</p>
        </div>
        <Link
          href={`/dashboard/alunos/${id}/avaliacoes`}
          className={styles.backLink}
        >
          ← Voltar para Avaliações
        </Link>
      </header>

      <form
        action={async (formData: FormData) => {
          "use server";
          const tipo = formData.get("tipo") as string;
          const observacoes = formData.get("observacoes") as string;
          const dataInput = formData.get("data") as string;

          if (!observacoes || !dataInput)
            throw new Error("Observações e data são obrigatórios");

          const data = new Date(dataInput);

          await prisma.avaliacao.create({
            data: {
              alunoId: id,
              tipo: tipo || null,
              observacoes,
              data,
              arquivo: null,
            },
          });

          redirect("/dashboard/alunos");
        }}
        className={styles.form}
      >
        <div className={styles.field}>
          <label htmlFor="tipo" className={styles.label}>
            Tipo (opcional)
          </label>
          <input
            id="tipo"
            name="tipo"
            type="text"
            placeholder="Ex: Inicial, Mensal"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="observacoes" className={styles.label}>
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            placeholder="Descreva as observações da avaliação..."
            required
            rows={4}
            className={styles.textarea}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="data" className={styles.label}>
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
            className={styles.input}
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Criar Avaliação
        </button>
      </form>
    </div>
  );
}
