import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const treino = await prisma.treino.findUnique({
      where: { id },
      include: {
        aluno: true,
        exercicios: {
          include: { exercicio: true },
          orderBy: { ordem: "asc" },
        },
        cronogramas: {
          orderBy: { diaSemana: "asc" },
        },
      },
    });

    if (!treino) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(treino);
  } catch (error) {
    console.error("Erro ao buscar treino:", error);
    return NextResponse.json(
      { error: "Erro ao buscar treino" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome, objetivo, observacoes, ativo, dataFim } = body;
    const { id } = await params;

    const treinoAtualizado = await prisma.treino.update({
      where: { id },
      data: {
        nome,
        objetivo: objetivo || null,
        observacoes: observacoes || null,
        ativo,
        dataFim: dataFim ? new Date(dataFim) : null,
      },
    });

    return NextResponse.json(treinoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar treino:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar treino" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.treino.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Treino excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir treino:", error);
    return NextResponse.json(
      { error: "Erro ao excluir treino" },
      { status: 500 }
    );
  }
}
