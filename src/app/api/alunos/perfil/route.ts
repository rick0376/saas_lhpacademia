// app/api/alunos/perfil/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ========================================
// GET: Pegar dados do perfil
// ========================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");

    if (!alunoId) {
      return NextResponse.json(
        { error: "alunoId é obrigatório" },
        { status: 400 }
      );
    }

    // ✅ Validação de segurança
    const sessionAlunoId = (session.user as any).aluno?.id;
    if (sessionAlunoId !== alunoId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    console.log("🔍 Buscando perfil do aluno:", alunoId);

    // ✅ Buscar dados do aluno com usuario relacionado
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        dataNascimento: true,
        objetivo: true,
        usuario: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Perfil carregado:", aluno.nome);

    // ✅ Formata resposta
    const response = {
      id: aluno.id,
      nome: aluno.nome,
      email: aluno.email || aluno.usuario?.email,
      foto: aluno.foto,
      telefone: aluno.telefone,
      dataNascimento: aluno.dataNascimento,
      objetivo: aluno.objetivo,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=30", // Cache 30s
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar perfil:", error.message);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

// ========================================
// PUT: Atualizar dados do perfil
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { alunoId, nome, telefone, dataNascimento, objetivo } = body;

    if (!alunoId || !nome) {
      return NextResponse.json(
        { error: "alunoId e nome são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ Validação de segurança
    const sessionAlunoId = (session.user as any).aluno?.id;
    if (sessionAlunoId !== alunoId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    console.log("🔄 Atualizando perfil do aluno:", alunoId);

    // ✅ Atualizar aluno
    const alunoAtualizado = await prisma.aluno.update({
      where: { id: alunoId },
      data: {
        nome,
        telefone: telefone || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        objetivo: objetivo || null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        dataNascimento: true,
        objetivo: true,
      },
    });

    console.log("✅ Perfil atualizado com sucesso");

    const response = {
      id: alunoAtualizado.id,
      nome: alunoAtualizado.nome,
      email: alunoAtualizado.email,
      foto: alunoAtualizado.foto,
      telefone: alunoAtualizado.telefone,
      dataNascimento: alunoAtualizado.dataNascimento,
      objetivo: alunoAtualizado.objetivo,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("❌ Erro ao atualizar perfil:", error.message);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
