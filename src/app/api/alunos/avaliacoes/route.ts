import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth/next"; // Descomente para auth real
// import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const alunoId = req.nextUrl.searchParams.get("alunoId");
  console.log("🔍 API /api/alunos/avaliacoes: Aluno ID:", alunoId);

  if (!alunoId) {
    console.log("❌ API: alunoId ausente");
    return NextResponse.json({ error: "alunoId obrigatório" }, { status: 400 });
  }

  // BYPASS TEMPORÁRIO (descomente para auth real quando session OK)
  // const session = await getServerSession(authOptions);
  // if (!session?.user || (session.user as any).aluno?.id !== alunoId) {
  //   console.log("❌ API: Não autorizado");
  //   return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  // }

  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { alunoId },
      orderBy: { data: "desc" }, // Mais recente primeiro
      select: {
        id: true,
        tipo: true,
        resultado: true, // Agora sincronizado no DB
        observacoes: true,
        arquivo: true, // URL PDF Cloudinary (null se ausente)
        data: true,
      },
    });

    console.log("✅ API: Avaliações encontradas:", avaliacoes.length);
    return NextResponse.json(avaliacoes); // [] se vazio, ou array com dados reais
  } catch (err: any) {
    console.error("❌ API Erro Prisma:", err.code || err.message || err);
    return NextResponse.json({ error: "Erro servidor" }, { status: 500 });
  }
}
