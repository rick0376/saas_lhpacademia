import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Role = "ADMIN" | "SUPERADMIN" | "USER"; // Seu enum Role do Prisma

interface SessionUser {
  id: string;
  role: Role;
  // Outros campos do seu auth.ts
}

function isAuthorized(session: any): session is { user: SessionUser } {
  return session?.user && ["ADMIN", "SUPERADMIN"].includes(session.user.role);
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as {
    user?: SessionUser;
  } | null;
  console.log("🔍 Session User:", JSON.stringify(session?.user, null, 2)); // Debug role

  if (!isAuthorized(session)) {
    const role = session?.user?.role || "ausente";
    console.log("❌ Role inválido:", role);
    return NextResponse.json(
      { error: "Não autorizado para admin" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const alunoId = formData.get("alunoId")?.toString().trim();
    const tipo = formData.get("tipo")?.toString().trim();
    const resultado = formData.get("resultado")?.toString().trim();
    const observacoes = formData.get("observacoes")?.toString().trim() || null;
    const dataStr = formData.get("data")?.toString().trim();
    const arquivo = formData.get("arquivo") as File | null;

    if (!alunoId || !tipo || !resultado || !dataStr) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios ausentes (alunoId, tipo, resultado, data)",
        },
        { status: 400 }
      );
    }

    // Valida se aluno existe (opcional, mas bom para integridade)
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    // Placeholder para Cloudinary upload (integre v2/upload depois)
    let arquivoUrl: string | null = null;
    if (arquivo) {
      // Ex: const upload = await cloudinary.uploader.upload(arquivo);
      // arquivoUrl = upload.secure_url;
      arquivoUrl = "uploaded-url-placeholder"; // Temp
    }

    const data = new Date(dataStr);
    if (isNaN(data.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        alunoId,
        tipo,
        resultado,
        observacoes,
        data,
        arquivo: arquivoUrl,
      },
      include: { aluno: true }, // Opcional: retorna aluno relacionado
    });

    console.log(
      "✅ Avaliação criada ID:",
      avaliacao.id,
      "para aluno:",
      alunoId
    );
    revalidatePath(`/admin/alunos/${alunoId}/avaliacoes`); // Invalida cache da lista

    return NextResponse.json({ success: true, avaliacao }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Erro na criação de avaliação:", error.message || error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as {
    user?: SessionUser;
  } | null;

  if (!isAuthorized(session)) {
    const role = session?.user?.role || "ausente";
    console.log("❌ Role inválido no GET:", role);
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get("alunoId")?.trim();

  try {
    if (!alunoId) {
      return NextResponse.json(
        { error: "alunoId obrigatório na query" },
        { status: 400 }
      );
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { alunoId },
      include: { aluno: true }, // Opcional: inclui aluno
      orderBy: { data: "desc" },
    });

    console.log(
      `✅ Avaliações listadas para aluno ${alunoId}: ${avaliacoes.length} itens`
    );
    return NextResponse.json(avaliacoes);
  } catch (error: any) {
    console.error("❌ Erro na listagem de avaliações:", error.message || error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
