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

    // ✅ ATUALIZADO: Buscar treinos atribuídos via TreinoAluno OU treinos diretos (legado)
    const [treinosAtribuidos, treinosDiretos] = await Promise.all([
      // Treinos atribuídos via TreinoAluno (novo sistema)
      prisma.treinoAluno.findMany({
        where: {
          alunoId: alunoId,
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
        orderBy: { dataInicio: "desc" },
      }),

      // Treinos com alunoId direto (sistema legado - compatibilidade)
      prisma.treino.findMany({
        where: {
          alunoId: alunoId,
          ativo: true,
        },
        orderBy: { dataInicio: "desc" },
        select: {
          id: true,
          nome: true,
          descricao: true,
          ativo: true,
          dataInicio: true,
        },
      }),
    ]);

    // Combinar ambos e remover duplicatas
    const treinosMap = new Map();

    // Adicionar treinos atribuídos
    treinosAtribuidos.forEach((atrib) => {
      if (atrib.treino.ativo) {
        treinosMap.set(atrib.treino.id, atrib.treino);
      }
    });

    // Adicionar treinos diretos (legado)
    treinosDiretos.forEach((treino) => {
      if (!treinosMap.has(treino.id)) {
        treinosMap.set(treino.id, treino);
      }
    });

    const treinos = Array.from(treinosMap.values());

    return NextResponse.json(treinos);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
