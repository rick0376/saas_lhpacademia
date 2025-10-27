import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");

    if (!alunoId) {
      return NextResponse.json(
        { error: "alunoId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca treinos ativos do aluno com seus cronogramas
    const treinos = await prisma.treino.findMany({
      where: {
        alunoId,
        ativo: true,
      },
      include: {
        cronogramas: {
          orderBy: {
            diaSemana: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formata resposta agrupando por dia da semana
    const calendario = treinos.flatMap((treino: any) =>
      treino.cronogramas.map((cronograma: any) => ({
        id: cronograma.id,
        treinoId: treino.id,
        treinoNome: treino.nome,
        treinoObjetivo: treino.objetivo,
        diaSemana: cronograma.diaSemana,
        horaInicio: cronograma.horaInicio,
        horaFim: cronograma.horaFim,
      }))
    );

    return NextResponse.json(calendario);
  } catch (error) {
    console.error("❌ Erro ao buscar calendário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar calendário" },
      { status: 500 }
    );
  }
}
