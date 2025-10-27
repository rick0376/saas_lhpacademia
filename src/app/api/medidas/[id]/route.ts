import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";

// DELETE - Excluir medida
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

    // ✅ Buscar medida para pegar as fotos
    const medida = await prisma.medida.findUnique({
      where: { id },
      select: {
        fotos: true,
        peso: true,
        altura: true,
      },
    });

    if (!medida) {
      return NextResponse.json(
        { error: "Medida não encontrada" },
        { status: 404 }
      );
    }

    console.log("🗑️ Deletando medida:", {
      id,
      peso: medida.peso,
      altura: medida.altura,
      totalFotos: medida.fotos?.length || 0,
    });

    // ✅ Deletar do banco primeiro
    await prisma.medida.delete({
      where: { id },
    });

    // ✅ Deletar todas as fotos do Cloudinary
    if (medida.fotos && medida.fotos.length > 0) {
      console.log(
        `🗑️ Deletando ${medida.fotos.length} foto(s) do Cloudinary...`
      );

      for (let i = 0; i < medida.fotos.length; i++) {
        const fotoUrl = medida.fotos[i];
        try {
          await deleteImage(fotoUrl);
          console.log(`✅ Foto ${i + 1}/${medida.fotos.length} deletada`);
        } catch (error) {
          console.error(`❌ Erro ao deletar foto ${i + 1}:`, error);
          // Continuar mesmo se uma foto falhar
        }
      }

      console.log("✅ Todas as fotos deletadas do Cloudinary!");
    }

    console.log("✅ Medida e fotos deletadas com sucesso!");

    return NextResponse.json({ message: "Medida excluída com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao excluir medida:", error);
    return NextResponse.json(
      { error: "Erro ao excluir medida" },
      { status: 500 }
    );
  }
}
