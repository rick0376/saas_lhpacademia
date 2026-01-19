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

  const where =
    usuario.role === "SUPERADMIN"
      ? {}
      : { clienteId: usuario.clienteId as string };

  const logs = await prisma.loginLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
