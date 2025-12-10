// app/api/alunos/dashboard/route.ts (COMPLETO E OTIMIZADO)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");
    if (!alunoId || alunoId !== (session.user as any).aluno.id) {
      return NextResponse.json(
        { error: "Missing or invalid alunoId" },
        { status: 400 }
      );
    }

    // ========================================
    // ✅ OTIMIZAÇÃO: UMA TRANSACTION COM TUDO
    // ========================================
    const [
      aluno,
      treinosCount,
      ultimaMedida,
      avaliacoesCount,
      ultimasExecucoes,
      proximoTreino,
    ] = await prisma.$transaction([
      // 1. Basic aluno data
      prisma.aluno.findUnique({
        where: { id: alunoId },
        select: {
          id: true,
          nome: true,
          foto: true,
          objetivo: true,
        },
      }),

      // 2. Treinos count (apenas ativos)
      prisma.treinoAluno.count({
        where: {
          alunoId: alunoId,
          ativo: true,
        },
      }),

      // 3. Última medida
      prisma.medida.findFirst({
        where: { alunoId: alunoId },
        orderBy: { data: "desc" },
        select: {
          peso: true,
        },
      }),

      // 4. Avaliações count
      prisma.avaliacao.count({
        where: { alunoId: alunoId },
      }),

      // 5. Últimas execuções com exercícios
      prisma.execucaoTreino.findMany({
        where: {
          alunoId: alunoId,
        },
        include: {
          treino: {
            select: {
              id: true,
              nome: true,
              objetivo: true,
            },
          },
          exercicios: true,
        },
        orderBy: { data: "desc" },
        take: 10,
      }),

      // 6. Próximo treino agendado (NOVO)
      prisma.cronograma.findFirst({
        where: {
          treino: {
            alunoId: alunoId,
            ativo: true,
          },
        },
        select: {
          diaSemana: true,
          horaInicio: true,
          horaFim: true,
          treino: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    if (!aluno) {
      return NextResponse.json({ error: "Aluno not found" }, { status: 404 });
    }

    // ✅ Formata as execuções baseado no schema real
    const execucoesFormatadas = ultimasExecucoes.map((exec) => ({
      id: exec.id,
      data: exec.data,
      intensidade: exec.intensidade,
      observacoes: exec.observacoes,
      completo: exec.completo,
      treino: {
        id: exec.treino.id,
        nome: exec.treino.nome,
        objetivo: exec.treino.objetivo,
      },
      exerciciosCompletados: exec.exercicios.length,
      exercicios: exec.exercicios.map((e) => ({
        nome: e.exercicioNome,
        series: e.series,
        repeticoes: e.repeticoes,
        carga: e.carga,
        observacoes: e.observacoes,
      })),
    }));

    // ✅ Formata próximo treino
    const proximoTreinoFormatado = proximoTreino
      ? {
          data: `${proximoTreino.diaSemana}${
            proximoTreino.horaInicio
              ? ` - ${proximoTreino.horaInicio}${
                  proximoTreino.horaFim ? ` a ${proximoTreino.horaFim}` : ""
                }`
              : ""
          }`,
          diaSemana: proximoTreino.diaSemana,
          horaInicio: proximoTreino.horaInicio,
          horaFim: proximoTreino.horaFim,
          treino: proximoTreino.treino,
        }
      : null;

    const data = {
      id: aluno.id,
      nome: aluno.nome,
      foto: aluno.foto,
      objetivo: aluno.objetivo,
      treinosAtivos: treinosCount,
      ultimaMedida: ultimaMedida ? { peso: ultimaMedida.peso } : null,
      avaliacoes: avaliacoesCount,
      proximoTreino: proximoTreinoFormatado,
      ultimasExecucoes: execucoesFormatadas,
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
