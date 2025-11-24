import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // PASSO 1: VALIDAR SESSÃO (NextAuth)
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // PASSO 2: PEGAR alunoId (via query param)
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");

    if (!alunoId) {
      return NextResponse.json(
        { error: "alunoId é obrigatório" },
        { status: 400 }
      );
    }

    // PASSO 3: VERIFICAR SEGURANÇA (aluno só vê seu próprio calendário)
    const sessionAlunoId = (session.user as any).aluno?.id;

    if (sessionAlunoId !== alunoId) {
      console.warn(`⚠️ Tentativa de acesso não autorizado pelo aluno`);
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este calendário" },
        { status: 403 }
      );
    }

    // PASSO 4: BUSCAR CRONOGRAMAS DO ALUNO
    const cronogramas = await prisma.cronograma.findMany({
      where: {
        treino: {
          alunoId: alunoId,
          ativo: true,
        },
      },
      include: {
        treino: {
          select: {
            id: true,
            nome: true,
            objetivo: true,
            descricao: true,
            ativo: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
      orderBy: [
        {
          treino: {
            dataInicio: "desc",
          },
        },
      ],
    });

    // Nenhum log sensível aqui.

    // PASSO 5: TRANSFORMAR DADOS PARA O FRONTEND
    const response = cronogramas.map((crono) => ({
      id: crono.id,
      diaSemana: crono.diaSemana,
      horaInicio: crono.horaInicio,
      horaFim: crono.horaFim,
      treino: {
        id: crono.treino.id,
        nome: crono.treino.nome,
        objetivo: crono.treino.objetivo,
        descricao: crono.treino.descricao,
        ativo: crono.treino.ativo,
        dataInicio: crono.treino.dataInicio,
        dataFim: crono.treino.dataFim,
      },
    }));

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, no-cache",
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar calendário:", error.message);
    return NextResponse.json(
      { error: "Erro ao buscar calendário: " + error.message },
      { status: 500 }
    );
  }
}
