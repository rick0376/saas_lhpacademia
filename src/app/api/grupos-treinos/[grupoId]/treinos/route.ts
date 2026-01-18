import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { grupoId: string } }
) {
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
    if (!p?.editar && !p?.criar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const body = await request.json();
  const { treinoId } = body as { treinoId: string };

  if (!treinoId)
    return NextResponse.json(
      { error: "treinoId obrigatório" },
      { status: 400 }
    );

  const grupo = await prisma.grupoTreino.findUnique({
    where: { id: params.grupoId },
  });
  if (!grupo)
    return NextResponse.json(
      { error: "Grupo não encontrado" },
      { status: 404 }
    );

  const treino = await prisma.treino.findUnique({
    where: { id: treinoId },
    select: { id: true, clienteId: true },
  });
  if (!treino)
    return NextResponse.json(
      { error: "Treino não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    if (grupo.clienteId !== usuario.clienteId) {
      return NextResponse.json(
        { error: "Grupo fora do seu cliente" },
        { status: 403 }
      );
    }
    if (treino.clienteId !== usuario.clienteId) {
      return NextResponse.json(
        { error: "Treino fora do seu cliente" },
        { status: 403 }
      );
    }
  }

  await prisma.grupoTreinoItem.create({
    data: {
      grupoTreinoId: grupo.id,
      treinoId: treino.id,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { grupoId: string } }
) {
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
    if (!p?.editar && !p?.deletar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const treinoId = searchParams.get("treinoId");

  if (!treinoId)
    return NextResponse.json(
      { error: "treinoId obrigatório" },
      { status: 400 }
    );

  const grupo = await prisma.grupoTreino.findUnique({
    where: { id: params.grupoId },
  });
  if (!grupo)
    return NextResponse.json(
      { error: "Grupo não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    if (grupo.clienteId !== usuario.clienteId) {
      return NextResponse.json(
        { error: "Grupo fora do seu cliente" },
        { status: 403 }
      );
    }
  }

  await prisma.grupoTreinoItem.deleteMany({
    where: { grupoTreinoId: params.grupoId, treinoId },
  });

  return NextResponse.json({ ok: true });
}
