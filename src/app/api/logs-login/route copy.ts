//api/logs-login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

  // Permissão: SUPERADMIN sempre, outros precisam logs_login.ler
  if (usuario.role !== "SUPERADMIN") {
    const p = await prisma.permissao.findUnique({
      where: {
        usuarioId_recurso: { usuarioId: usuario.id, recurso: "logs_login" },
      },
    });
    if (!p?.ler)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    if (!usuario.clienteId)
      return NextResponse.json({ error: "Sem cliente" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 100), 300);

  const clienteIdParam = searchParams.get("clienteId");

  let where: any = {};

  if (usuario.role !== "SUPERADMIN") {
    where.clienteId = usuario.clienteId as string;
  } else if (clienteIdParam && clienteIdParam !== "all") {
    where.clienteId = clienteIdParam;
  }

  const logs = await prisma.loginLog.findMany({
    where,
    include: {
      cliente: {
        select: { nome: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
