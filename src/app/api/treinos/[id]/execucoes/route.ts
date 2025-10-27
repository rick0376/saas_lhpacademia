import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar execuções do treino
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // ✅ Await params
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
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { observacoes, completo, exercicios } = body;

    // ✅ Await params
    const { id } = await params;

    // Criar execução do treino
    const execucao = await prisma.execucaoTreino.create({
      data: {
        treinoId: id,
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
