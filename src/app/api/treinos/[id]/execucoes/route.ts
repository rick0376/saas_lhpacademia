import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar execuções do treino
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

    const execucoes = await prisma.execucaoTreino.findMany({
      where: { treinoId: id },
      include: {
        exercicios: true,
      },
      orderBy: { data: "desc" },
    });

    return NextResponse.json(execucoes);
  } catch (error) {
    console.error("Erro ao buscar execuções:", error);
    return NextResponse.json(
      { error: "Erro ao buscar execuções" },
      { status: 500 }
    );
  }
}

// POST - Registrar execução de treino
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { observacoes, completo, exercicios, intensidade, alunoId } = body; // ✅ ADICIONADO

    const { id } = await params;

    // ✅ Valida intensidade
    const intensidadesValidas = ["LEVE", "MODERADO", "PESADO", "MUITO_PESADO"];
    if (!intensidade || !intensidadesValidas.includes(intensidade)) {
      return NextResponse.json(
        {
          error:
            "Intensidade inválida. Use: LEVE, MODERADO, PESADO ou MUITO_PESADO",
        },
        { status: 400 }
      );
    }

    // ✅ Valida alunoId
    if (!alunoId) {
      return NextResponse.json(
        { error: "alunoId é obrigatório" },
        { status: 400 }
      );
    }

    // Criar execução do treino
    const execucao = await prisma.execucaoTreino.create({
      data: {
        treinoId: id,
        alunoId, // ✅ ADICIONADO
        intensidade, // ✅ ADICIONADO
        observacoes: observacoes || null,
        completo: completo ?? false,
        exercicios: {
          create: exercicios || [],
        },
      },
      include: {
        exercicios: true,
      },
    });

    return NextResponse.json(execucao, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar execução:", error);
    return NextResponse.json(
      { error: "Erro ao registrar execução" },
      { status: 500 }
    );
  }
}
