import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

// GET - Listar medidas do aluno
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const medidas = await prisma.medida.findMany({
      where: { alunoId: id },
      orderBy: { data: "desc" },
    });

    return NextResponse.json(medidas);
  } catch (error) {
    console.error("Erro ao buscar medidas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar medidas" },
      { status: 500 }
    );
  }
}

// POST - Adicionar nova medida
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // ✅ Receber FormData (múltiplos arquivos + campos)
    const formData = await request.formData();

    const peso = formData.get("peso") as string;
    const altura = formData.get("altura") as string;
    const peito = formData.get("peito") as string;
    const cintura = formData.get("cintura") as string;
    const quadril = formData.get("quadril") as string;
    const bracoDireito = formData.get("bracoDireito") as string;
    const bracoEsquerdo = formData.get("bracoEsquerdo") as string;
    const coxaDireita = formData.get("coxaDireita") as string;
    const coxaEsquerda = formData.get("coxaEsquerda") as string;
    const panturrilhaDireita = formData.get("panturrilhaDireita") as string;
    const panturrilhaEsquerda = formData.get("panturrilhaEsquerda") as string;
    const observacoes = formData.get("observacoes") as string;
    const totalFotos = parseInt((formData.get("totalFotos") as string) || "0");

    console.log("📥 Recebendo dados da medida:", {
      alunoId: id,
      peso,
      altura,
      totalFotos,
    });

    if (!peso || !altura) {
      return NextResponse.json(
        { error: "Peso e altura são obrigatórios" },
        { status: 400 }
      );
    }

    const fotosUrls: string[] = [];

    // ✅ FAZER UPLOAD DE TODAS AS FOTOS
    if (totalFotos > 0) {
      console.log(`📤 Fazendo upload de ${totalFotos} foto(s)...`);

      for (let i = 0; i < totalFotos; i++) {
        const fotoFile = formData.get(`foto${i}`) as File | null;

        if (fotoFile) {
          try {
            const arrayBuffer = await fotoFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const fotoUrl = await uploadToCloudinary(
              buffer,
              "saas_academia/medidas"
            );
            fotosUrls.push(fotoUrl);
            console.log(`✅ Foto ${i + 1}/${totalFotos} enviada: ${fotoUrl}`);
          } catch (uploadError) {
            console.error(
              `❌ Erro ao fazer upload da foto ${i + 1}:`,
              uploadError
            );
            // Continuar mesmo se uma foto falhar
          }
        }
      }

      console.log(
        `✅ Total de ${fotosUrls.length} foto(s) enviada(s) com sucesso`
      );
    }

    // ✅ SALVAR NO BANCO DE DADOS
    console.log("💾 Salvando medida no banco de dados...");

    const novaMedida = await prisma.medida.create({
      data: {
        alunoId: id,
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        peito: peito ? parseFloat(peito) : null,
        cintura: cintura ? parseFloat(cintura) : null,
        quadril: quadril ? parseFloat(quadril) : null,
        bracoDireito: bracoDireito ? parseFloat(bracoDireito) : null,
        bracoEsquerdo: bracoEsquerdo ? parseFloat(bracoEsquerdo) : null,
        coxaDireita: coxaDireita ? parseFloat(coxaDireita) : null,
        coxaEsquerda: coxaEsquerda ? parseFloat(coxaEsquerda) : null,
        panturrilhaDireita: panturrilhaDireita
          ? parseFloat(panturrilhaDireita)
          : null,
        panturrilhaEsquerda: panturrilhaEsquerda
          ? parseFloat(panturrilhaEsquerda)
          : null,
        observacoes: observacoes || null,
        fotos: fotosUrls, // ✅ Array vazio [] ou com URLs
      },
    });

    console.log("✅ Medida criada com sucesso:", {
      id: novaMedida.id,
      totalFotos: fotosUrls.length,
    });

    return NextResponse.json(novaMedida, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao adicionar medida:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar medida" },
      { status: 500 }
    );
  }
}
