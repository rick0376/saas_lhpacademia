import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const whereClause: any = {};

    if (session.user.role !== "SUPERADMIN") {
      whereClause.clienteId = session.user.clienteId;
    }

    // Estatísticas gerais
    const [
      totalAlunos,
      alunosAtivos,
      totalTreinos,
      treinosAtivos,
      totalExercicios,
      execucoesUltimos7Dias,
      ultimasMedidas,
      ultimasExecucoes,
    ] = await Promise.all([
      // Total de alunos
      prisma.aluno.count({ where: whereClause }),

      // Alunos ativos
      prisma.aluno.count({ where: { ...whereClause, ativo: true } }),

      // Total de treinos
      prisma.treino.count({
        where: {
          aluno: whereClause.clienteId
            ? { clienteId: whereClause.clienteId }
            : {},
        },
      }),

      // Treinos ativos
      prisma.treino.count({
        where: {
          ativo: true,
          aluno: whereClause.clienteId
            ? { clienteId: whereClause.clienteId }
            : {},
        },
      }),

      // Total de exercícios
      prisma.exercicio.count({ where: whereClause }),

      // Execuções últimos 7 dias
      prisma.execucaoTreino.count({
        where: {
          data: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          treino: {
            aluno: whereClause.clienteId
              ? { clienteId: whereClause.clienteId }
              : {},
          },
        },
      }),

      // Últimas medidas
      prisma.medida.findMany({
        take: 5,
        orderBy: { data: "desc" },
        where: {
          aluno: whereClause,
        },
        include: {
          aluno: {
            select: {
              nome: true,
            },
          },
        },
      }),

      // Últimas execuções
      prisma.execucaoTreino.findMany({
        take: 5,
        orderBy: { data: "desc" },
        where: {
          treino: {
            aluno: whereClause.clienteId
              ? { clienteId: whereClause.clienteId }
              : {},
          },
        },
        include: {
          treino: {
            include: {
              aluno: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totais: {
        alunos: totalAlunos,
        alunosAtivos,
        treinos: totalTreinos,
        treinosAtivos,
        exercicios: totalExercicios,
      },
      atividade: {
        execucoesUltimos7Dias,
      },
      recentes: {
        medidas: ultimasMedidas,
        execucoes: ultimasExecucoes,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
