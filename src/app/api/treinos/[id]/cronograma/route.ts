import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar cronograma do treino
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

    const cronogramas = await prisma.cronograma.findMany({
      where: { treinoId: id },
      orderBy: { diaSemana: "asc" },
    });

    return NextResponse.json(cronogramas);
  } catch (error) {
    console.error("Erro ao buscar cronograma:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cronograma" },
      { status: 500 }
    );
  }
}

// POST - Adicionar dia ao cronograma
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
    const { diaSemana, horaInicio, horaFim } = body;

    if (!diaSemana) {
      return NextResponse.json(
        { error: "Dia da semana é obrigatório" },
        { status: 400 }
      );
    }

    // ✅ Await params
    const { id } = await params;

    // Verificar se já existe cronograma para este dia
    const existente = await prisma.cronograma.findUnique({
      where: {
        treinoId_diaSemana: {
          treinoId: id,
          diaSemana,
        },
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Já existe um treino para este dia" },
        { status: 400 }
      );
    }

    const cronograma = await prisma.cronograma.create({
      data: {
        treinoId: id,
        diaSemana,
        horaInicio: horaInicio || null,
        horaFim: horaFim || null,
      },
    });

    return NextResponse.json(cronograma, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar cronograma:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar cronograma" },
      { status: 500 }
    );
  }
}

// DELETE - Remover dia do cronograma
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cronogramaId = searchParams.get("cronogramaId");

    if (!cronogramaId) {
      return NextResponse.json(
        { error: "ID do cronograma é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.cronograma.delete({
      where: { id: cronogramaId },
    });

    return NextResponse.json({ message: "Dia removido do cronograma" });
  } catch (error) {
    console.error("Erro ao remover cronograma:", error);
    return NextResponse.json(
      { error: "Erro ao remover cronograma" },
      { status: 500 }
    );
  }
}
