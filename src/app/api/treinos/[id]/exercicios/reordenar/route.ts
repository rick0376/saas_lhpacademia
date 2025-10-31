// app/api/treinos/[id]/exercicios/reordenar/route.ts (CORRIGIDO COM DEBUG)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: treinoId } = await params;
    const body = await req.json();
    const { exercicioId, direcao } = body;

    console.log(
      `🔄 [REORDENAR] Treino: ${treinoId}, Exercício: ${exercicioId}, Direção: ${direcao}`
    );

    // ✅ Busca todos os exercícios do treino
    const todosExercicios = await prisma.treinoExercicio.findMany({
      where: { treinoId },
      orderBy: { ordem: "asc" },
    });

    console.log(`📊 Total de exercícios: ${todosExercicios.length}`);
    console.log(
      "📋 Ordens atuais:",
      todosExercicios.map((e) => `${e.id.slice(0, 8)}:${e.ordem}`).join(", ")
    );

    if (todosExercicios.length === 0) {
      return NextResponse.json(
        { error: "Nenhum exercício encontrado" },
        { status: 404 }
      );
    }

    // ✅ Encontra o índice do exercício
    const indexAtual = todosExercicios.findIndex((e) => e.id === exercicioId);

    console.log(`🎯 Índice do exercício: ${indexAtual}`);

    if (indexAtual === -1) {
      console.error(`❌ Exercício ${exercicioId} NÃO ENCONTRADO!`);
      return NextResponse.json(
        { error: "Exercício não encontrado neste treino" },
        { status: 404 }
      );
    }

    // ✅ Calcula novo índice
    let novoIndex = indexAtual;

    if (direcao === "up" && indexAtual > 0) {
      novoIndex = indexAtual - 1;
    } else if (direcao === "down" && indexAtual < todosExercicios.length - 1) {
      novoIndex = indexAtual + 1;
    } else {
      console.warn(
        `⚠️ Não é possível mover ${direcao}: indexAtual=${indexAtual}, length=${todosExercicios.length}`
      );
      return NextResponse.json(
        { error: "Não é possível mover nesta direção" },
        { status: 400 }
      );
    }

    // ✅ Pega os dois exercícios
    const exercicioAtual = todosExercicios[indexAtual];
    const exercicioDestino = todosExercicios[novoIndex];

    console.log(
      `🔀 Trocando: ${exercicioAtual.id.slice(0, 8)} (${
        exercicioAtual.ordem
      }) ↔ ${exercicioDestino.id.slice(0, 8)} (${exercicioDestino.ordem})`
    );

    // ✅ CORRIGIDO: Usar variáveis temporárias para não haver conflito
    const ordemTemp = 9999; // Valor temporário alto

    await prisma.$transaction([
      // Passo 1: Mover atual para ordem temporária
      prisma.treinoExercicio.update({
        where: { id: exercicioAtual.id },
        data: { ordem: ordemTemp },
      }),
      // Passo 2: Mover destino para ordem do atual
      prisma.treinoExercicio.update({
        where: { id: exercicioDestino.id },
        data: { ordem: exercicioAtual.ordem },
      }),
      // Passo 3: Mover atual (que estava em temp) para ordem do destino
      prisma.treinoExercicio.update({
        where: { id: exercicioAtual.id },
        data: { ordem: exercicioDestino.ordem },
      }),
    ]);

    console.log("✅ Transaction completada");

    // ✅ Retorna treino atualizado
    const treinoAtualizado = await prisma.treino.findUnique({
      where: { id: treinoId },
      include: {
        aluno: true,
        exercicios: {
          include: { exercicio: true },
          orderBy: { ordem: "asc" },
        },
        cronogramas: { orderBy: { diaSemana: "asc" } },
      },
    });

    console.log("✅ Reordenamento concluído com sucesso!");

    return NextResponse.json(treinoAtualizado, { status: 200 });
  } catch (error: any) {
    console.error("❌ ERRO CRÍTICO:", error.message);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Erro ao reordenar exercícios: " + error.message },
      { status: 500 }
    );
  }
}
