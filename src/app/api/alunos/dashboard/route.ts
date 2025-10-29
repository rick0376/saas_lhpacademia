import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any)?.aluno?.id) {
      console.log("Unauthorized access to dashboard API");
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

    console.log(
      "🔍 API /api/alunos/dashboard: User ID:",
      session.user.id,
      "Aluno ID:",
      alunoId
    );

    // ✅ Query corrigida baseada no schema
    const [
      aluno,
      treinosCount,
      ultimaMedida,
      avaliacoesCount,
      ultimasExecucoes,
    ] = await prisma.$transaction([
      // 1. Basic aluno data
      prisma.aluno.findUnique({
        where: { id: alunoId },
        select: {
          id: true,
          nome: true,
          foto: true,
          objetivo: true,
        },
      }),
      // 2. Treinos count
      prisma.treino.count({
        where: {
          alunoId: alunoId,
        },
      }),
      // 3. Última medida
      prisma.medida.findFirst({
        where: { alunoId: alunoId },
        orderBy: { data: "desc" },
        select: {
          peso: true,
        },
      }),
      // 4. Avaliações count
      prisma.avaliacao.count({
        where: { alunoId: alunoId },
      }),
      // ✅ 5. CORRIGIDO - Últimas execuções com include correto
      prisma.execucaoTreino.findMany({
        where: {
          alunoId: alunoId,
        },
        include: {
          treino: {
            select: {
              id: true,
              nome: true,
              objetivo: true,
            },
          },
          exercicios: true, // ✅ Sem nested include (exercicioNome já vem como string)
        },
        orderBy: { data: "desc" },
        take: 10,
      }),
    ]);

    if (!aluno) {
      console.log("Aluno not found for ID:", alunoId);
      return NextResponse.json({ error: "Aluno not found" }, { status: 404 });
    }

    // ✅ Formata as execuções baseado no schema real
    const execucoesFormatadas = ultimasExecucoes.map((exec) => ({
      id: exec.id,
      data: exec.data,
      intensidade: exec.intensidade, // ✅ Usa intensidade em vez de duracao
      observacoes: exec.observacoes,
      completo: exec.completo,
      treino: {
        id: exec.treino.id,
        nome: exec.treino.nome,
        objetivo: exec.treino.objetivo,
      },
      exerciciosCompletados: exec.exercicios.length,
      exercicios: exec.exercicios.map((e) => ({
        nome: e.exercicioNome, // ✅ Campo correto do schema
        series: e.series,
        repeticoes: e.repeticoes,
        carga: e.carga,
        observacoes: e.observacoes,
      })),
    }));

    const data = {
      id: aluno.id,
      nome: aluno.nome,
      foto: aluno.foto,
      objetivo: aluno.objetivo,
      treinosAtivos: treinosCount,
      ultimaMedida: ultimaMedida ? { peso: ultimaMedida.peso } : null,
      avaliacoes: avaliacoesCount,
      proximoTreino: null,
      ultimasExecucoes: execucoesFormatadas,
    };

    console.log(
      "✅ Dados do aluno carregados:",
      aluno.nome,
      "- Treinos:",
      data.treinosAtivos,
      "- Execuções:",
      execucoesFormatadas.length
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
