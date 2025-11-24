import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // Removidos logs sensíveis
    // console.log("🔍 API /api/alunos/treinos: Aluno ID:", alunoId);

    const treinos = await prisma.treino.findMany({
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
    });

    // console.log(
    //   "✅ Treinos carregados:",
    //   treinos.length,
    //   "para aluno",
    //   alunoId
    // );

    return NextResponse.json(treinos);
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
