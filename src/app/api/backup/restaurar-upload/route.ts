import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // ✅ Permitir até 60 segundos (Vercel/Next.js)

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".json")) {
      return NextResponse.json(
        { error: "Apenas arquivos .json são permitidos" },
        { status: 400 }
      );
    }

    // Ler conteúdo do arquivo
    const fileContent = await file.text();
    const backupData = JSON.parse(fileContent);

    if (!backupData.data) {
      return NextResponse.json(
        { error: "Formato de backup inválido" },
        { status: 400 }
      );
    }

    // ✅ AUMENTAR TIMEOUT DA TRANSAÇÃO
    await prisma.$transaction(
      async (tx) => {
        // 1. Deletar tudo (ordem inversa das dependências)
        await tx.execucaoExercicio.deleteMany();
        await tx.execucaoTreino.deleteMany();
        await tx.cronograma.deleteMany();
        await tx.treinoExercicio.deleteMany();
        await tx.treino.deleteMany();
        await tx.exercicio.deleteMany();
        await tx.avaliacao.deleteMany();
        await tx.medida.deleteMany();
        await tx.aluno.deleteMany();
        await tx.permissao.deleteMany();
        await tx.usuario.deleteMany();
        await tx.cliente.deleteMany();

        // 2. Restaurar dados (ordem correta)
        if (backupData.data.clientes?.length > 0) {
          await tx.cliente.createMany({ data: backupData.data.clientes });
        }

        if (backupData.data.usuarios?.length > 0) {
          await tx.usuario.createMany({ data: backupData.data.usuarios });
        }

        if (backupData.data.permissoes?.length > 0) {
          await tx.permissao.createMany({ data: backupData.data.permissoes });
        }

        if (backupData.data.alunos?.length > 0) {
          await tx.aluno.createMany({ data: backupData.data.alunos });
        }

        if (backupData.data.medidas?.length > 0) {
          await tx.medida.createMany({ data: backupData.data.medidas });
        }

        if (backupData.data.avaliacoes?.length > 0) {
          await tx.avaliacao.createMany({ data: backupData.data.avaliacoes });
        }

        if (backupData.data.exercicios?.length > 0) {
          await tx.exercicio.createMany({ data: backupData.data.exercicios });
        }

        if (backupData.data.treinos?.length > 0) {
          await tx.treino.createMany({ data: backupData.data.treinos });
        }

        if (backupData.data.treinoExercicios?.length > 0) {
          await tx.treinoExercicio.createMany({
            data: backupData.data.treinoExercicios,
          });
        }

        if (backupData.data.cronogramas?.length > 0) {
          await tx.cronograma.createMany({ data: backupData.data.cronogramas });
        }

        if (backupData.data.execucoesTreino?.length > 0) {
          await tx.execucaoTreino.createMany({
            data: backupData.data.execucoesTreino,
          });
        }

        if (backupData.data.execucoesExercicio?.length > 0) {
          await tx.execucaoExercicio.createMany({
            data: backupData.data.execucoesExercicio,
          });
        }
      },
      {
        maxWait: 30000, // ✅ Espera máxima: 30 segundos
        timeout: 60000, // ✅ Timeout da transação: 60 segundos
      }
    );

    return NextResponse.json({
      success: true,
      message: "Backup restaurado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao restaurar backup:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao restaurar backup" },
      { status: 500 }
    );
  }
}
