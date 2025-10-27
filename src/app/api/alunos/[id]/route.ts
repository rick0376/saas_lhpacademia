import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

// GET - Buscar aluno por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: {
        medidas: {
          orderBy: { data: "desc" },
          take: 5,
        },
        treinos: {
          where: { ativo: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(aluno);
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    return NextResponse.json(
      { error: "Erro ao buscar aluno" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar aluno
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // ✅ Receber FormData
    const formData = await request.formData();

    const nome = formData.get("nome") as string;
    const email = formData.get("email") as string;
    const telefone = formData.get("telefone") as string;
    const dataNascimento = formData.get("dataNascimento") as string;
    const objetivo = formData.get("objetivo") as string;
    const observacoes = formData.get("observacoes") as string;
    const ativo = formData.get("ativo") === "true";
    const fotoFile = formData.get("foto") as File | null;
    const fotoExistente = formData.get("fotoExistente") as string | null;

    console.log("📝 Atualizando aluno:", {
      id,
      nome,
      temNovoArquivo: !!fotoFile,
      manterFotoExistente: !!fotoExistente,
    });

    // Buscar aluno atual
    const alunoAtual = await prisma.aluno.findUnique({
      where: { id },
      select: { foto: true },
    });

    if (!alunoAtual) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    let novaFotoUrl: string | null = null;

    // ✅ SE TEM NOVO ARQUIVO, FAZER UPLOAD
    if (fotoFile) {
      console.log("📤 Fazendo upload da nova foto...");

      const arrayBuffer = await fotoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        novaFotoUrl = await uploadToCloudinary(buffer, "saas_academia/alunos");
        console.log("✅ Nova foto enviada:", novaFotoUrl);

        // ✅ DELETAR FOTO ANTIGA DO CLOUDINARY
        if (alunoAtual.foto) {
          console.log("🗑️ Deletando foto antiga do Cloudinary...");
          await deleteImage(alunoAtual.foto);
        }
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload da foto" },
          { status: 500 }
        );
      }
    } else if (fotoExistente) {
      // ✅ Manter foto existente
      novaFotoUrl = fotoExistente;
      console.log("📌 Mantendo foto existente");
    } else {
      // ✅ Removeu a foto, deletar do Cloudinary
      if (alunoAtual.foto) {
        console.log("🗑️ Foto removida, deletando do Cloudinary...");
        await deleteImage(alunoAtual.foto);
      }
    }

    // Atualizar no banco
    const alunoAtualizado = await prisma.aluno.update({
      where: { id },
      data: {
        nome,
        email: email || null,
        telefone: telefone || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        foto: novaFotoUrl,
        objetivo: objetivo || null,
        observacoes: observacoes || null,
        ativo,
      },
    });

    console.log("✅ Aluno atualizado com sucesso:", {
      id: alunoAtualizado.id,
      fotoAtualizada: alunoAtualizado.foto ? "SIM ✅" : "NÃO ❌",
    });

    return NextResponse.json(alunoAtualizado);
  } catch (error) {
    console.error("❌ Erro ao atualizar aluno:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar aluno" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir aluno
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // ✅ Buscar aluno para pegar a URL da foto
    const aluno = await prisma.aluno.findUnique({
      where: { id },
      select: {
        foto: true,
        nome: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    console.log("🗑️ Deletando aluno:", {
      id,
      nome: aluno.nome,
      temFoto: !!aluno.foto,
    });

    // ✅ Deletar do banco primeiro
    await prisma.aluno.delete({
      where: { id },
    });

    // ✅ Deletar foto do Cloudinary (se existir)
    if (aluno.foto) {
      console.log("🗑️ Deletando foto do Cloudinary:", aluno.foto);
      await deleteImage(aluno.foto);
    }

    console.log("✅ Aluno e foto deletados com sucesso!");

    return NextResponse.json({ message: "Aluno excluído com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao excluir aluno:", error);
    return NextResponse.json(
      { error: "Erro ao excluir aluno" },
      { status: 500 }
    );
  }
}
