import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Reordenar exercícios
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

    // Busca o exercício atual
    const exercicioAtual = await prisma.treinoExercicio.findUnique({
      where: { id: exercicioId },
    });

    if (!exercicioAtual) {
      return NextResponse.json(
        { error: "Exercício não encontrado" },
        { status: 404 }
      );
    }

    const ordemAtual = exercicioAtual.ordem;
    const novaOrdem = direcao === "up" ? ordemAtual - 1 : ordemAtual + 1;

    // Busca o exercício que está na posição de destino
    const exercicioDestino = await prisma.treinoExercicio.findFirst({
      where: {
        treinoId,
        ordem: novaOrdem,
      },
    });

    if (!exercicioDestino) {
      return NextResponse.json(
        { error: "Não é possível mover nesta direção" },
        { status: 400 }
      );
    }

    // Troca as ordens usando uma transação
    await prisma.$transaction([
      // Move o exercício de destino para ordem temporária
      prisma.treinoExercicio.update({
        where: { id: exercicioDestino.id },
        data: { ordem: -1 },
      }),
      // Move o exercício atual para a nova ordem
      prisma.treinoExercicio.update({
        where: { id: exercicioAtual.id },
        data: { ordem: novaOrdem },
      }),
      // Move o exercício de destino para a ordem antiga
      prisma.treinoExercicio.update({
        where: { id: exercicioDestino.id },
        data: { ordem: ordemAtual },
      }),
    ]);

    return NextResponse.json({ message: "Ordem atualizada" }, { status: 200 });
  } catch (error) {
    console.error("Erro ao reordenar:", error);
    return NextResponse.json(
      { error: "Erro ao reordenar exercícios" },
      { status: 500 }
    );
  }
}
