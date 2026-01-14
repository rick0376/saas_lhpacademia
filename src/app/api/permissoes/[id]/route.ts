//api/permissoes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ✅ GET (buscar permissão por ID)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "SUPERADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const permissao = await prisma.permissao.findUnique({
      where: { id },
    });

    if (!permissao) {
      return NextResponse.json(
        { error: "Permissão não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: permissao }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro GET /api/permissoes/[id]:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ✅ DELETE (remover permissão por ID)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "SUPERADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const deleted = await prisma.permissao.delete({
      where: { id },
    });

    console.log("✅ Permissão deletada:", id);

    return NextResponse.json(
      { data: deleted, message: "Permissão deletada com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro DELETE /api/permissoes/[id]:", error);
    return NextResponse.json({ error: "Erro ao deletar." }, { status: 500 });
  }
}
