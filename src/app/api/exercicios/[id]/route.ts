import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

// GET - Buscar exercício por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const exercicio = await prisma.exercicio.findUnique({
      where: { id },
    });

    if (!exercicio) {
      return NextResponse.json(
        { error: "Exercício não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(exercicio);
  } catch (error) {
    console.error("Erro ao buscar exercício:", error);
    return NextResponse.json(
      { error: "Erro ao buscar exercício" },
      { status: 500 },
    );
  }
}

// PUT - Atualizar exercício
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const grupoMuscular = formData.get("grupoMuscular") as string;
    const descricao = formData.get("descricao") as string;
    const video = formData.get("video") as string;
    const equipamento = formData.get("equipamento") as string;
    const imagemFile = formData.get("imagem") as File | null;
    const imagemExistente = formData.get("imagemExistente") as string | null;

    // Validar GrupoMuscular
    const gruposMuscularesValidos = [
      "PEITO",
      "COSTAS",
      "OMBROS",
      "BICEPS",
      "TRICEPS",
      "PERNAS",
      "GLUTEOS",
      "ABDOMEN",
      "PANTURRILHA",
      "ANTEBRACO",
      "CARDIO",
      "FUNCIONAL",
    ];

    if (!gruposMuscularesValidos.includes(grupoMuscular)) {
      return NextResponse.json(
        { error: "Grupo muscular inválido" },
        { status: 400 },
      );
    }

    // Buscar exercício atual
    const exercicioAtual = await prisma.exercicio.findUnique({
      where: { id },
      select: { imagem: true },
    });

    if (!exercicioAtual) {
      return NextResponse.json(
        { error: "Exercício não encontrado" },
        { status: 404 },
      );
    }

    let novaImagemUrl: string | null = null;

    // ✅ SE TEM NOVO ARQUIVO, FAZER UPLOAD
    if (imagemFile) {
      const arrayBuffer = await imagemFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        novaImagemUrl = await uploadToCloudinary(
          buffer,
          "saas_academia/exercicios",
        );

        // ✅ DELETAR IMAGEM ANTIGA DO CLOUDINARY
        if (exercicioAtual.imagem) {
          console.log("🗑️ Deletando imagem antiga do Cloudinary...");
          await deleteImage(exercicioAtual.imagem);
        }
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload da imagem" },
          { status: 500 },
        );
      }
    } else if (imagemExistente) {
      // ✅ Manter imagem existente
      novaImagemUrl = imagemExistente;
      console.log("📌 Mantendo imagem existente");
    } else {
      // ✅ Removeu a imagem, deletar do Cloudinary
      if (exercicioAtual.imagem) {
        console.log("🗑️ Imagem removida, deletando do Cloudinary...");
        await deleteImage(exercicioAtual.imagem);
      }
    }

    // Atualizar no banco
    const exercicioAtualizado = await prisma.exercicio.update({
      where: { id },
      data: {
        nome,
        grupoMuscular: grupoMuscular as any,
        descricao: descricao || null,
        video: video || null,
        imagem: novaImagemUrl,
        equipamento: equipamento || null,
      },
    });

    return NextResponse.json(exercicioAtualizado);
  } catch (error) {
    console.error("❌ Erro ao atualizar exercício:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar exercício" },
      { status: 500 },
    );
  }
}

// DELETE - Excluir exercício
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Buscar exercício para pegar a URL da imagem
    const exercicio = await prisma.exercicio.findUnique({
      where: { id },
      select: {
        imagem: true,
        nome: true,
      },
    });

    if (!exercicio) {
      return NextResponse.json(
        { error: "Exercício não encontrado" },
        { status: 404 },
      );
    }

    // Deletar do banco primeiro
    await prisma.exercicio.delete({
      where: { id },
    });

    // Deletar imagem do Cloudinary (se existir)
    if (exercicio.imagem) {
      await deleteImage(exercicio.imagem);
    }

    console.log("✅ Exercício e imagem deletados com sucesso!");

    return NextResponse.json({ message: "Exercício excluído com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao excluir exercício:", error);
    return NextResponse.json(
      { error: "Erro ao excluir exercício" },
      { status: 500 },
    );
  }
}
