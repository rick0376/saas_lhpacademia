//rc/app/api/grupos-treinos/[grupoId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUsuario(sessionUserId: string) {
  return prisma.usuario.findUnique({
    where: { id: sessionUserId },
    select: { id: true, role: true, clienteId: true },
  });
}

async function getPermTreinos(userId: string) {
  return prisma.permissao.findUnique({
    where: {
      usuarioId_recurso: { usuarioId: userId, recurso: "grupos_treinos" },
    },
  });
}

// GET (já existia)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grupoId: string }> }
) {
  const { grupoId } = await params;

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const usuario = await getUsuario(session.user.id);
  if (!usuario)
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    const p = await getPermTreinos(usuario.id);
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

  if (usuario.role !== "SUPERADMIN" && grupo.clienteId !== usuario.clienteId) {
    return NextResponse.json({ error: "Fora do seu cliente" }, { status: 403 });
  }

  return NextResponse.json({
    id: grupo.id,
    nome: grupo.nome,
    descricao: grupo.descricao,
    treinos: grupo.treinos
      .map((gt) => gt.treino)
      .filter(Boolean)
      .map((t) => ({
        id: t.id,
        nome: t.nome,
        objetivo: t.objetivo,
        ativo: t.ativo,
        dataInicio: t.dataInicio,
      })),
  });
}

// PATCH: editar nome/descrição
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ grupoId: string }> }
) {
  const { grupoId } = await params;

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const usuario = await getUsuario(session.user.id);
  if (!usuario)
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    const p = await getPermTreinos(usuario.id);
    if (!p?.editar) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar grupos" },
        { status: 403 }
      );
    }
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const grupo = await prisma.grupoTreino.findUnique({ where: { id: grupoId } });
  if (!grupo)
    return NextResponse.json(
      { error: "Grupo não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN" && grupo.clienteId !== usuario.clienteId) {
    return NextResponse.json({ error: "Fora do seu cliente" }, { status: 403 });
  }

  const body = await request.json();
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const descricao =
    typeof body?.descricao === "string" ? body.descricao.trim() : "";

  if (nome.length < 2) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }

  try {
    const updated = await prisma.grupoTreino.update({
      where: { id: grupoId },
      data: { nome, descricao: descricao || null },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro ao editar grupo" },
      { status: 500 }
    );
  }
}

// DELETE: excluir grupo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ grupoId: string }> }
) {
  const { grupoId } = await params;

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const usuario = await getUsuario(session.user.id);
  if (!usuario)
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    const p = await getPermTreinos(usuario.id);
    if (!p?.editar) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar grupos" },
        { status: 403 }
      );
    }
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const grupo = await prisma.grupoTreino.findUnique({ where: { id: grupoId } });
  if (!grupo)
    return NextResponse.json(
      { error: "Grupo não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN" && grupo.clienteId !== usuario.clienteId) {
    return NextResponse.json({ error: "Fora do seu cliente" }, { status: 403 });
  }

  await prisma.grupoTreino.delete({ where: { id: grupoId } });

  return NextResponse.json({ ok: true });
}
