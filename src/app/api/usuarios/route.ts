import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/bcrypt";

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // ✅ ALUNO não pode listar usuários
    if (session.user.role === "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");

    const whereClause: any = {};

    if (session.user.role !== "SUPERADMIN") {
      // ✅ ADMIN só vê usuários do seu cliente
      whereClause.clienteId = session.user.clienteId;
    } else if (clienteId) {
      // ✅ SUPERADMIN pode filtrar por clienteId
      whereClause.clienteId = clienteId;
    }

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
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // ✅ ALUNO não pode criar usuários
    if (session.user.role === "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email, senha, role, clienteId, ativo } = body;

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ ADMIN não pode criar SUPERADMIN
    if (session.user.role === "ADMIN" && role === "SUPERADMIN") {
      return NextResponse.json(
        { error: "Você não tem permissão para criar SUPERADMIN" },
        { status: 403 }
      );
    }

    // ✅ ADMIN só pode criar ADMIN e USER (não SUPERADMIN)
    if (session.user.role === "ADMIN" && !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Perfil inválido para sua conta" },
        { status: 403 }
      );
    }

    // Verificar se email já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const senhaHash = await hashPassword(senha);

    // ✅ Definir ativo baseado no role do usuário logado
    const usuarioAtivo =
      session.user.role === "SUPERADMIN" ? ativo ?? true : false;

    // ✅ ADMIN usa seu próprio clienteId, SUPERADMIN pode escolher
    const clienteIdFinal =
      session.user.role === "ADMIN"
        ? session.user.clienteId
        : clienteId || session.user.clienteId;

    // Criar usuário
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
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
