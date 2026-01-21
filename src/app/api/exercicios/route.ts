//api/exercicios/route.ts

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

    // Verificar permissão de ler exercícios (se não for SUPERADMIN)
    if (session.user.role !== "SUPERADMIN") {
      const permissao = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "exercicios",
          },
        },
      });

      if (!permissao || !permissao.ler) {
        return NextResponse.json(
          { error: "Sem permissão para listar exercícios" },
          { status: 403 },
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const grupoMuscular = searchParams.get("grupoMuscular");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (session.user.role !== "SUPERADMIN") {
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
      { status: 500 },
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

    // Verificar permissão de criar exercícios (se não for SUPERADMIN)
    if (session.user.role !== "SUPERADMIN") {
      const permissao = await prisma.permissao.findUnique({
        where: {
          usuarioId_recurso: {
            usuarioId: session.user.id,
            recurso: "exercicios",
          },
        },
      });

      if (!permissao || !permissao.criar) {
        return NextResponse.json(
          { error: "Sem permissão para criar exercícios" },
          { status: 403 },
        );
      }
    }

    const formData = await request.formData();
    const nome = formData.get("nome") as string;
    const grupoMuscular = formData.get("grupoMuscular") as string;
    const descricao = formData.get("descricao") as string;
    const video = formData.get("video") as string;
    const equipamento = formData.get("equipamento") as string;
    const imagemFile = formData.get("imagem") as File | null;

    if (!nome || !grupoMuscular) {
      return NextResponse.json(
        { error: "Nome e grupo muscular são obrigatórios" },
        { status: 400 },
      );
    }

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
        { status: 400 },
      );
    }

    let imagemUrl: string | null = null;

    if (imagemFile) {
      const arrayBuffer = await imagemFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        imagemUrl = await uploadToCloudinary(
          buffer,
          "saas_academia/exercicios",
        );
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload da imagem" },
          { status: 500 },
        );
      }
    }

    const data: any = {
      nome,
      grupoMuscular: grupoMuscular as any,
      descricao: descricao || null,
      video: video || null,
      imagem: imagemUrl,
      equipamento: equipamento || null,
      clienteId: formData.get("clienteId") as string,
    };

    const novoExercicio = await prisma.exercicio.create({
      data,
    });

    return NextResponse.json(novoExercicio, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao criar exercício:", error);
    return NextResponse.json(
      { error: "Erro ao criar exercício" },
      { status: 500 },
    );
  }
}
