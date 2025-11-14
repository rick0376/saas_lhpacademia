import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; avaliacaoId: string }> }
) {
  const { id, avaliacaoId } = await context.params;

  if (!id || !avaliacaoId) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: { aluno: true },
    });

    if (!avaliacao) {
      return NextResponse.json(
        { error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    if (avaliacao.aluno.id !== id) {
      return NextResponse.json(
        { error: "A avaliação não pertence a este aluno" },
        { status: 403 }
      );
    }

    return NextResponse.json(avaliacao);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar a avaliação" },
      { status: 500 }
    );
  }
}
