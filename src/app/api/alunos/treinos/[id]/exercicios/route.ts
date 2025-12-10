import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: treinoId } = await params;

  try {
    // 1) Sessão obrigatória
    const session = await getServerSession(authOptions);
    const alunoSessionId = (session?.user as any)?.aluno?.id as
      | string
      | undefined;

    if (!session || !alunoSessionId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2) alunoId da query tem que bater com o da sessão
    const alunoIdQuery = request.nextUrl.searchParams.get("alunoId");
    if (!alunoIdQuery || alunoIdQuery !== alunoSessionId) {
      return NextResponse.json(
        { error: "alunoId ausente ou inválido" },
        { status: 400 }
      );
    }

    // 3) Verificar se o treino está atribuído ao aluno (TreinoAluno)
    const atribuicao = await prisma.treinoAluno.findFirst({
      where: {
        treinoId,
        alunoId: alunoSessionId,
        ativo: true,
      },
      select: { id: true },
    });

    if (!atribuicao) {
      return NextResponse.json(
        { error: "Treino não atribuído a este aluno" },
        { status: 403 }
      );
    }

    // 4) Buscar o treino e seus exercícios
    const treino = await prisma.treino.findUnique({
      where: { id: treinoId },
      select: {
        nome: true,
        descricao: true,
        ativo: true,
        exercicios: {
          include: {
            exercicio: {
              select: {
                nome: true,
                descricao: true,
                imagem: true,
              },
            },
          },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!treino || !treino.ativo) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    // 5) Formatar no formato esperado pelo front
    const detalhes = {
      nome: treino.nome,
      descricao: treino.descricao ?? "Sem descrição.",
      exercicios: treino.exercicios.map((ex: any) => ({
        id: ex.id, // ✅ TreinoExercicio.id (o front usa isso)
        nome: ex.exercicio.nome,
        series: ex.series,
        reps: ex.repeticoes,
        carga: ex.carga ?? undefined,
        descanso: ex.descanso ?? "N/A",
        descricao: ex.exercicio.descricao ?? undefined,
        fotoExecucao: ex.exercicio.imagem ?? undefined,
        observacao: ex.observacoes ?? undefined, // ✅ importante (seu front usa ex.observacao)
      })),
    };

    return NextResponse.json(detalhes, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar exercícios do treino:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar exercícios do treino" },
      { status: 500 }
    );
  }
}
