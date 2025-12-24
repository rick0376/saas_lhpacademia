import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "backup-config.json");

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

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ ativo: false, intervalo: "diario" });
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const { ativo, intervalo } = await request.json();

    const config = { ativo, intervalo, ultimoBackup: new Date().toISOString() };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: "Configuração salva com sucesso",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
