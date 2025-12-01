import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const treinos = await prisma.treino.findMany({
    where: { alunoId: id, ativo: true },
    select: {
      id: true,
      nome: true,
      exercicios: {
        select: { exercicio: { select: { nome: true } } },
      },
    },
  });
  return NextResponse.json(treinos);
}
