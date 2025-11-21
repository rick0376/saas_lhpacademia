import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/bcrypt";

export async function GET(request: NextRequest) {
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

    if (!permissao || !permissao.ler) {
      return NextResponse.json(
        { error: "Sem permissão para listar usuários" },
        { status: 403 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get("clienteId");
  const search = (searchParams.get("search") || "").trim();

  const baseWhere: any = {};
  if (session.user.role !== "SUPERADMIN") {
    baseWhere.clienteId = session.user.clienteId;
  } else if (clienteId) {
    baseWhere.clienteId = clienteId;
  }

  const whereClause =
    search.length > 0
      ? {
          AND: [
            baseWhere,
            {
              OR: [
                { nome: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          ],
        }
      : baseWhere;

  const usuarios = await prisma.usuario.findMany({
    where: whereClause,
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      clienteId: true,
      createdAt: true,
      updatedAt: true,
      cliente: {
        select: {
          nome: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
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

    if (!permissao || !permissao.criar) {
      return NextResponse.json(
        { error: "Sem permissão para criar usuários" },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const { nome, email, senha, role, clienteId, ativo } = body;

  if (!nome || !email || !senha) {
    return NextResponse.json(
      { error: "Nome, email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  if (session.user.role === "ADMIN" && role === "SUPERADMIN") {
    return NextResponse.json(
      { error: "Você não tem permissão para criar SUPERADMIN" },
      { status: 403 }
    );
  }

  if (session.user.role === "ADMIN" && !["USER", "ADMIN"].includes(role)) {
    return NextResponse.json(
      { error: "Perfil inválido para sua conta" },
      { status: 403 }
    );
  }

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
  }

  const senhaHash = await hashPassword(senha);

  const usuarioAtivo =
    session.user.role === "SUPERADMIN" ? ativo ?? true : false;

  const clienteIdFinal =
    session.user.role === "ADMIN"
      ? session.user.clienteId
      : clienteId || session.user.clienteId;

  const novoUsuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaHash,
      role: role || "USER",
      clienteId: clienteIdFinal,
      ativo: usuarioAtivo,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      createdAt: true,
    },
  });

  return NextResponse.json(novoUsuario, { status: 201 });
}
