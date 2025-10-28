import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Criar nova execução COM exercícios realizados
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ MUDOU
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const alunoId = (session.user as any).aluno.id;
    const { id: treinoId } = await params; // ✅ AWAIT PARAMS

    // Valida se o treino existe e pertence ao aluno
    const treino = await prisma.treino.findFirst({
      where: {
        id: treinoId,
        alunoId: alunoId,
      },
      include: {
        exercicios: {
          include: {
            exercicio: true,
          },
          orderBy: {
            ordem: "asc",
          },
        },
      },
    });

    if (!treino) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { intensidade, observacoes, data, exerciciosRealizadosIds } = body;

    console.log("📋 IDs recebidos:", exerciciosRealizadosIds); // ✅ DEBUG

    const intensidadesValidas = ["LEVE", "MODERADO", "PESADO", "MUITO_PESADO"];
    if (!intensidade || !intensidadesValidas.includes(intensidade)) {
      return NextResponse.json(
        { error: "Intensidade inválida" },
        { status: 400 }
      );
    }

    const dataExecucao = data ? new Date(data) : new Date();

    const totalExercicios = treino.exercicios.length;
    const exerciciosRealizados = exerciciosRealizadosIds || [];
    const completo = exerciciosRealizados.length === totalExercicios;

    // ✅ FILTRA POR ID DO EXERCÍCIO (não do TreinoExercicio)
    const exerciciosParaSalvar = treino.exercicios.filter(
      (te) => exerciciosRealizados.includes(te.id) // ✅ USA te.id (TreinoExercicio.id)
    );

    console.log("✅ Exercícios a salvar:", exerciciosParaSalvar.length); // ✅ DEBUG

    const execucao = await prisma.execucaoTreino.create({
      data: {
        treinoId,
        alunoId,
        intensidade,
        observacoes: observacoes || null,
        completo,
        data: dataExecucao,
        exercicios: {
          create: exerciciosParaSalvar.map((te) => ({
            exercicioNome: te.exercicio.nome,
            series: te.series,
            repeticoes: te.repeticoes,
            carga: te.carga || null,
            observacoes: te.observacoes || null,
          })),
        },
      },
      include: {
        exercicios: true,
        _count: {
          select: {
            exercicios: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Execução registrada com sucesso!",
        execucao: {
          ...execucao,
          totalExerciciosRealizados: execucao._count.exercicios,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erro ao registrar execução:", error);
    return NextResponse.json(
      { error: "Erro ao registrar execução" },
      { status: 500 }
    );
  }
}

// GET - Buscar histórico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ MUDOU
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const alunoId = (session.user as any).aluno.id;
    const { id: treinoId } = await params; // ✅ AWAIT PARAMS

    const execucoes = await prisma.execucaoTreino.findMany({
      where: {
        treinoId,
        alunoId,
      },
      orderBy: {
        data: "desc",
      },
      select: {
        id: true,
        intensidade: true,
        observacoes: true,
        data: true,
        completo: true,
        _count: {
          select: {
            exercicios: true,
          },
        },
        exercicios: {
          select: {
            id: true,
            exercicioNome: true,
            series: true,
            repeticoes: true,
            carga: true,
            observacoes: true,
          },
        },
      },
    });

    const execucoesFormatadas = execucoes.map((exec) => ({
      id: exec.id,
      intensidade: exec.intensidade,
      observacoes: exec.observacoes,
      data: exec.data,
      completo: exec.completo,
      totalExerciciosRealizados: exec._count.exercicios,
      exercicios: exec.exercicios,
    }));

    return NextResponse.json(execucoesFormatadas, { status: 200 });
  } catch (error) {
    console.error("❌ Erro ao buscar execuções:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}

// PUT - Editar execução E exercícios realizados (OTIMIZADO)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const alunoId = (session.user as any).aluno.id;
    const { id: treinoId } = await params;

    const body = await req.json();
    const {
      execucaoId,
      intensidade,
      observacoes,
      data,
      exerciciosRealizadosIds,
    } = body;

    if (!execucaoId) {
      return NextResponse.json(
        { error: "ID da execução é obrigatório" },
        { status: 400 }
      );
    }

    const execucaoExistente = await prisma.execucaoTreino.findFirst({
      where: {
        id: execucaoId,
        treinoId,
        alunoId,
      },
    });

    if (!execucaoExistente) {
      return NextResponse.json(
        { error: "Execução não encontrada" },
        { status: 404 }
      );
    }

    const intensidadesValidas = ["LEVE", "MODERADO", "PESADO", "MUITO_PESADO"];
    if (intensidade && !intensidadesValidas.includes(intensidade)) {
      return NextResponse.json(
        { error: "Intensidade inválida" },
        { status: 400 }
      );
    }

    // ✅ SE NÃO ENVIOU exerciciosRealizadosIds, atualiza só os campos básicos
    if (exerciciosRealizadosIds === undefined) {
      const execucaoAtualizada = await prisma.execucaoTreino.update({
        where: { id: execucaoId },
        data: {
          ...(intensidade && { intensidade }),
          ...(observacoes !== undefined && { observacoes }),
          ...(data && { data: new Date(data) }),
        },
        include: {
          _count: {
            select: {
              exercicios: true,
            },
          },
          exercicios: true,
        },
      });

      return NextResponse.json(
        {
          message: "Execução atualizada com sucesso!",
          execucao: {
            ...execucaoAtualizada,
            totalExerciciosRealizados: execucaoAtualizada._count.exercicios,
          },
        },
        { status: 200 }
      );
    }

    // ✅ SE ENVIOU exerciciosRealizadosIds, busca treino e atualiza tudo
    const treino = await prisma.treino.findFirst({
      where: { id: treinoId, alunoId },
      include: {
        exercicios: {
          include: { exercicio: true },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!treino) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    const totalExercicios = treino.exercicios.length;
    const completo = exerciciosRealizadosIds.length === totalExercicios;

    const exerciciosParaSalvar = treino.exercicios.filter((te) =>
      exerciciosRealizadosIds.includes(te.id)
    );

    // ✅ USA TRANSACTION PARA SER MAIS RÁPIDO
    const execucaoAtualizada = await prisma.$transaction(async (tx) => {
      // Deleta exercícios antigos
      await tx.execucaoExercicio.deleteMany({
        where: { execucaoTreinoId: execucaoId },
      });

      // Atualiza execução e cria novos exercícios
      return await tx.execucaoTreino.update({
        where: { id: execucaoId },
        data: {
          ...(intensidade && { intensidade }),
          ...(observacoes !== undefined && { observacoes }),
          ...(data && { data: new Date(data) }),
          completo,
          exercicios: {
            create: exerciciosParaSalvar.map((te) => ({
              exercicioNome: te.exercicio.nome,
              series: te.series,
              repeticoes: te.repeticoes,
              carga: te.carga || null,
              observacoes: te.observacoes || null,
            })),
          },
        },
        include: {
          _count: {
            select: {
              exercicios: true,
            },
          },
          exercicios: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Execução atualizada com sucesso!",
        execucao: {
          ...execucaoAtualizada,
          totalExerciciosRealizados: execucaoAtualizada._count.exercicios,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao atualizar execução:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar execução" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const alunoId = (session.user as any).aluno.id;

    const { searchParams } = new URL(req.url);
    const execucaoId = searchParams.get("execucaoId");

    if (!execucaoId) {
      return NextResponse.json(
        { error: "ID da execução é obrigatório" },
        { status: 400 }
      );
    }

    const execucao = await prisma.execucaoTreino.findFirst({
      where: {
        id: execucaoId,
        alunoId,
      },
    });

    if (!execucao) {
      return NextResponse.json(
        { error: "Execução não encontrada" },
        { status: 404 }
      );
    }

    await prisma.execucaoTreino.delete({
      where: {
        id: execucaoId,
      },
    });

    return NextResponse.json(
      { message: "Execução deletada com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao deletar execução:", error);
    return NextResponse.json(
      { error: "Erro ao deletar execução" },
      { status: 500 }
    );
  }
}
