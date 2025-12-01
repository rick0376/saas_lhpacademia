import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Interface auxiliar para tipar o body
interface ExercicioRealizadoInput {
  id: string;
  carga: string | null;
}

// POST - Criar nova execução
export async function POST(
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
    const { intensidade, observacoes, data, exerciciosRealizados } = body;

    const intensidadesValidas = ["LEVE", "MODERADO", "PESADO", "MUITO_PESADO"];
    if (!intensidade || !intensidadesValidas.includes(intensidade)) {
      return NextResponse.json(
        { error: "Intensidade inválida" },
        { status: 400 }
      );
    }

    const dataExecucao = data ? new Date(data) : new Date();
    const totalExercicios = treino.exercicios.length;

    // ✅ CORREÇÃO 1: Tipagem explícita da entrada
    const exerciciosRealizadosArray = (exerciciosRealizados ||
      []) as ExercicioRealizadoInput[];
    const completo = exerciciosRealizadosArray.length === totalExercicios;

    // ✅ CORREÇÃO 2: Tipagem explícita do Map
    const cargasMap = new Map<string, string | null>(
      exerciciosRealizadosArray.map((ex) => [ex.id, ex.carga])
    );

    const exerciciosParaSalvar = treino.exercicios
      .filter((te) => cargasMap.has(te.id))
      .map((te) => {
        const cargaCustomizada = cargasMap.get(te.id);

        // ✅ CORREÇÃO 3: Lógica segura para definir a carga final
        // Se cargaCustomizada não for undefined, usa ela. Senão, usa a do treino. Por fim, null.
        const cargaFinal =
          cargaCustomizada !== undefined ? cargaCustomizada : te.carga;

        return {
          treinoExercicioId: te.id,
          exercicioNome: te.exercicio.nome,
          series: te.series,
          repeticoes: te.repeticoes,
          carga: (cargaFinal || null) as string | null, // Cast explícito para acalmar o TS
          observacoes: te.observacoes || null,
        };
      });

    const execucao = await prisma.execucaoTreino.create({
      data: {
        treinoId,
        alunoId,
        intensidade,
        observacoes: observacoes || null,
        completo,
        data: dataExecucao,
        exercicios: {
          create: exerciciosParaSalvar,
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

    // ✅ CORREÇÃO 4: Cast para 'any' para acessar _count sem erro de tipo
    // O TypeScript às vezes não infere corretamente o retorno do create com include
    const execucaoComCount = execucao as any;

    return NextResponse.json(
      {
        message: "Execução registrada com sucesso!",
        execucao: {
          ...execucao,
          totalExerciciosRealizados: execucaoComCount._count?.exercicios || 0,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const alunoId = (session.user as any).aluno.id;
    const { id: treinoId } = await params;

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
            treinoExercicioId: true,
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

// PUT - Editar execução
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

    // Se não enviou exerciciosRealizadosIds, atualiza só campos básicos
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

      const execucaoAtualizadaAny = execucaoAtualizada as any;

      return NextResponse.json(
        {
          message: "Execução atualizada com sucesso!",
          execucao: {
            ...execucaoAtualizada,
            totalExerciciosRealizados:
              execucaoAtualizadaAny._count?.exercicios || 0,
          },
        },
        { status: 200 }
      );
    }

    // Se enviou exerciciosRealizadosIds, busca treino e atualiza tudo
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

    const execucaoAtualizada = await prisma.$transaction(async (tx) => {
      await tx.execucaoExercicio.deleteMany({
        where: { execucaoTreinoId: execucaoId },
      });

      return await tx.execucaoTreino.update({
        where: { id: execucaoId },
        data: {
          ...(intensidade && { intensidade }),
          ...(observacoes !== undefined && { observacoes }),
          ...(data && { data: new Date(data) }),
          completo,
          exercicios: {
            create: exerciciosParaSalvar.map((te) => ({
              treinoExercicioId: te.id,
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
          exercicios: {
            select: {
              id: true,
              treinoExercicioId: true,
              exercicioNome: true,
              series: true,
              repeticoes: true,
              carga: true,
              observacoes: true,
            },
          },
        },
      });
    });

    const execucaoAtualizadaAny = execucaoAtualizada as any;

    return NextResponse.json(
      {
        message: "Execução atualizada com sucesso!",
        execucao: {
          ...execucaoAtualizada,
          totalExerciciosRealizados:
            execucaoAtualizadaAny._count?.exercicios || 0,
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
