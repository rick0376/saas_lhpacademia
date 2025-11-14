import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ajuste o caminho conforme necessário

// Função GET assíncrona
export async function GET(
  request: Request,
  { params }: { params: { id: string; avaliacaoId: string } }
) {
  // Aguardar o `params` corretamente
  const { id, avaliacaoId } = params;

  // Verificar se os parâmetros foram passados corretamente
  if (!id || !avaliacaoId) {
    return NextResponse.json(
      { error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  try {
    // Buscar a avaliação com base nos parâmetros fornecidos
    const avaliacao = await prisma.avaliacao.findUnique({
      where: {
        id: avaliacaoId, // O ID da avaliação
      },
      include: {
        aluno: true, // Incluir o aluno para validar se a avaliação pertence ao aluno
      },
    });

    // Caso a avaliação não seja encontrada
    if (!avaliacao) {
      return NextResponse.json(
        { error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a avaliação pertence ao aluno correto
    if (avaliacao.aluno.id !== id) {
      return NextResponse.json(
        { error: "A avaliação não pertence a este aluno" },
        { status: 403 }
      );
    }

    // Retornar a avaliação encontrada
    return NextResponse.json(avaliacao);
  } catch (error) {
    // Caso ocorra algum erro
    return NextResponse.json(
      { error: "Erro ao buscar a avaliação" },
      { status: 500 }
    );
  }
}
