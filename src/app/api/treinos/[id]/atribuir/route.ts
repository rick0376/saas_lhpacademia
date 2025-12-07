import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Atribuir treino a um aluno
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: treinoId } = await params;

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

      if (!permissao || !permissao.editar) {
        return NextResponse.json(
          { error: "Sem permissão para atribuir treinos" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { alunoId, dataInicio, dataFim, ativo } = body;

    if (!alunoId) {
      return NextResponse.json(
        { error: "ID do aluno é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se já existe atribuição
    const existente = await prisma.treinoAluno.findUnique({
      where: {
        treinoId_alunoId: {
          treinoId,
          alunoId,
        },
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Treino já atribuído a este aluno" },
        { status: 400 }
      );
    }

    const atribuicao = await prisma.treinoAluno.create({
      data: {
        treinoId,
        alunoId,
        dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        dataFim: dataFim ? new Date(dataFim) : null,
        ativo: ativo ?? true,
      },
      include: {
        aluno: {
          select: {
            nome: true,
          },
        },
        treino: {
          select: {
            nome: true,
          },
        },
      },
    });

    return NextResponse.json(atribuicao, { status: 201 });
  } catch (error) {
    console.error("Erro ao atribuir treino:", error);
    return NextResponse.json(
      { error: "Erro ao atribuir treino" },
      { status: 500 }
    );
  }
}

// DELETE - Remover atribuição de treino
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: treinoId } = await params;

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

      if (!permissao || !permissao.deletar) {
        return NextResponse.json(
          { error: "Sem permissão para remover atribuições" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");

    if (!alunoId) {
      return NextResponse.json(
        { error: "ID do aluno é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.treinoAluno.delete({
      where: {
        treinoId_alunoId: {
          treinoId,
          alunoId,
        },
      },
    });

    return NextResponse.json(
      { message: "Atribuição removida com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao remover atribuição:", error);
    return NextResponse.json(
      { error: "Erro ao remover atribuição" },
      { status: 500 }
    );
  }
}

// GET - Listar alunos com este treino atribuído
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: treinoId } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const atribuicoes = await prisma.treinoAluno.findMany({
      where: { treinoId },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(atribuicoes);
  } catch (error) {
    console.error("Erro ao buscar atribuições:", error);
    return NextResponse.json(
      { error: "Erro ao buscar atribuições" },
      { status: 500 }
    );
  }
}
