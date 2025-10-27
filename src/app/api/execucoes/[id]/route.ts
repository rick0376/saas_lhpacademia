import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Ajuste o caminho do auth.ts
import { prisma } from "@/lib/prisma"; // Ajuste o caminho do Prisma

// ✅ GET (busca ExecucaoTreino por ID + detalhes de exercícios)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15: Params como Promise
) {
  try {
    const params = await context.params; // Await resolve Promise
    const id = params.id;

    // Verifica sessão (ex: só admin ou aluno dono)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    }

    // Busca ExecucaoTreino (model correto do schema)
    const execucaoTreino = await prisma.execucaoTreino.findUnique({
      where: { id },
      include: {
        treino: true, // Relacionamento com Treino
        exercicios: {
          // Array de ExecucaoExercicio (detalhes)
          orderBy: { createdAt: "asc" }, // Ordem dos exercícios
        },
      },
    });

    if (!execucaoTreino) {
      return NextResponse.json(
        { error: "Execução de treino não encontrada." },
        { status: 404 }
      );
    }

    // Verifica permissão (ex: aluno dono ou admin)
    if (
      session.user.role === "USER" &&
      execucaoTreino.treino.alunoId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Acesso negado ao treino." },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: execucaoTreino }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro GET /api/execucoes/[id]:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ✅ DELETE (deleta ExecucaoTreino + exercícios filhos via cascade)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15: Params como Promise
) {
  try {
    const params = await context.params; // Await resolve Promise
    const id = params.id;

    // Verifica sessão (ex: só admin ou aluno dono)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    }

    // Busca para verificar existência e permissão
    const execucaoTreino = await prisma.execucaoTreino.findUnique({
      where: { id },
      include: { treino: true },
    });

    if (!execucaoTreino) {
      return NextResponse.json(
        { error: "Execução não encontrada." },
        { status: 404 }
      );
    }

    // Deleta ExecucaoTreino (cascade deleta ExecucaoExercicio[] automaticamente)
    const deleted = await prisma.execucaoTreino.delete({
      where: { id },
    });

    console.log(
      "✅ Execução de treino deletada:",
      id,
      "- Exercícios filhos também."
    );

    return NextResponse.json(
      { data: deleted, message: "Execução deletada com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro DELETE /api/execucoes/[id]:", error);
    return NextResponse.json({ error: "Erro ao deletar." }, { status: 500 });
  }
}
