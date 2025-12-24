import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET() {
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

    const backupDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter((file) => file.endsWith(".json")) // ✅ MUDADO PARA JSON
      .map((file) => {
        const filepath = path.join(backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          nome: file,
          tamanho: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          data: stats.mtime.toLocaleString("pt-BR"),
        };
      })
      .sort((a, b) => b.nome.localeCompare(a.nome));

    return NextResponse.json({ backups });
  } catch (error: any) {
    console.error("Erro ao listar backups:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar backups" },
      { status: 500 }
    );
  }
}
