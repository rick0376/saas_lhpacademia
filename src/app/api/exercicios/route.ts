import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

// GET - Listar todos os exercícios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grupoMuscular = searchParams.get("grupoMuscular");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (session.user.role !== "SUPERADMIN") {
      // ✅ Se clienteId undefined, whereClause sem filtro (mostra todos? Ajuste lógica se precisar)
      if (session.user.clienteId) {
        whereClause.clienteId = session.user.clienteId;
      }
    }

    if (grupoMuscular) {
      whereClause.grupoMuscular = grupoMuscular;
    }

    if (search) {
      whereClause.nome = { contains: search, mode: "insensitive" };
    }

    const exercicios = await prisma.exercicio.findMany({
      where: whereClause,
      orderBy: [{ grupoMuscular: "asc" }, { nome: "asc" }],
    });

    return NextResponse.json(exercicios);
  } catch (error) {
    console.error("Erro ao buscar exercícios:", error);
    return NextResponse.json(
      { error: "Erro ao buscar exercícios" },
      { status: 500 }
    );
  }
}

// POST - Criar novo exercício
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Receber FormData
    const formData = await request.formData();

    const nome = formData.get("nome") as string;
    const grupoMuscular = formData.get("grupoMuscular") as string;
    const descricao = formData.get("descricao") as string;
    const video = formData.get("video") as string;
    const equipamento = formData.get("equipamento") as string;
    const imagemFile = formData.get("imagem") as File | null;

    console.log("📥 Recebendo dados do exercício:", {
      nome,
      grupoMuscular,
      temArquivo: !!imagemFile,
      nomeArquivo: imagemFile?.name || null,
    });

    // Validações básicas
    if (!nome || !grupoMuscular) {
      return NextResponse.json(
        { error: "Nome e grupo muscular são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ Validar GrupoMuscular
    const gruposMuscularesValidos = [
      "PEITO",
      "COSTAS",
      "OMBROS",
      "BICEPS",
      "TRICEPS",
      "PERNAS",
      "GLUTEOS",
      "ABDOMEN",
      "PANTURRILHA",
      "ANTEBRACO",
      "CARDIO",
      "FUNCIONAL",
    ];

    if (!gruposMuscularesValidos.includes(grupoMuscular)) {
      return NextResponse.json(
        { error: "Grupo muscular inválido" },
        { status: 400 }
      );
    }

    let imagemUrl: string | null = null;

    // Upload da imagem para Cloudinary
    if (imagemFile) {
      console.log("📤 Fazendo upload da imagem para Cloudinary...");

      const arrayBuffer = await imagemFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        imagemUrl = await uploadToCloudinary(
          buffer,
          "saas_academia/exercicios"
        );
        console.log("✅ Imagem enviada para Cloudinary:", imagemUrl);
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload da imagem" },
          { status: 500 }
        );
      }
    }

    // Salvar no banco
    console.log("💾 Salvando no banco de dados...");

    // ✅ Data para Prisma: Construa condicional para clienteId (omite se undefined)
    const data: any = {
      nome,
      grupoMuscular: grupoMuscular as any, // ✅ Cast para GrupoMuscular
      descricao: descricao || null,
      video: video || null,
      imagem: imagemUrl,
      equipamento: equipamento || null,
    };

    // ✅ Adicione clienteId só se definido (resolve type mismatch: evita string | undefined)
    if (session.user.clienteId) {
      data.clienteId = session.user.clienteId;
    }

    const novoExercicio = await prisma.exercicio.create({
      data, // ✅ Agora compatível com ExercicioCreateInput (clienteId omitido se undefined)
    });

    console.log("✅ Exercício criado com sucesso:", {
      id: novoExercicio.id,
      nome: novoExercicio.nome,
      imagemSalva: novoExercicio.imagem ? "SIM ✅" : "NÃO ❌",
    });

    return NextResponse.json(novoExercicio, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao criar exercício:", error);
    return NextResponse.json(
      { error: "Erro ao criar exercício" },
      { status: 500 }
    );
  }
}
