import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grupoId: string }> }
) {
  const { grupoId } = await params;
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, clienteId: true },
  });
  if (!usuario)
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    const p = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: { usuarioId: usuario.id, recurso: "treinos" },
      },
    });
    if (!p?.ler)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const grupo = await prisma.grupoTreino.findUnique({
    where: { id: grupoId },
    include: {
      treinos: {
        include: {
          treino: {
            select: {
              id: true,
              nome: true,
              objetivo: true,
              ativo: true,
              dataInicio: true,
              clienteId: true,
            },
          },
        },
      },
    },
  });

  if (!grupo)
    return NextResponse.json(
      { error: "Grupo não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    if (grupo.clienteId !== usuario.clienteId) {
      return NextResponse.json(
        { error: "Fora do seu cliente" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({
    id: grupo.id,
    nome: grupo.nome,
    descricao: grupo.descricao,
    treinos: grupo.treinos
      .map((gt) => gt.treino)
      .filter((t) => !!t)
      .map((t) => ({
        id: t.id,
        nome: t.nome,
        objetivo: t.objetivo,
        ativo: t.ativo,
        dataInicio: t.dataInicio,
      })),
  });
}
