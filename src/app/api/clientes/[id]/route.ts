import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

// GET - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // ✅ Receber FormData
    const formData = await request.formData();

    const nome = formData.get("nome") as string;
    const ativo = formData.get("ativo") === "true";
    const logoFile = formData.get("logo") as File | null;
    const logoExistente = formData.get("logoExistente") as string | null;

    console.log("📝 Atualizando cliente:", {
      id,
      nome,
      temNovoArquivo: !!logoFile,
      manterLogoExistente: !!logoExistente,
    });

    // Buscar cliente atual
    const clienteAtual = await prisma.cliente.findUnique({
      where: { id },
      select: { logo: true },
    });

    if (!clienteAtual) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    let novoLogoUrl: string | null = null;

    // ✅ SE TEM NOVO ARQUIVO, FAZER UPLOAD
    if (logoFile) {
      console.log("📤 Fazendo upload do novo logo...");

      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        novoLogoUrl = await uploadToCloudinary(
          buffer,
          "saas_academia/clientes"
        );
        console.log("✅ Novo logo enviado:", novoLogoUrl);

        // ✅ DELETAR LOGO ANTIGO DO CLOUDINARY
        if (clienteAtual.logo) {
          console.log("🗑️ Deletando logo antigo do Cloudinary...");
          await deleteImage(clienteAtual.logo);
        }
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload do logo" },
          { status: 500 }
        );
      }
    } else if (logoExistente) {
      // ✅ Manter logo existente
      novoLogoUrl = logoExistente;
      console.log("📌 Mantendo logo existente");
    } else {
      // ✅ Removeu o logo, deletar do Cloudinary
      if (clienteAtual.logo) {
        console.log("🗑️ Logo removido, deletando do Cloudinary...");
        await deleteImage(clienteAtual.logo);
      }
    }

    // Atualizar no banco
    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: {
        nome,
        logo: novoLogoUrl,
        ativo,
      },
    });

    console.log("✅ Cliente atualizado com sucesso:", {
      id: clienteAtualizado.id,
      logoAtualizado: clienteAtualizado.logo ? "SIM ✅" : "NÃO ❌",
    });

    return NextResponse.json(clienteAtualizado);
  } catch (error) {
    console.error("❌ Erro ao atualizar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // ✅ Buscar cliente para pegar a URL do logo
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      select: {
        logo: true,
        nome: true,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    console.log("🗑️ Deletando cliente:", {
      id,
      nome: cliente.nome,
      temLogo: !!cliente.logo,
    });

    // ✅ Deletar do banco primeiro
    await prisma.cliente.delete({
      where: { id },
    });

    // ✅ Deletar logo do Cloudinary (se existir)
    if (cliente.logo) {
      console.log("🗑️ Deletando logo do Cloudinary:", cliente.logo);
      await deleteImage(cliente.logo);
    }

    console.log("✅ Cliente e logo deletados com sucesso!");

    return NextResponse.json({ message: "Cliente excluído com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao excluir cliente:", error);
    return NextResponse.json(
      { error: "Erro ao excluir cliente" },
      { status: 500 }
    );
  }
}
