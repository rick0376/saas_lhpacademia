import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

// GET - Listar todos os clientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // 🔎 filtro opcional
    const whereClause: Prisma.ClienteWhereInput = search
      ? {
          nome: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      select: {
        id: true,
        nome: true,
        logo: true,
        ativo: true,
        createdAt: true,
        dataVencimento: true,
        plano: {
          select: { nome: true },
        },
        _count: {
          select: {
            usuarios: true,
            alunos: true,
          },
        },
      },
      orderBy: { nome: "desc" },
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
    const login = formData.get("login") as string;
    const senha = formData.get("senha") as string;
    const planoId = formData.get("planoId") as string; // ✅ NOVO CAMPO
    const ativo = formData.get("ativo") === "true";
    const logoFile = formData.get("logo") as File | null;
    const dataVencimento = formData.get("dataVencimento") as string | null;

    if (!nome || !login || !senha || !planoId) {
      return NextResponse.json(
        { error: "Nome, login, senha e plano são obrigatórios" },
        { status: 400 }
      );
    }

    // validar se o plano existe
    const planoExistente = await prisma.plano.findUnique({
      where: { id: planoId },
    });
    if (!planoExistente) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    // gerar email único a partir do login
    const email = `${login}@cliente.local`;

    // valida se login já existe
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

    // criar cliente com planoId
    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        logo: logoUrl,
        ativo,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        planoId, // associação ao plano
      },
    });

    // criar usuário admin
    const hashedPassword = await bcrypt.hash(senha, 10);
    await prisma.usuario.create({
      data: {
        nome: "Administrador",
        email,
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
        admin: { login, senha },
        mensagem: `✅ Cliente criado! Login e senha com sucesso.`,
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
