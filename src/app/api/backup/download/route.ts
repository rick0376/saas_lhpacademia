import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");

    if (!filename || !filename.endsWith(".json")) {
      // ✅ MUDADO PARA JSON
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    const filepath = path.join(process.cwd(), "backups", filename);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filepath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/json", // ✅ MUDADO PARA JSON
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao baixar backup:", error);
    return NextResponse.json(
      { error: "Erro ao baixar backup" },
      { status: 500 }
    );
  }
}
