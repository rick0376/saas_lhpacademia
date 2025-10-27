import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

// GET - Listar todos os clientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Apenas SuperAdmin pode listar clientes" },
        { status: 403 }
      );
    }

    const clientes = await prisma.cliente.findMany({
      include: {
        _count: {
          select: { usuarios: true },
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

    // ✅ Receber FormData (arquivo + campos)
    const formData = await request.formData();

    const nome = formData.get("nome") as string;
    const ativo = formData.get("ativo") === "true";
    const logoFile = formData.get("logo") as File | null;

    console.log("📥 Recebendo dados do cliente:", {
      nome,
      ativo,
      temArquivo: !!logoFile,
      nomeArquivo: logoFile?.name || null,
    });

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    let logoUrl: string | null = null;

    // ✅ SE TEM ARQUIVO, FAZER UPLOAD PRO CLOUDINARY
    if (logoFile) {
      console.log("📤 Fazendo upload do logo para Cloudinary...");

      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        logoUrl = await uploadToCloudinary(buffer, "saas_academia/clientes");
        console.log("✅ Logo enviado para Cloudinary:", logoUrl);
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload do logo" },
          { status: 500 }
        );
      }
    }

    // ✅ SALVAR NO BANCO DE DADOS
    console.log("💾 Salvando no banco de dados...");

    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        logo: logoUrl, // ✅ URL do Cloudinary ou null
        ativo,
      },
    });

    console.log("✅ Cliente criado com sucesso:", {
      id: novoCliente.id,
      nome: novoCliente.nome,
      logoSalvo: novoCliente.logo ? "SIM ✅" : "NÃO ❌",
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
