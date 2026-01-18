import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUsuarioLogado(sessionUserId: string) {
  return prisma.usuario.findUnique({
    where: { id: sessionUserId },
    select: { id: true, role: true, clienteId: true },
  });
}

async function checkPermissaoTreinosLer(userId: string) {
  const p = await prisma.permissao.findUnique({
    where: { usuarioId_recurso: { usuarioId: userId, recurso: "treinos" } },
  });
  return !!p?.ler;
}

async function checkPermissaoTreinosEditarOuCriar(userId: string) {
  const p = await prisma.permissao.findUnique({
    where: { usuarioId_recurso: { usuarioId: userId, recurso: "treinos" } },
  });
  return !!(p?.editar || p?.criar);
}

// GET: listar grupos (com count)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const usuario = await getUsuarioLogado(session.user.id);
  if (!usuario)
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    const ok = await checkPermissaoTreinosLer(usuario.id);
    if (!ok)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const where =
    usuario.role === "SUPERADMIN"
      ? {}
      : { clienteId: usuario.clienteId as string };

  const grupos = await prisma.grupoTreino.findMany({
    where,
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { treinos: true } },
    },
  });

  return NextResponse.json(
    grupos.map((g) => ({
      id: g.id,
      nome: g.nome,
      descricao: g.descricao,
      totalTreinos: g._count.treinos,
    }))
  );
}

// POST: criar grupo + associar treinoIds
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const usuario = await getUsuarioLogado(session.user.id);
  if (!usuario)
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );

  if (usuario.role !== "SUPERADMIN") {
    const ok = await checkPermissaoTreinosEditarOuCriar(usuario.id);
    if (!ok)
      return NextResponse.json(
        { error: "Sem permissão para criar grupos" },
        { status: 403 }
      );
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const body = await request.json();
  const { nome, descricao, treinoIds } = body as {
    nome: string;
    descricao?: string | null;
    treinoIds?: string[];
  };

  if (!nome || typeof nome !== "string" || nome.trim().length < 2) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }

  const clienteId =
    usuario.role === "SUPERADMIN"
      ? (body?.clienteId as string | undefined) ?? null
      : (usuario.clienteId as string);

  if (usuario.role !== "SUPERADMIN" && !clienteId) {
    return NextResponse.json({ error: "Cliente inválido" }, { status: 400 });
  }

  // SUPERADMIN: se não mandar clienteId, cria sem? (vamos bloquear pra não criar solto)
  if (usuario.role === "SUPERADMIN" && !clienteId) {
    return NextResponse.json(
      { error: "SUPERADMIN precisa informar clienteId para criar grupo." },
      { status: 400 }
    );
  }

  // Validação: treinos precisam ser do mesmo cliente (quando não superadmin)
  if (Array.isArray(treinoIds) && treinoIds.length > 0 && clienteId) {
    const treinos = await prisma.treino.findMany({
      where: { id: { in: treinoIds } },
      select: { id: true, clienteId: true },
    });

    const algumFora =
      usuario.role !== "SUPERADMIN" &&
      treinos.some((t) => t.clienteId !== clienteId);

    if (algumFora) {
      return NextResponse.json(
        { error: "Há treinos fora do seu cliente." },
        { status: 403 }
      );
    }
  }

  const grupo = await prisma.grupoTreino.create({
    data: {
      nome: nome.trim(),
      descricao: descricao ?? null,
      clienteId: clienteId as string,
      treinos: Array.isArray(treinoIds)
        ? {
            create: treinoIds.map((tid) => ({
              treinoId: tid,
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json({ id: grupo.id }, { status: 201 });
}
