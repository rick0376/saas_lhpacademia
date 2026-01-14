//api/permissoes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar permissões de um usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");

    if (!usuarioId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const permissoes = await prisma.permissao.findMany({
      where: { usuarioId },
      orderBy: { recurso: "asc" },
    });

    return NextResponse.json(permissoes);
  } catch (error) {
    console.error("Erro ao buscar permissões:", error);
    return NextResponse.json(
      { error: "Erro ao buscar permissões" },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar permissão
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { usuarioId, recurso, criar, ler, editar, deletar } = body;

    if (!usuarioId || !recurso) {
      return NextResponse.json(
        { error: "Usuário e recurso são obrigatórios" },
        { status: 400 }
      );
    }

    const permissao = await prisma.permissao.upsert({
      where: {
        usuarioId_recurso: {
          usuarioId,
          recurso,
        },
      },
      update: {
        criar: criar ?? false,
        ler: ler ?? true,
        editar: editar ?? false,
        deletar: deletar ?? false,
      },
      create: {
        usuarioId,
        recurso,
        criar: criar ?? false,
        ler: ler ?? true,
        editar: editar ?? false,
        deletar: deletar ?? false,
      },
    });

    return NextResponse.json(permissao);
  } catch (error) {
    console.error("Erro ao salvar permissão:", error);
    return NextResponse.json(
      { error: "Erro ao salvar permissão" },
      { status: 500 }
    );
  }
}
