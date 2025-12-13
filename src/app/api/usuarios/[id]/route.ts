// File: src/app/api/usuarios/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/bcrypt";

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        clienteId: true,
        aluno: {
          select: {
            telefone: true,
            dataNascimento: true,
            objetivo: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário + aluno
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nome,
      email,
      senha,
      role,
      ativo,
      telefone,
      dataNascimento,
      objetivo,
    } = body;

    // ===========================
    // 1️⃣ Monta dados do usuário
    // ===========================
    const dataToUpdate: any = {
      nome,
      email,
      role,
      ativo,
      telefone,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      objetivo,
    };

    if (senha && senha.trim() !== "") {
      dataToUpdate.senha = await hashPassword(senha);
    }

    // Atualiza usuário
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        updatedAt: true,
      },
    });

    // ===========================
    // 2️⃣ Verificar papel do usuário
    // ===========================
    const usuarioEditado = await prisma.usuario.findUnique({
      where: { id },
      select: { role: true },
    });

    // ===========================
    // 3️⃣ Se for SUPERADMIN → NÃO mexe no aluno
    // ===========================
    if (usuarioEditado?.role === "SUPERADMIN") {
      return NextResponse.json(usuarioAtualizado);
    }

    // ===========================
    // 4️⃣ Verificar se existe aluno vinculado
    // ===========================
    const usuarioAluno = await prisma.aluno.findUnique({
      where: { usuarioId: id },
    });

    // ===========================
    // 5️⃣ Se NÃO for aluno → não atualiza aluno
    // ===========================
    if (!usuarioAluno) {
      return NextResponse.json(usuarioAtualizado);
    }

    // ===========================
    // 6️⃣ Atualiza o aluno vinculado
    // ===========================
    await prisma.aluno.update({
      where: { id: usuarioAluno.id },
      data: {
        telefone,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        objetivo,
      },
    });

    return NextResponse.json(usuarioAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE permanece igual
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role === "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (session.user.role !== "SUPERADMIN") {
      const permissao = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "usuarios",
          },
        },
      });

      if (!permissao || !permissao.deletar) {
        return NextResponse.json(
          { error: "Sem permissão para excluir usuários" },
          { status: 403 }
        );
      }
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Não é possível excluir seu próprio usuário" },
        { status: 400 }
      );
    }

    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
