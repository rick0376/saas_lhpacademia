import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Ajuste o caminho do auth.ts
import { prisma } from "@/lib/prisma"; // Ajuste o caminho do Prisma

// ✅ GET (exemplo para buscar permissão por ID)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Next.js 15: Params como Promise
) {
  try {
    const params = await context.params; // ✅ Await resolve o Promise (fixa type error)
    const id = params.id;

    // Verifica sessão (ex: só admin)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    }

    const permissao = await prisma.permissao.findUnique({
      // Ajuste model se for "Permissoes"
      where: { id },
      include: {
        /* usuario, role, etc. conforme schema */
      },
    });

    if (!permissao) {
      return NextResponse.json(
        { error: "Permissão não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: permissao }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro GET /api/permissoes/[id]:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ✅ DELETE (foco do erro - corrigido para Next.js 15)
export async function DELETE( // ✅ Async para await interno
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Params como Promise (resolve constraint)
) {
  try {
    const params = await context.params; // ✅ Await resolve o Promise (fixa "missing then/catch")
    const id = params.id;

    // Verifica sessão (ex: só admin)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    }

    // Deleta no Prisma (ajuste model: "permissao" ou "permissoes")
    const deleted = await prisma.permissao.delete({
      where: { id },
    });

    console.log("✅ Permissão deletada:", id);

    return NextResponse.json(
      { data: deleted, message: "Permissão deletada com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro DELETE /api/permissoes/[id]:", error);
    return NextResponse.json({ error: "Erro ao deletar." }, { status: 500 });
  }
}

// Adicione POST/PUT se existirem, com o mesmo padrão: async + await params
