import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");

    if (!alunoId) {
      return NextResponse.json(
        { error: "alunoId é obrigatório" },
        { status: 400 }
      );
    }

    const medidas = await prisma.medida.findMany({
      where: { alunoId },
      orderBy: { data: "desc" },
      select: {
        id: true,
        peso: true,
        altura: true,
        peito: true,
        cintura: true,
        quadril: true,
        bracoDireito: true,
        bracoEsquerdo: true,
        coxaDireita: true,
        coxaEsquerda: true,
        panturrilhaDireita: true,
        panturrilhaEsquerda: true,
        observacoes: true,
        data: true,
      },
    });

    return NextResponse.json(medidas);
  } catch (error) {
    console.error("❌ Erro ao buscar medidas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar medidas" },
      { status: 500 }
    );
  }
}
