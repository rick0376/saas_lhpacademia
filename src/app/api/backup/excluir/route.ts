import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Permitir SUPERADMIN ou usuários com permissão
    if (session.user.role !== "SUPERADMIN") {
      const permissao = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "backup",
          },
        },
      });

      if (!permissao?.criar) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }

    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { error: "Nome do arquivo não fornecido" },
        { status: 400 }
      );
    }

    const backupDir = path.join(process.cwd(), "backups");
    const filePath = path.join(backupDir, filename);

    // Validar que o arquivo está dentro da pasta backups (segurança)
    if (!filePath.startsWith(backupDir)) {
      return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
    }

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Backup não encontrado" },
        { status: 404 }
      );
    }

    // Excluir o arquivo
    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: "Backup excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir backup:", error);
    return NextResponse.json(
      { error: "Erro ao excluir backup" },
      { status: 500 }
    );
  }
}
