import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import bcrypt from "bcryptjs";

// GET - Listar todos os clientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        logo: true,
        ativo: true,
        createdAt: true,
        dataVencimento: true,
        _count: {
          select: {
            usuarios: true,
            alunos: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Apenas SuperAdmin pode criar clientes" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const nome = formData.get("nome") as string;
    const login = formData.get("login") as string; // ✅ LOGIN
    const senha = formData.get("senha") as string; // ✅ SENHA
    const ativo = formData.get("ativo") === "true";
    const logoFile = formData.get("logo") as File | null;
    const dataVencimento = formData.get("dataVencimento") as string | null; // ✅ NOVO CAMPO

    if (!nome || !login || !senha) {
      return NextResponse.json(
        { error: "Nome, login e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ Gerar email único a partir do login
    const email = `${login}@cliente.local`;

    // Valida se login já existe
    const loginExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (loginExistente) {
      return NextResponse.json(
        { error: "Login já cadastrado" },
        { status: 400 }
      );
    }

    let logoUrl: string | null = null;

    if (logoFile) {
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        logoUrl = await uploadToCloudinary(buffer, "saas_academia/clientes");
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload do logo" },
          { status: 500 }
        );
      }
    }

    // ✅ CRIAR CLIENTE
    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        logo: logoUrl,
        ativo,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null, // ✅ Adicionando dataVencimento
      },
    });

    // ✅ CRIAR USUÁRIO ADMIN COM LOGIN E SENHA
    const hashedPassword = await bcrypt.hash(senha, 10);

    await prisma.usuario.create({
      data: {
        nome: "Administrador",
        email: email, // email único gerado
        senha: hashedPassword,
        clienteId: novoCliente.id,
        role: "ADMIN",
        ativo: true,
      },
    });

    console.log("✅ Cliente e Admin criados.");

    return NextResponse.json(
      {
        cliente: novoCliente,
        admin: {
          login: login,
          senha: senha, // Retorna a senha em texto para exibir
        },
        mensagem: `✅ Cliente criado! Logine Senha com suecesso. ${senha}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
