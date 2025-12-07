import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar treinos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar permissão de ler treinos (se não for SUPERADMIN)
    if (session.user.role !== "SUPERADMIN") {
      const permissao = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "treinos",
          },
        },
      });

      if (!permissao || !permissao.ler) {
        return NextResponse.json(
          { error: "Sem permissão para listar treinos" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");

    const whereClause: any = {};

    if (alunoId) {
      whereClause.alunoId = alunoId;
    }

    const treinos = await prisma.treino.findMany({
      where: whereClause,
      include: {
        aluno: {
          select: {
            nome: true,
          },
        },
        _count: {
          select: {
            exercicios: true,
            cronogramas: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(treinos);
  } catch (error) {
    console.error("Erro ao buscar treinos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar treinos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo treino
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar permissão
    if (session.user.role !== "SUPERADMIN") {
      const permissao = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "treinos",
          },
        },
      });

      if (!permissao || !permissao.criar) {
        return NextResponse.json(
          { error: "Sem permissão para criar treinos" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { nome, alunoId, objetivo, observacoes, ativo, dataInicio, dataFim } =
      body;

    if (!nome || nome.trim().length < 3) {
      return NextResponse.json(
        { error: "Nome é obrigatório (mín. 3 caracteres)" },
        { status: 400 }
      );
    }

    const novoTreino = await prisma.treino.create({
      data: {
        nome,
        alunoId: alunoId || null, // ✅ OPCIONAL
        objetivo: objetivo || null,
        observacoes: observacoes || null,
        ativo: ativo ?? true,
        dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        dataFim: dataFim ? new Date(dataFim) : null,
      },
      include: {
        aluno: alunoId
          ? {
              select: {
                nome: true,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(novoTreino, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar treino:", error);
    return NextResponse.json(
      { error: "Erro ao criar treino" },
      { status: 500 }
    );
  }
}
