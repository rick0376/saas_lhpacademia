import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // ✅ Use a instância global

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any)?.aluno?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");
    if (!alunoId || alunoId !== (session.user as any).aluno.id) {
      return NextResponse.json(
        { error: "Missing or invalid alunoId" },
        { status: 400 }
      );
    }

    // ============================
    // ✅ Buscar SOMENTE treinos via TreinoAluno
    // ============================
    const treinosAtribuidos = await prisma.treinoAluno.findMany({
      where: {
        alunoId,
        ativo: true,
      },
      include: {
        treino: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            ativo: true,
            dataInicio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ============================
    // ✅ Formatar resposta final
    // ============================
    const treinos = treinosAtribuidos.map((atr) => ({
      id: atr.treino.id,
      nome: atr.treino.nome,
      descricao: atr.treino.descricao,
      ativo: atr.treino.ativo,
      dataInicioTreino: atr.treino.dataInicio,
      dataInicioAtribuicao: atr.dataInicio,
      dataFimAtribuicao: atr.dataFim,
    }));

    return NextResponse.json(treinos);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
