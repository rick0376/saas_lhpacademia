// src/app/api/permissoes/route.ts

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

    // 🔎 buscar usuário logado
    const usuarioLogado = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, clienteId: true },
    });

    if (!usuarioLogado) {
      return NextResponse.json(
        { error: "Usuário logado não encontrado" },
        { status: 404 }
      );
    }

    // 🔎 buscar usuário alvo
    const usuarioAlvo = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, role: true, clienteId: true },
    });

    if (!usuarioAlvo) {
      return NextResponse.json(
        { error: "Usuário alvo não encontrado" },
        { status: 404 }
      );
    }

    // 🔒 ADMIN não pode ver permissões de outro ADMIN ou SUPERADMIN
    if (usuarioLogado.role === "ADMIN") {
      if (usuarioAlvo.role === "ADMIN" || usuarioAlvo.role === "SUPERADMIN") {
        return NextResponse.json(
          { error: "Você não pode acessar permissões deste usuário" },
          { status: 403 }
        );
      }

      // 🔒 ADMIN só pode acessar usuários da própria academia
      if (
        !usuarioLogado.clienteId ||
        usuarioLogado.clienteId !== usuarioAlvo.clienteId
      ) {
        return NextResponse.json(
          { error: "Usuário fora da sua academia" },
          { status: 403 }
        );
      }
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

    // 🔎 buscar usuário logado no banco (para pegar clienteId)
    const usuarioLogado = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, clienteId: true },
    });

    if (!usuarioLogado) {
      return NextResponse.json(
        { error: "Usuário logado não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { usuarioId, recurso, criar, ler, editar, deletar } = body;

    if (!usuarioId || !recurso) {
      return NextResponse.json(
        { error: "Usuário e recurso são obrigatórios" },
        { status: 400 }
      );
    }

    // 🔎 buscar usuário alvo
    const usuarioAlvo = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, clienteId: true, role: true },
    });

    if (!usuarioAlvo) {
      return NextResponse.json(
        { error: "Usuário alvo não encontrado" },
        { status: 404 }
      );
    }

    // 🔒 ADMIN não pode alterar permissões de outro ADMIN ou SUPERADMIN
    if (usuarioLogado.role === "ADMIN") {
      if (usuarioAlvo.role === "ADMIN" || usuarioAlvo.role === "SUPERADMIN") {
        return NextResponse.json(
          { error: "Você não pode alterar permissões de outro administrador" },
          { status: 403 }
        );
      }
    }

    // 🔒 ADMIN só pode alterar permissões da própria academia
    if (usuarioLogado.role === "ADMIN") {
      if (
        !usuarioLogado.clienteId ||
        usuarioLogado.clienteId !== usuarioAlvo.clienteId
      ) {
        return NextResponse.json(
          { error: "Você não pode alterar permissões de outra academia" },
          { status: 403 }
        );
      }
    }

    // 🔒 PASSO 2: ADMIN não pode conceder mais permissões do que possui
    if (usuarioLogado.role === "ADMIN") {
      const permissaoAdminNoRecurso = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: usuarioLogado.id,
            recurso,
          },
        },
      });

      // Se o admin não tem registro desse recurso, ele não pode conceder nada dele
      if (!permissaoAdminNoRecurso) {
        return NextResponse.json(
          { error: "Você não possui permissão para conceder este recurso" },
          { status: 403 }
        );
      }

      // Se tentar marcar algo que ele não tem, bloqueia
      if (criar === true && permissaoAdminNoRecurso.criar !== true) {
        return NextResponse.json(
          { error: "Você não pode conceder CRIAR neste recurso" },
          { status: 403 }
        );
      }

      if (ler === true && permissaoAdminNoRecurso.ler !== true) {
        return NextResponse.json(
          { error: "Você não pode conceder LER neste recurso" },
          { status: 403 }
        );
      }

      if (editar === true && permissaoAdminNoRecurso.editar !== true) {
        return NextResponse.json(
          { error: "Você não pode conceder EDITAR neste recurso" },
          { status: 403 }
        );
      }

      if (deletar === true && permissaoAdminNoRecurso.deletar !== true) {
        return NextResponse.json(
          { error: "Você não pode conceder DELETAR neste recurso" },
          { status: 403 }
        );
      }
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
