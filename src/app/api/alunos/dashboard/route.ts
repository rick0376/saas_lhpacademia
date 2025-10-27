import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Ajuste path se need
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Auth check (cast any para bypass TS; aluno populado no callback auth.ts)
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any)?.aluno?.id) {
      // ✅ Fix: as any no access aluno.id
      console.log("Unauthorized access to dashboard API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("alunoId");
    if (!alunoId || alunoId !== (session.user as any).aluno.id) {
      // ✅ Fix: as any no security check
      return NextResponse.json(
        { error: "Missing or invalid alunoId" },
        { status: 400 }
      );
    }

    console.log(
      "🔍 API /api/alunos/dashboard: User ID:",
      session.user.id,
      "Aluno ID:",
      alunoId
    );

    // Query full em transaction (intacta; ajuste fields se Prisma TS erro)
    const [
      aluno,
      treinosCount,
      ultimaMedida,
      avaliacoesCount /*, proximoTreino */,
    ] = await prisma.$transaction([
      // 1. Basic aluno data
      prisma.aluno.findUnique({
        where: { id: alunoId },
        select: {
          id: true,
          nome: true, // ✅ Confirme field 'nome' no schema Aluno
          foto: true,
          objetivo: true,
        },
      }),
      // 2. Treinos count
      prisma.treino.count({
        where: {
          alunoId: alunoId, // ✅ Assuma FK String; se relation: { aluno: { id: alunoId } }
          // ativo: true,  // Comente se field não existe
        },
      }),
      // 3. Última medida
      prisma.medida.findFirst({
        where: { alunoId: alunoId }, // ✅ Assuma FK
        orderBy: { data: "desc" }, // ✅ Assuma field 'data'; mude se 'createdAt'
        select: {
          peso: true,
          // data: true,  // Comente se erro TS
        },
      }),
      // 4. Avaliações count
      prisma.avaliacao.count({
        where: { alunoId: alunoId }, // ✅ Assuma FK
      }),
      // 5. Comentado (sem erro TS agora)
      // prisma.cronograma.findFirst({ ... }),
    ]);

    if (!aluno) {
      console.log("Aluno not found for ID:", alunoId);
      return NextResponse.json({ error: "Aluno not found" }, { status: 404 });
    }

    // Shape data (intacta)
    const data = {
      id: aluno.id,
      nome: aluno.nome, // ✅ "Henrique"
      foto: aluno.foto,
      objetivo: aluno.objetivo,
      treinosAtivos: treinosCount, // ✅ >0 se treinos
      ultimaMedida: ultimaMedida ? { peso: ultimaMedida.peso } : null,
      avaliacoes: avaliacoesCount,
      proximoTreino: null, // Temp
    };

    console.log(
      "✅ Dados do aluno carregados:",
      aluno.nome,
      "- Treinos:",
      data.treinosAtivos,
      "- Avaliações:",
      data.avaliacoes
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
